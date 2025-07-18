import {get} from '@devsnc/snowdash';
import {partial} from '@devsnc/snowdash';
import {isFunction} from '@devsnc/snowdash';
import {getClientScript} from '../../../scriptLoader/registry';
import {internalActions} from '../../constants';
import getImports from './getImports';
import getDataBrokerOperationFunctions from './getDataBrokerOperationFunctions';
import getApiFactory from './getApiFactory';
import getMacroponentAccessApi from '../../macroponentAccessApi/index.js';
import getInternalEffect from '../../getInternalEffect.js';
import {default as console} from '../../../utils/getLogger';
import {mark, getInteractionId} from '@servicenow/ui-metrics';
import {getMacroponentInstance} from '../../registry/macroponentInstanceRegistry';
import resolveForConditional from '../../UxValueResolver/resolveForConditional';
import {isNil} from '@devsnc/snowdash';
import {isBoolean} from '@devsnc/snowdash';

import {mapValues} from '@devsnc/snowdash';

/**
 * @typedef { import('../../../types/MacroponentApi').ApiEvent } MacroponentEventApi
 */

const {SCRIPT_EXEC_REQUESTED} = internalActions;

const getResolvedConditional = (
	consolidatedEventMappings,
	action,
	macroponentPropertyDefinitions,
	csdbNodeId,
	externalControllerDependencies,
	controllerAliasMap,
	seismicProperties,
	seismicState,
	sourceAction
) => {
	const {
		payload: {
			scriptSysId: actionScriptSysId,
			sourceAction: {elementId: actionNodeId, name: actionEventName}
		},
		meta: {id: macroponentSysId}
	} = action;
	const {[actionEventName]: actionEventMappings} = consolidatedEventMappings;
	const actionEventMapping = (actionEventMappings || []).find(
		({nodeId, scriptSysId}) => {
			return nodeId === actionNodeId && scriptSysId === actionScriptSysId;
		}
	);
	const conditional = get(actionEventMapping, 'conditional', null);
	const resolvedConditional = isNil(conditional)
		? true
		: resolveForConditional(
				macroponentSysId,
				macroponentPropertyDefinitions,
				csdbNodeId,
				[],
				externalControllerDependencies,
				[],
				controllerAliasMap,
				seismicProperties,
				seismicState,
				sourceAction,
				conditional
		  );

	return resolvedConditional;
};

export default (
	csdbNodeId,
	pdbNodeIds,
	externalControllerDependencyNames,
	externalControllerDependencies,
	controllerAliasMap,
	{dataBrokers, dataElements},
	macroponentPropertyDefinitions,
	dispatchedEventNames = [],
	handledEventNames = [],
	rootHandledEventNames,
	consolidatedEventMappings,
	dispatchMcpUpdates = false
) => {
	const dataBrokerOperationFunctions = mapValues(
		dataBrokers,
		getDataBrokerOperationFunctions
	);
	const dataBrokerDefByElementId = mapValues(dataElements, 'definitionSysId');

	const getMacroponentAccessApiFn = partial(
		getMacroponentAccessApi,
		true,
		csdbNodeId,
		pdbNodeIds,
		externalControllerDependencyNames,
		externalControllerDependencies,
		macroponentPropertyDefinitions,
		controllerAliasMap,
		partial.placeholder,
		partial.placeholder,
		dataBrokerDefByElementId,
		dataBrokerOperationFunctions
	);

	return {
		name: 'execScript',
		actionHandlers: {
			[SCRIPT_EXEC_REQUESTED]: getInternalEffect({
				effect(coeffects) {
					const {action, host} = coeffects;
					const startTime = performance.now();
					const {
						dispatch,
						properties: seismicProperties,
						state: seismicState,
						updateState
					} = coeffects;
					const {nowId} = seismicProperties;

					const {
						payload: {scriptSysId, sourceAction},
						meta: {id: sourceComponentId}
					} = action;

					if (nowId !== sourceComponentId) {
						console.warn(
							`${SCRIPT_EXEC_REQUESTED} is an internal API and not available to component authors. Event mapping was ignored.`
						);
						return;
					}

					const clientScript = getClientScript(scriptSysId);

					const fnToExec = get(clientScript, ['fn']);
					const includeApiNames = get(clientScript, ['includes']);

					if (isFunction(fnToExec)) {
						const instance = getMacroponentInstance(host);
						if (instance.getApi === null) {
							instance.getApi = getApiFactory(
								dispatchedEventNames,
								handledEventNames,
								rootHandledEventNames,
								host,
								instance,
								getMacroponentAccessApiFn,
								dispatch,
								updateState,
								dispatchMcpUpdates
							);
						}
						const api = instance.getApi(seismicProperties, seismicState);

						/**
						 * @type MacroponentEventApi
						 */
						// fixme: add a proxy that prevents set
						const eventHandlerApi = {
							...api,
							event: {
								...sourceAction,
								eventInfo: {sourceElementId: sourceComponentId}
							},
							imports: getImports(seismicProperties, includeApiNames)
						};
						let resolvedConditional = getResolvedConditional(
							consolidatedEventMappings,
							action,
							macroponentPropertyDefinitions,
							csdbNodeId,
							externalControllerDependencyNames,
							controllerAliasMap,
							seismicProperties,
							seismicState,
							sourceAction
						);

						try {
							if (!isBoolean(resolvedConditional)) {
								console.error(
									'Event mapping conditional must be nil or resolve to a Boolean. Event mapping was ignored.'
								);
								resolvedConditional = false;
							}
							if (resolvedConditional) {
								fnToExec(eventHandlerApi);
								mark(host, getInteractionId(action.meta), 'CLIENT_SCRIPT', {
									startTime,
									name: 'EXEC_SCRIPT',
									sysId: scriptSysId
								});
							}
						} catch (e) {
							console.trace(e);
						}
					} else {
						console.error(`Unable to locate script (sys_id = ${scriptSysId})`);
					}
				}
			})
		}
	};
};
