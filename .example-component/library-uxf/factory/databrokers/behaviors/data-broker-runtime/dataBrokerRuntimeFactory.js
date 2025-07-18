import {actionTypes, propertyTypes} from './constants';
import {isEmpty} from '@devsnc/snowdash';
import {get} from '@devsnc/snowdash';
import {has} from '@devsnc/snowdash';
import {negate} from '@devsnc/snowdash';
import {partial} from '@devsnc/snowdash';
import {uniqBy} from '@devsnc/snowdash';
import {filter} from '@devsnc/snowdash';
import {values} from '@devsnc/snowdash';
import {map} from '@devsnc/snowdash';
import {isEqual} from '@devsnc/snowdash';

import getProperties from './getProperties';
import {
	getDbLifecycleFetchingProp,
	getDbLifecycleFetchSuccessProp,
	getDbOutputProp,
	getControllerDependencyProp
} from '../../../utils';
import {
	internalActions as macroponentInternalActions,
	publicDispatchedActionNames as macroponentDispatchedActionNames,
	STATE_IDENTIFIER,
	MACROPONENT_VALUE_UPDATED
} from '../../../constants';
import {
	getInternalEffect,
	dispatchInternalAction
} from '../../../getInternalEffect';

import getHydratedPipeline from './getHydratedPipeline';
import {
	default as createDataBrokerExecHandlers,
	signalDBExecCompleteLifecycle,
	handleDBLifecyleForPrefetch
} from './dataBrokerExecHandlers';
import getDataBrokerOperationHandlers from './getDataBrokerOperationHandlers';
import {default as console} from '../../../../utils/getLogger.js';

import {
	refreshPipeline,
	debouncedRefreshPipeline
} from './getRefreshPipelineFn.js';
import {isObject} from '@devsnc/snowdash';
import {
	computeHash,
	getCacheKey,
	getDBCacheHandle,
	IS_CACHE_STORAGE_API_AVAILABLE_PROMISE
} from '../../../../utils/clientCacheUtils';

const {
	DB_ENGINE_EXEC_REQUESTED,
	DB_ENGINE_EXEC_REQUESTED_WITH_RECORDING,
	UXF_DB_REFRESH_REQUESTED,
	UXF_DB_REFRESH_REQUESTED_INITIAL_VALUE,
	UXF_DB_REFRESH_RELATED_REQUESTED,
	UXF_DB_OP_EXEC_REQUESTED,
	UXF_DB_DATA_RECEIVED,
	UXF_DB_INPUT_CHANGED,
	DATA_FETCH_INITIATED,
	DATA_FETCH_SUCCEEDED,
	DATA_FETCH_FAILED,
	DATA_OP_INITIATED,
	DATA_OP_SUCCEEDED,
	DATA_OP_FAILED
} = actionTypes;

const {JSON_LITERAL, DATA_CHAIN_BINDING} = propertyTypes;

const {MACROPONENT_STATE_UPDATED} = macroponentInternalActions;

const {MACROPONENT_READY, MACROPONENT_PROPERTY_CHANGED} =
	macroponentDispatchedActionNames;

const BEHAVIOR_NAME = 'dataBrokerRuntime';

const MEM_DBCACHE = {};
const isCachePrimed = (id) => get(MEM_DBCACHE, id);

const primeDatabrokerCache = (pipelineId, hydratedPipeline, ttl) => {
	MEM_DBCACHE[pipelineId] = {
		pipelineId,
		hydratedPipeline,
		hash: computeHash(hydratedPipeline),
		ttl
	};
};

const getCachePolicy = (pipelineDefinitions) => {
	if (isEmpty(pipelineDefinitions) || pipelineDefinitions.length === 0) return;

	if (pipelineDefinitions.length === 1) {
		const {active, policy, ttl} = pipelineDefinitions[0].cachePolicy || {};
		return {active, policy, ttl};
	}
	const active =
		pipelineDefinitions.filter((pd) => pd?.cachePolicy?.active === true)
			.length === pipelineDefinitions.length;
	const policy =
		new Set(pipelineDefinitions.map((pd) => pd?.cachePolicy?.policy)).size === 1
			? pipelineDefinitions[0]?.cachePolicy?.policy
			: undefined;
	const ttl = pipelineDefinitions
		.map((pd) => pd?.cachePolicy?.ttl)
		.reduce((acc, val) => (acc < val ? acc : val));
	return {active, policy, ttl};
};

async function saveToCacheWithTTL(pipelineId, result, ttl) {
	const cacheKey = getCacheKey(pipelineId, result.hash);
	const dbCache = await getDBCacheHandle();
	await dbCache.put(
		cacheKey,
		new Response(JSON.stringify(result), {
			headers: {
				'content-type': 'application/json'
			}
		})
	);
	setTimeout(() => dbCache.delete(cacheKey), ttl);
}

const getDataOutputPropsToUpdate = (
	pipelineDefinitions,
	pipelineId,
	pipelineOutput
) => {
	return get(pipelineDefinitions, pipelineId, [])
		.filter((definition) =>
			pipelineOutput.some(
				(output) => output.sysId === definition.definitionSysId
			)
		)
		.filter((_, index) => has(pipelineOutput, [index, 'executionResult']))
		.map((dbDef) => get(dbDef, 'id'))
		.filter(negate(isEmpty))
		.map(getDbOutputProp)
		.map((propName, index) => {
			const output = get(pipelineOutput, [index, 'executionResult']);
			return {
				[propName]: output
			};
		})
		.reduce(
			(acc, propToUpdate) => ({
				...acc,
				...propToUpdate
			}),
			{}
		);
};

const getPipelinesToRefresh = (inputDependencies, changedInput) => {
	const {namespace, propName} = changedInput;
	return get(inputDependencies, [namespace, propName], []);
};

const getPipelinesFromDefListContainingId = (pipelineDefs, brokerElemId) => {
	return !brokerElemId
		? []
		: Object.entries(pipelineDefs)
				.filter(([id]) => `->${id}->`.indexOf(`->${brokerElemId}->`) > -1)
				.map(([id, definition]) => ({id, definition}));
};

const getOpExecRequestOrigin = (coeffects) => {
	if (!has(coeffects, 'action.payload.data[0]')) return;
	const {
		action: {
			payload: {data},
			meta
		}
	} = coeffects;
	return {
		requestType: UXF_DB_OP_EXEC_REQUESTED,
		requestId: data[0].parentResourceId + '#' + meta.operationName
	};
};

const getRefreshRequestOrigin = (pipelineId) => {
	return {
		requestType: UXF_DB_REFRESH_REQUESTED,
		requestId: pipelineId
	};
};

const getLifecycleUpdatePayload = (dataElemId, fetching, prevSuccess) => {
	const fetchingProp = getDbLifecycleFetchingProp(dataElemId);
	const prevSuccessProp = getDbLifecycleFetchSuccessProp(dataElemId);
	let updatePayload = {};
	if (prevSuccess !== undefined) updatePayload[prevSuccessProp] = !!prevSuccess;
	if (fetching !== undefined) updatePayload[fetchingProp] = !!fetching;
	return updatePayload;
};

const getInputDependencies = (
	dataPipelines,
	dataShell,
	externalControllers
) => {
	// This function augments the incoming inputDependencies with the list of data resources
	// that are dependent on things like external controller dependencies, so that the client can
	// re-trigger dependent data resources as dependent controller outputs update.
	const dependency = externalControllers.reduce(
		(dependencyAcc, externalController) => {
			const outputProps = externalController.dependencyProps.reduce(
				(outputPropsAcc, outputProp) => {
					//Find data resources that depend on this
					const matchingDataResources = Object.keys(
						dataShell.dataElements
					).filter((dataElementId) => {
						const dataElement = dataShell.dataElements[dataElementId];
						// eslint-disable-next-line no-unused-vars
						for (const [_, uxValue] of Object.entries(
							dataElement.inputValues
						)) {
							if (
								uxValue.type === 'DATA_OUTPUT_BINDING' &&
								uxValue.binding.address.length >= 2 &&
								uxValue.binding.address[0] === externalController.name &&
								uxValue.binding.address[1] === outputProp
							) {
								return true;
							}
						}

						return false;
					});

					if (matchingDataResources.length === 0) {
						return outputPropsAcc;
					}

					//If we found at least 1, put it in the accumulator
					const dependencyName = getControllerDependencyProp(
						externalController.name,
						outputProp
					);
					outputPropsAcc[dependencyName] = matchingDataResources;
					return outputPropsAcc;
				},
				{}
			);

			return {
				...dependencyAcc,
				...outputProps
			};
		},
		{}
	);

	return {
		...dataPipelines.inputDependencies,
		dependency
	};
};

const hasInputDependencies = (inputDependencies, path) =>
	get(inputDependencies, path, []).length > 0;

const isNotExternalRESTDataBroker = (pipelineId, pipelineDefinition) =>
	pipelineDefinition.filter(
		(definition) =>
			definition.id === pipelineId && definition.type !== 'REST_EXTERNAL'
	).length;

const getPipelineMeta = (
	pipelineId,
	pipelineDefinition,
	pipelineResolverDependencies
) =>
	pipelineDefinition.reduce((acc, definition) => {
		if (definition.id === pipelineId && definition.type === 'REST_EXTERNAL') {
			acc = {
				pipelineType: definition.type,
				pipelineSysId: definition.definitionSysId,
				pipelineResolverDependencies
			};
		}
		return acc;
	}, {});

export default (
	clientStateDataBrokerNode,
	dataShell,
	dataPipelines,
	csdbNodeId,
	pdbNodeIds,
	externalControllerDependencyNames,
	externalControllerDependencies,
	isControllerMacroponent,
	trackDBLifecycleFn,
	prefetchDatabrokerPromises = {},
	mcpSysId,
	proxyDataBrokerNodes,
	controllerAliasMap,
	dispatchMcpUpdates = false
) => {
	const hasPdbNode = pdbNodeIds?.length > 0;

	const {pipelineDefinitions} = dataPipelines;
	const getDataOutputPropsToUpdateFn = partial(
		getDataOutputPropsToUpdate,
		pipelineDefinitions
	);
	const getPipelinesContaining = partial(
		getPipelinesFromDefListContainingId,
		pipelineDefinitions
	);

	const inputDependencies = getInputDependencies(
		dataPipelines,
		dataShell,
		externalControllerDependencies
	);

	const {dataElements} = dataShell;

	return {
		name: BEHAVIOR_NAME,
		properties: {
			evaluatedDataBrokers: {
				default: '{}'
			},
			...getProperties(values(dataElements))
		},
		actionHandlers: {
			...createDataBrokerExecHandlers(pipelineDefinitions),
			...getDataBrokerOperationHandlers(
				clientStateDataBrokerNode,
				dataShell,
				hasPdbNode,
				externalControllerDependencyNames,
				isControllerMacroponent
			),
			[MACROPONENT_PROPERTY_CHANGED]: getInternalEffect({
				effect(coeffects) {
					const {
						dispatch,
						action: {
							payload: {name}
						}
					} = coeffects;

					const namespace = name.startsWith('depNowUxf')
						? 'dependency'
						: 'context--props';

					if (!hasInputDependencies(inputDependencies, [namespace, name]))
						return;

					dispatchInternalAction(dispatch, UXF_DB_INPUT_CHANGED, {
						namespace,
						propName: name
					});
				}
			}),
			[MACROPONENT_STATE_UPDATED]: getInternalEffect({
				effect(coeffects) {
					const {
						dispatch,
						action: {
							payload: {statePropertyName}
						}
					} = coeffects;

					if (
						!hasInputDependencies(inputDependencies, [
							STATE_IDENTIFIER,
							statePropertyName
						])
					)
						return;

					dispatchInternalAction(dispatch, UXF_DB_INPUT_CHANGED, {
						namespace: STATE_IDENTIFIER,
						propName: statePropertyName
					});
				}
			}),
			[MACROPONENT_READY]: getInternalEffect({
				effect({dispatch, state}) {
					const {evaluatedDataBrokers} = state.properties;
					let parsedDataBrokerEvaluation = {};
					try {
						parsedDataBrokerEvaluation = isObject(evaluatedDataBrokers)
							? evaluatedDataBrokers
							: JSON.parse(evaluatedDataBrokers);
					} catch (e) {
						console.warn(
							'Skipped invalid JSON content in data broker evaluation.'
						);
					}
					map(pipelineDefinitions, (definition, id) => {
						if (parsedDataBrokerEvaluation[id]) {
							console.info(
								'[db] using pre-evaluated data broker :',
								parsedDataBrokerEvaluation[id]
							);
							dispatchInternalAction(
								dispatch,
								UXF_DB_DATA_RECEIVED,
								{
									id,
									output: parsedDataBrokerEvaluation[id]
								},
								{pipelineDefinition: definition}
							);
						} else if (
							definition.some((def) => def.readEvaluationMode !== 'EXPLICIT')
						) {
							if (definition.length === 1) {
								const {active, policy, initialValue, delay} =
									definition[0]?.cachePolicy || {};
								if (
									active === true &&
									policy === 'NETWORK_ONLY' &&
									!isEmpty(initialValue)
								) {
									console.info('[db] Using initialValue: ', initialValue);
									const origin = {
										requestType: UXF_DB_REFRESH_REQUESTED_INITIAL_VALUE,
										requestId: id
									};
									dispatchInternalAction(
										dispatch,
										UXF_DB_DATA_RECEIVED,
										{
											id: id,
											output: initialValue,
											origin
										},
										{pipelineDefinition: definition}
									);
									if (delay > 0) {
										setTimeout(() => {
											console.log(
												`[db] Firing UXF_DB_REFRESH_REQUESTED for id: ${id} after delay: ${delay}`
											);
											dispatchInternalAction(
												dispatch,
												UXF_DB_REFRESH_REQUESTED,
												{
													id,
													definition
												}
											);
										}, delay);
										return;
									}
								}
							}
							dispatchInternalAction(dispatch, UXF_DB_REFRESH_REQUESTED, {
								id,
								definition
							});
						}
					});
				}
			}),
			[UXF_DB_INPUT_CHANGED]: getInternalEffect({
				effect(coeffects) {
					const {
						dispatch,
						action: {payload},
						host
					} = coeffects;

					getPipelinesToRefresh(inputDependencies, payload)
						.map((pipelineId) => ({
							id: pipelineId,
							definition: pipelineDefinitions[pipelineId]
						}))
						.map(partial(debouncedRefreshPipeline, host, dispatch));
				}
			}),
			[UXF_DB_REFRESH_RELATED_REQUESTED]: getInternalEffect({
				effect(coeffects) {
					const {
						dispatch,
						action: {
							payload: {id}
						}
					} = coeffects;

					const pipelinesToRefresh = getPipelinesContaining(id);
					pipelinesToRefresh.forEach((pipeline) => {
						refreshPipeline(dispatch, pipeline);
					});
				}
			}),
			[UXF_DB_REFRESH_REQUESTED]: getInternalEffect({
				effect: async (coeffects) => {
					const {
						dispatch,
						action: {
							payload: {id: pipelineId, definition: pipelineDefinition}
						},
						properties: seismicProperties,
						state: seismicState
					} = coeffects;
					const hydratedPipeline = getHydratedPipeline(
						pipelineDefinition,
						seismicProperties,
						seismicState,
						csdbNodeId,
						pdbNodeIds,
						externalControllerDependencyNames
					);
					console.info('[db] data requested:', hydratedPipeline);
					const origin = getRefreshRequestOrigin(pipelineId);
					const {active, policy, ttl} = getCachePolicy(pipelineDefinition);
					if (
						prefetchDatabrokerPromises[pipelineId] &&
						isEqual(
							hydratedPipeline,
							prefetchDatabrokerPromises[pipelineId].hydratedPipeline
						)
					) {
						const prefetchPromise =
							prefetchDatabrokerPromises[pipelineId].prefetchPromise;
						prefetchPromise
							.then(async (prefetchResponse) => {
								console.info(
									`Using databroker prefetch response for pipeline ${pipelineId}: `,
									prefetchResponse
								);
								if (
									active === true &&
									policy === 'CACHE_ONLY' &&
									ttl > 0 &&
									(await IS_CACHE_STORAGE_API_AVAILABLE_PROMISE)
								) {
									primeDatabrokerCache(pipelineId, hydratedPipeline, ttl);
								}
								const {
									data: {result}
								} = prefetchResponse;
								handleDBLifecyleForPrefetch(
									dispatch,
									origin,
									pipelineId,
									result,
									pipelineDefinition
								);
							})
							.catch((error) => {
								console.error(
									`Databroker exec prefetch call failed for pipelineId: ${pipelineId}`,
									error
								);
								handleDBLifecyleForPrefetch(
									dispatch,
									origin,
									pipelineId,
									[],
									pipelineDefinition
								);
							});
						delete prefetchDatabrokerPromises[pipelineId];
						return;
					}

					if (
						active === true &&
						policy === 'CACHE_ONLY' &&
						ttl > 0 &&
						(await IS_CACHE_STORAGE_API_AVAILABLE_PROMISE) &&
						isNotExternalRESTDataBroker(pipelineId, pipelineDefinition)
					) {
						const cacheKey = getCacheKey(
							pipelineId,
							computeHash(hydratedPipeline)
						);
						const dbCache = await getDBCacheHandle();
						let response = await dbCache.match(cacheKey);
						if (response) {
							const responseJson = await response.json();
							const {executionResult, timestamp} = responseJson;
							if (Date.now() - timestamp < ttl) {
								dispatchInternalAction(
									dispatch,
									UXF_DB_DATA_RECEIVED,
									{
										id: pipelineId,
										output: executionResult,
										origin
									},
									{pipelineDefinition}
								);
								return;
							}
						}
						primeDatabrokerCache(pipelineId, hydratedPipeline, ttl);
					}

					const shouldRecord =
						filter(pipelineDefinition, (broker) => {
							return (
								filter(broker.inputValues, (inputValue) => {
									const inputType = get(inputValue, 'type');
									return !(
										inputType == JSON_LITERAL || inputType == DATA_CHAIN_BINDING
									);
								}).length > 0
							);
						}).length == 0;
					dispatch(
						// fixme: dispatch this through dispatchInternalAction
						shouldRecord
							? DB_ENGINE_EXEC_REQUESTED_WITH_RECORDING
							: DB_ENGINE_EXEC_REQUESTED,
						{
							data: hydratedPipeline
						},
						{
							pipelineId,
							origin,
							...getPipelineMeta(pipelineId, pipelineDefinition, {
								mcpSysId,
								csdbNodeId,
								pdbNodeIds,
								externalControllerDependencies,
								proxyDataBrokerNodes,
								controllerAliasMap
							})
						}
					);
				}
			}),
			[UXF_DB_OP_EXEC_REQUESTED]: getInternalEffect({
				effect(coeffects) {
					const {
						dispatch,
						action: {
							payload: {data}
						}
					} = coeffects;
					console.info('[db] op exec requested:', data);
					const origin = getOpExecRequestOrigin(coeffects);
					let meta = origin ? {origin} : {};
					dispatch(DB_ENGINE_EXEC_REQUESTED, {data}, meta); // fixme: dispatch this through dispatchInternalAction
				}
			}),
			[UXF_DB_DATA_RECEIVED]: getInternalEffect({
				effect: async ({dispatch, updateProperties, action}) => {
					const {id, output, origin} = action.payload;
					const {pipelineDefinition} = action.meta;

					console.info('[db] data received:', action.payload);
					if (
						get(origin, 'requestType') ===
						UXF_DB_REFRESH_REQUESTED_INITIAL_VALUE
					) {
						updateProperties({[getDbOutputProp(id)]: {output}});
						return;
					}

					// save to database
					if (
						isCachePrimed(id) &&
						isNotExternalRESTDataBroker(id, pipelineDefinition)
					) {
						MEM_DBCACHE[id].executionResult = output;
						MEM_DBCACHE[id].timestamp = Date.now();
						await saveToCacheWithTTL(id, MEM_DBCACHE[id], MEM_DBCACHE[id].ttl);
						delete MEM_DBCACHE[id];
					}

					const outputPropsToUpdateRes = getDataOutputPropsToUpdateFn(
						id,
						output
					);
					updateProperties(outputPropsToUpdateRes);

					// dispatch an action for UIB WYSIWYG state to notify them of the updated data broker output
					if (dispatchMcpUpdates) {
						dispatch(MACROPONENT_VALUE_UPDATED, {
							macroponentSysId: mcpSysId,
							data: {
								[id]: Object.values(outputPropsToUpdateRes)[0]
							}
						});
					}

					// trigger refresh, for parent resource, if applicable
					const parentResourceIds = output
						.filter((singleResult) => has(singleResult, 'parentResourceId'))
						.map((singleResult) => singleResult.parentResourceId);
					const pipelinesToRefresh = uniqBy(
						parentResourceIds
							.map(getPipelinesContaining)
							.reduce((acc, pipelineSet) => [...acc, ...pipelineSet], []),
						'id'
					);
					pipelinesToRefresh.forEach((pipeline) => {
						refreshPipeline(dispatch, pipeline);
					});
					signalDBExecCompleteLifecycle(
						dispatch,
						origin,
						output,
						true,
						pipelineDefinition
					);
				}
			}),
			[DATA_FETCH_INITIATED]: {
				// databroker lifecycle tracking effect:
				effect({updateProperties, action}) {
					const {dataElemId} = action.payload;
					trackDBLifecycleFn(dataElemId)
						? updateProperties(getLifecycleUpdatePayload(dataElemId, true))
						: null;
				},
				stopPropagation: true
			},
			[DATA_FETCH_SUCCEEDED]: {
				// databroker lifecycle tracking effect:
				effect({updateProperties, action}) {
					const {dataElemId} = action.payload;
					trackDBLifecycleFn(dataElemId)
						? updateProperties(
								getLifecycleUpdatePayload(dataElemId, false, true)
						  )
						: null;
				},
				stopPropagation: true
			},
			[DATA_FETCH_FAILED]: {
				// databroker lifecycle tracking effect:
				effect({updateProperties, action}) {
					const {dataElemId} = action.payload;
					trackDBLifecycleFn(dataElemId)
						? updateProperties(
								getLifecycleUpdatePayload(dataElemId, false, false)
						  )
						: null;
				},
				stopPropagation: true
			},
			[DATA_OP_INITIATED]: {
				stopPropagation: true
			},
			[DATA_OP_SUCCEEDED]: {
				stopPropagation: true
			},
			[DATA_OP_FAILED]: {
				stopPropagation: true
			}
		}
	};
};
