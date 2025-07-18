import {actionTypes} from '@servicenow/ui-core';
import {mark, getInteractionId} from '@servicenow/ui-metrics';

const {
	COMPONENT_PROPERTY_CHANGED,
	COMPONENT_BOOTSTRAPPED,
	COMPONENT_CONNECTED,
	COMPONENT_DISCONNECTED
} = actionTypes;

import getTemplates from '../../../templateLoader/getTemplates';
import {isEmpty} from '@devsnc/snowdash';
import {assign} from '@devsnc/snowdash';
import {get} from '@devsnc/snowdash';
import {set} from '@devsnc/snowdash';
import {defaultTo} from '@devsnc/snowdash';
import {has} from '@devsnc/snowdash';
import {findKey} from '@devsnc/snowdash';
import {isEqual} from '@devsnc/snowdash';
import {isMap} from '@devsnc/snowdash';
import omit from 'lodash/omit';
import cuid from 'cuid';

import {
	evaluateScriptedConditionsEffect,
	evaluateRouteScriptedConditions
} from './viewportRuntimeEffects';
import {
	getConditionProperties,
	getBasePath,
	getViewportElementIds,
	includeScreenKey,
	uniqueScreenKey
} from './utils';
import {primeTemplateCache} from './primeTemplateCache';
import {updateRouteCollectionState} from './updateRouteCollectionState';
import registerScreenActionTransformer from './registerScreenActionTransformer';
import {getScreenQualifierFunction} from './evaluateScreenCondition';
import {default as console} from '../../../utils/getLogger.js';
import {dispatchInternalAction} from '../../getInternalEffect.js';
import {
	viewportActions,
	publicDispatchedActionNames,
	SIGNAL_VIEWPORT_LOAD_COMPLETION,
	COMPOSITION_ELEMENT_ID,
	CONTAINING_MACROPONENT_SYS_ID,
	META_PROP_NAME_APP_CONFIG_SYS_ID,
	UXF_MACROPONENT_OUTPUT_PROPERTY_UPDATED
} from '../../../factory/constants';
import getViewportElementsAffectedByDataOutputProp from './getViewportElementsAffectedByDataOutputProp';
import {getPlaceholderPropName} from '../../UxValueResolver/getResolvedBindingWithState';
import {ScriptedRequestsCache} from './caches';
import {isNil} from '@devsnc/snowdash';

const {
	MACROPONENT_VIEWPORT_LOAD_COMPLETED,
	MACROPONENT_VIEWPORT_ROUTE_INITIALIZATION_COMPLETED
} = publicDispatchedActionNames;

const {
	UXF_VIEWPORT_RENDER,
	UXF_VIEWPORT_RENDER_BY_ID,
	UXF_VIEWPORT_DISMISS,
	UXF_VIEWPORT_SCRIPTED_CONDITIONS_EVALUATION_REQUESTED,
	UXF_VIEWPORT_SCRIPTED_CONDITIONS_EVALUATION_COMPLETED,
	UXF_VIEWPORT_ROUTE_SCRIPTED_CONDITIONS_EVALUATION_REQUESTED,
	UXF_VIEWPORT_ROUTE_SCRIPTED_CONDITIONS_EVALUATION_COMPLETED,
	UXF_VIEWPORT_CALCULATE_ROUTES,
	UXF_VIEWPORT_ROUTE_INITIALIZATION_COMPLETED
} = viewportActions;

const threshold = 250; // ms
const scriptedConditonsLastRequestCache = new Map();
const SCRIPTED_ROUTE_CACHE_KEY = 'behaviors.viewportRuntime.scriptedRouteCache';
const SCRIPTED_CONDITIONS_CACHE_KEY =
	'behaviors.viewportRuntime.scriptedConditionsCache';

export function getScriptedScreenCondtionRequestObject(
	macroponentPropertyDefs,
	extensionPoint,
	getResolvedDataBindingFn,
	{
		watchedProperties = {},
		id: screenId,
		scriptedConditionParameterFilters = {}
	},
	seismicProperties,
	fieldsInPayload,
	paramsInPayload
) {
	if (extensionPoint) {
		const resolvedWatchedProperties = Object.entries(watchedProperties).reduce(
			(acc, [key, uxValue]) => {
				const value = getResolvedDataBindingFn(uxValue, seismicProperties);
				acc[key] = value;
				return acc;
			},
			{}
		);
		const isAtleastOnePropPresent = Object.values(
			resolvedWatchedProperties
		).some((val) => !isNil(val));

		// Short circuit return - If all input properties are null/undefined, there is no point in sending it in an evaluation request.
		if (!isAtleastOnePropPresent && !isEmpty(watchedProperties)) return;

		return {
			version: '2',
			inputProperties: {
				data: resolvedWatchedProperties,
				payload: fieldsInPayload
			},
			screenId
		};
	} else {
		const inputParams = {
			...getConditionProperties(macroponentPropertyDefs, seismicProperties),
			...fieldsInPayload,
			...paramsInPayload
		};

		const processedInputParams = filterConditionParameters(
			inputParams,
			scriptedConditionParameterFilters
		);

		return {
			version: '1',
			inputProperties: processedInputParams,
			screenId
		};
	}
}

function filterConditionParameters(params, paramFilters) {
	//DEF0301790 - removing userPrefs from scripted condition payload due to large size
	const paramsWithoutUserPrefs = omit(params, 'userPrefs');
	const conditionParamFilters = Object.values(paramFilters);
	if (conditionParamFilters.length > 0) {
		return conditionParamFilters.reduce((acc, paramFilters) => {
			paramFilters.forEach((jsonPath) => {
				acc = set(acc, jsonPath, get(paramsWithoutUserPrefs, jsonPath));
			});
			return acc;
		}, {});
	}
	return paramsWithoutUserPrefs;
}

function filterInputProperties(inputProps) {
	try {
		const inputPropsFieldsKeys = inputProps?.detailsProps?.fields
			? Object.keys(inputProps?.detailsProps?.fields)
			: [];
		const inputPropsFieldsKeysArray = inputPropsFieldsKeys?.map(
			(fieldName) => `detailsProps.fields.${fieldName}.declarativeUiActions`
		);
		const propsToOmit = [
			'tabRoutes',
			'activityLogs',
			'detailsProps.activityStream',
			...inputPropsFieldsKeysArray
		];
		return omit(inputProps, propsToOmit);
	} catch (e) {
		return inputProps;
	}
}

/**
 * @typedef {import("../../../types/internals/ViewportRuntime").ViewportContent} ViewportContent
 * @typedef {import("../../../types/internals/ViewportRuntime").Screen} Screen
 */

/*
 * FixMe:
 * Viewport runtime behavior makes use of "useScreenKey" based on the presence of
 * sn-uxf-viewport-screen node in macroponent. In future we will enable the
 * configuration through the metadata.
 */
export default (
	definitionSubroutes = [],
	macroponentProperties = {},
	useScreenKey = false,
	prefetchLimits = {},
	withAppConfigAgnosticSubRoutes,
	uxfViewportModalMap,
	getResolvedDataBindingFn,
	descendants = {}
) => {
	let viewportTransactions = {};

	// This is tracked per-macroponent definition, but we attempt priming the cache (lazily) when the first instance is bootstrapped.
	let isTemplateCachePrimingAttempted = false;

	// This is identical to what we do in glide, and must not be changed without a corresponding change there
	function getInstanceSubroutes(instanceAppConfigSysId) {
		if (!withAppConfigAgnosticSubRoutes) return definitionSubroutes;

		if (isEmpty(instanceAppConfigSysId)) return definitionSubroutes;

		return definitionSubroutes.filter(({appConfigSysId = null}) => {
			if (!isEmpty(appConfigSysId) && instanceAppConfigSysId !== appConfigSysId)
				return false;
			return true;
		});
	}

	function isDuplicateScriptedConditionRequest(scriptedRoutes, nowId) {
		const scriptedConditonsLastRequestData =
			scriptedConditonsLastRequestCache.get(nowId);
		if (scriptedConditonsLastRequestData) {
			const withinThreshold =
				Date.now() - scriptedConditonsLastRequestData.timestamp < threshold;
			const areFilteredObjectsEqual = isEqual(
				scriptedRoutes,
				scriptedConditonsLastRequestData.scriptedRoutes
			);
			return areFilteredObjectsEqual && withinThreshold;
		}

		return false;
	}

	function sysPropInputPropsTrimmingDisabled() {
		return (
			get(
				window,
				[
					'ux_globals',
					'libuxf',
					'sysprops',
					'glide.uxf.lib.scriptedcondition.inputprops.trimming.disable'
				],
				'false'
			) === 'true'
		);
	}

	function getScriptedRouteConditionRequest(
		scriptedRoutes,
		nonExtensionPointRoutesExist
	) {
		if (nonExtensionPointRoutesExist) {
			let firstInputPropertiesEncountered = false;

			for (const route in scriptedRoutes) {
				if (route in scriptedRoutes) {
					scriptedRoutes[route] = scriptedRoutes[route].map((screen) => {
						if (screen.version === '1') {
							// Replace inputProperties with an empty object if it's not the first instance
							if (firstInputPropertiesEncountered) {
								screen.inputProperties = {};
							} else {
								if (!sysPropInputPropsTrimmingDisabled()) {
									screen.inputProperties = filterInputProperties(
										screen.inputProperties
									);
								}
								firstInputPropertiesEncountered = true;
							}
						}
						return screen;
					});
				}
			}
		}

		return scriptedRoutes;
	}

	const descendantElementIds = Object.keys(descendants);
	const viewportElementsAffectedByDataOutputProp =
		getViewportElementsAffectedByDataOutputProp(
			definitionSubroutes.filter((subroute) =>
				descendantElementIds.includes(subroute.parentCompositionElementId)
			)
		);

	const inFlightScriptedScreenConditions = new Map();

	/**
	 *ckiiwfdnffoaaaabbbbddghhdamgvmbbbba: [{route: "overview"}, {route: "active-work"}]
	 *
	 */
	const addInFlightScriptedScreenConditionEvaluation = (
		viewportElementId,
		route
	) => {
		if (inFlightScriptedScreenConditions.has(viewportElementId)) {
			const existingInFlightSSCRoutes =
				inFlightScriptedScreenConditions.get(viewportElementId);
			existingInFlightSSCRoutes.push({route});
			inFlightScriptedScreenConditions.set(
				viewportElementId,
				existingInFlightSSCRoutes
			);
		} else {
			inFlightScriptedScreenConditions.set(
				viewportElementId,
				new Array({route})
			);
		}
	};

	const markInFlightScriptedScreenConditionEvaluation = (
		viewportElementId,
		route
	) => {
		const scriptedScreenConditionRoutes =
			inFlightScriptedScreenConditions.get(viewportElementId);

		if (!isEmpty(scriptedScreenConditionRoutes)) {
			const inFlightSSCRoutes = scriptedScreenConditionRoutes.filter(
				(r) => r.route !== route
			);

			if (isEmpty(inFlightSSCRoutes)) {
				inFlightScriptedScreenConditions.delete(viewportElementId);
			} else {
				inFlightScriptedScreenConditions.set(
					viewportElementId,
					inFlightSSCRoutes
				);
			}
		}
	};

	return {
		name: 'viewportRuntime',
		setInitialState({properties}) {
			const subroutes = getInstanceSubroutes(
				properties[META_PROP_NAME_APP_CONFIG_SYS_ID]
			).filter((s) => !isEmpty(s.parentCompositionElementId));

			if (!isEmpty(subroutes)) {
				return {
					/** @type {Object.<string, ViewportContent>} */
					viewports: {},
					/** @type {Object} */
					scriptedRouteCache: new ScriptedRequestsCache(),
					/** @type {Object} */
					scriptedConditionsCache: new ScriptedRequestsCache()
				};
			}
		},
		actionHandlers: {
			[COMPONENT_BOOTSTRAPPED]: {
				effect: ({properties}) => {
					if (!isTemplateCachePrimingAttempted) {
						isTemplateCachePrimingAttempted = true;
						primeTemplateCache(
							getInstanceSubroutes(
								properties[META_PROP_NAME_APP_CONFIG_SYS_ID]
							),
							prefetchLimits,
							useScreenKey
						);
					}
				},
				stopPropagation: true
			},
			[COMPONENT_CONNECTED]: {
				effect: ({dispatch, properties}) => {
					const subroutes = getInstanceSubroutes(
						properties[META_PROP_NAME_APP_CONFIG_SYS_ID]
					).filter((s) => !isEmpty(s.parentCompositionElementId));

					if (!isEmpty(subroutes)) {
						dispatch(UXF_VIEWPORT_CALCULATE_ROUTES, {
							sourceActionName: COMPONENT_CONNECTED,
							sourceActionPayload: {properties}
						});
					}
				},
				stopPropagation: true
			},
			[COMPONENT_DISCONNECTED]: {
				effect: ({state}) => {
					const clearCache = (cacheName) => {
						const cacheMap = get(state, [
							'behaviors',
							'viewportRuntime',
							cacheName
						]);
						if (isMap(cacheMap)) {
							cacheMap.clear();
						}
					};
					['scriptedRouteCache', 'scriptedConditionsCache'].map(clearCache);
				}
			},
			[UXF_MACROPONENT_OUTPUT_PROPERTY_UPDATED]: {
				effect: ({action, host, dispatch}) => {
					const {
						payload,
						meta: {
							appended: {
								[COMPOSITION_ELEMENT_ID]: elementId,
								[CONTAINING_MACROPONENT_SYS_ID]: containingSysId = ''
							}
						}
					} = action;
					const tag = `MACROPONENT-${containingSysId.toUpperCase()}`;
					if (tag !== host.tagName) return;

					const affected = Object.keys(payload).some((name) => {
						const dataPropName = getPlaceholderPropName(elementId, name);
						return (
							viewportElementsAffectedByDataOutputProp[dataPropName]?.length > 0
						);
					});

					if (affected)
						dispatch(UXF_VIEWPORT_CALCULATE_ROUTES, {
							sourceActionName: UXF_MACROPONENT_OUTPUT_PROPERTY_UPDATED,
							sourceActionPayload: {}
						});
				}
			},
			[UXF_VIEWPORT_CALCULATE_ROUTES]: {
				effect: (coeffects) => {
					const {
						properties,
						updateState,
						dispatch,
						state,
						action: {payload}
					} = coeffects;

					const scriptedRoutes = {};
					let isResultMemoizable = true;
					const memoizationFlags = {};

					const subroutes = getInstanceSubroutes(
						properties[META_PROP_NAME_APP_CONFIG_SYS_ID]
					).filter((s) => !isEmpty(s.parentCompositionElementId));

					let nonExtensionPointRoutesExist = false;

					// We need to check if there are any subscreens with scripted conditions
					const subroutesByViewportElementId = subroutes.reduce(
						(acc, subroute) => {
							const {parentCompositionElementId, macroponents, extensionPoint} =
								subroute;

							const screensWithPassingClientConditions = macroponents.filter(
								getScreenQualifierFunction(
									macroponentProperties,
									subroute,
									properties,
									null,
									getResolvedDataBindingFn
								)
							);

							// if none of our screens has a client condition that passes, the route should not be shown
							if (screensWithPassingClientConditions.length === 0) {
								return acc;
							}

							// if at least one of our screens at this point doesnt require any server script, we know we can show the route
							if (
								screensWithPassingClientConditions.some(
									(screen) => !screen.hasScriptedCondition
								)
							) {
								if (!has(acc, [parentCompositionElementId])) {
									acc[parentCompositionElementId] = [];
								}

								acc[parentCompositionElementId].push(subroute);
								return acc;
							} else {
								// At this point, we don't know if this route has passing screens or not.
								// We have to hit the server and assess if the scripted conditions for any
								// screen in a given route passes.
								const validScreens = screensWithPassingClientConditions
									.map((screen) => {
										memoizationFlags[screen.id] = screen?.isResultMemoizable;
										return getScriptedScreenCondtionRequestObject(
											macroponentProperties,
											extensionPoint,
											getResolvedDataBindingFn,
											screen,
											properties,
											{},
											{}
										);
									})
									.filter((screen) => !isEmpty(screen));

								if (validScreens.length > 0) {
									if (!extensionPoint) {
										nonExtensionPointRoutesExist = true;
									}
									scriptedRoutes[subroute.id] = validScreens;
									isResultMemoizable &&= validScreens.every(
										(screen) => memoizationFlags[screen.screenId]
									);
								}

								return acc;
							}
						},
						{}
					);

					const viewportElementIds = getViewportElementIds(subroutes);

					viewportElementIds.forEach((viewportElementId) => {
						if (!subroutesByViewportElementId[viewportElementId]) {
							subroutesByViewportElementId[viewportElementId] = [];
						}
					});

					if (!isEmpty(scriptedRoutes)) {
						// do not dispatch scripted conditions for inactive screen content
						const {sourceActionName, sourceActionPayload} = payload;
						if (sourceActionName === COMPONENT_PROPERTY_CHANGED) {
							const {name, value} = sourceActionPayload;
							if (name === 'screen' && value?.isActive === false) return;
						} else if (sourceActionName === COMPONENT_CONNECTED) {
							const {
								properties: {screen}
							} = sourceActionPayload;
							if (screen?.isActive === false) return;
						}

						const scriptedRoutesRequest = getScriptedRouteConditionRequest(
							scriptedRoutes,
							nonExtensionPointRoutesExist
						);

						const currentTime = Date.now();
						// clean up stale entries
						[...scriptedConditonsLastRequestCache.values()].forEach((obj) => {
							if (currentTime - obj.timestamp > threshold)
								scriptedConditonsLastRequestCache.delete(obj.nowId);
						});

						const nowId = properties.nowId;
						const shouldDispatch =
							!scriptedConditonsLastRequestCache.has(nowId) ||
							(scriptedConditonsLastRequestCache.has(nowId) &&
								!isDuplicateScriptedConditionRequest(
									scriptedRoutesRequest,
									nowId
								));
						scriptedConditonsLastRequestCache.set(nowId, {
							scriptedRoutesRequest,
							nowId,
							timestamp: Date.now()
						});

						// check for:
						//   - if there is a current inflight request
						//   - if we should dispatch based on cached responses
						//   - if the request has already been made
						if (!shouldDispatch) return;

						// get scripted route cache
						const scriptedRouteCache = get(
							state,
							SCRIPTED_ROUTE_CACHE_KEY,
							new Map()
						);

						if (
							!isResultMemoizable ||
							(isResultMemoizable &&
								!scriptedRouteCache.has(scriptedRoutesRequest))
						) {
							// add scripted routes to a "cache"
							scriptedRouteCache.add(scriptedRoutesRequest);
							dispatch(
								UXF_VIEWPORT_ROUTE_SCRIPTED_CONDITIONS_EVALUATION_REQUESTED,
								{data: scriptedRoutesRequest},
								{
									startTime: performance.now(),
									subroutesByViewportElementId,
									subroutes,
									scriptedCacheKey: scriptedRoutesRequest
								}
							);
						} else {
							scriptedRouteCache.get(scriptedRoutesRequest)?.then((result) => {
								dispatch(
									UXF_VIEWPORT_ROUTE_SCRIPTED_CONDITIONS_EVALUATION_COMPLETED,
									result,
									{
										subroutesByViewportElementId,
										subroutes
									}
								);
							});
						}

						if (sourceActionName === COMPONENT_CONNECTED) {
							// update preliminary routes
							const filteredSubroutesByViewportElementId = Object.fromEntries(
								Object.entries(subroutesByViewportElementId).map(
									([key, subroutes]) => [
										key,
										subroutes.filter(
											(subroute) =>
												!subroute.macroponents.some(
													(macroponent) => macroponent.hasScriptedCondition
												)
										)
									]
								)
							);
							updateRouteCollectionState({
								subroutesByViewportElementId:
									filteredSubroutesByViewportElementId,
								updateState,
								subroutes,
								dispatch,
								state,
								shouldCompleteRouteInitialization: false
							});
						}
					} else {
						updateRouteCollectionState({
							subroutesByViewportElementId,
							updateState,
							subroutes,
							dispatch,
							state
						});
					}
				},
				stopPropagation: true
			},
			[UXF_VIEWPORT_ROUTE_SCRIPTED_CONDITIONS_EVALUATION_REQUESTED]: {
				...evaluateRouteScriptedConditions,
				stopPropagation: true
			},
			[UXF_VIEWPORT_SCRIPTED_CONDITIONS_EVALUATION_REQUESTED]: {
				...evaluateScriptedConditionsEffect,
				stopPropagation: true
			},
			[UXF_VIEWPORT_ROUTE_SCRIPTED_CONDITIONS_EVALUATION_COMPLETED]: {
				effect: (coeffects) => {
					const {
						host,
						action: {
							payload: {result = {}},
							meta: {
								subroutesByViewportElementId = {},
								subroutes,
								scriptedCacheKey
							}
						},
						updateState,
						state,
						dispatch
					} = coeffects;
					const scriptedRouteCache = get(
						state,
						SCRIPTED_ROUTE_CACHE_KEY,
						new Map()
					);
					if (scriptedCacheKey) {
						const resolve = scriptedRouteCache.getResolve(scriptedCacheKey);
						if (resolve) resolve(coeffects.action.payload);
					}

					if (isEmpty(result)) {
						updateRouteCollectionState({
							subroutesByViewportElementId,
							updateState,
							subroutes,
							dispatch,
							state
						});
						return;
					}

					//metrics
					mark(
						host,
						getInteractionId(get(coeffects, 'action.meta')),
						UXF_VIEWPORT_ROUTE_SCRIPTED_CONDITIONS_EVALUATION_COMPLETED,
						{routeResults: result}
					);

					// Iterate across the response of all the routes we sent for evaluation -
					// if a route had a screen that passed its scripted check, we'll add the route to
					// the viewportRoutes
					subroutes.forEach((subroute) => {
						if (!result[subroute.id]) {
							return;
						}

						if (
							!has(subroutesByViewportElementId, [
								subroute.parentCompositionElementId
							])
						) {
							subroutesByViewportElementId[
								subroute.parentCompositionElementId
							] = [];
						}

						// check the conditionResult for the evaluated route, add the route to the
						// viewportRoutes only for conditionResult: true
						const scriptResults = get(
							result,
							`${subroute.id}.scriptResults`,
							[]
						);
						if (
							scriptResults.length > 0 &&
							scriptResults.some(
								(scriptResult) => scriptResult.conditionResult === true
							)
						) {
							subroutesByViewportElementId[
								subroute.parentCompositionElementId
							].push(subroute);
						}
					}, {});

					updateRouteCollectionState({
						subroutesByViewportElementId,
						updateState,
						subroutes,
						dispatch,
						state
					});
				},
				stopPropagation: true
			},
			[UXF_VIEWPORT_ROUTE_INITIALIZATION_COMPLETED]: {
				effect: ({dispatch}) => {
					dispatchInternalAction(
						dispatch,
						MACROPONENT_VIEWPORT_ROUTE_INITIALIZATION_COMPLETED
					);
				},
				stopPropagation: true
			},
			// Since viewport content screens can vary based on the values in a macroponent context
			// property, we need to reevaluate selected viewport contents when macroponent properties
			// change.
			[COMPONENT_PROPERTY_CHANGED]: {
				effect: (coeffects) => {
					const {
						action: {
							payload: {name, value, previousValue}
						},
						state: {
							behaviors: {
								viewportRuntime: {viewports = {}}
							}
						},
						properties,
						dispatch
					} = coeffects;

					const subroutes = getInstanceSubroutes(
						properties[META_PROP_NAME_APP_CONFIG_SYS_ID]
					).filter((s) => !isEmpty(s.parentCompositionElementId));

					if (
						macroponentProperties[name] ||
						name === META_PROP_NAME_APP_CONFIG_SYS_ID
					) {
						// DEF0178338 - Often, the value of a property that changed is an object whose value didn't ACTUALLY change.
						// To defend against kicking off an expensive operation to re-evaluate routes that we don't have to, we are
						// explicity checking here that the new property value is actually different than the previous one.
						if (!isEqual(value, previousValue)) {
							// don't dispatch to calculate viewport routes for
							// the macroponents in absence of viewport elements
							if (!isEmpty(subroutes)) {
								dispatch(UXF_VIEWPORT_CALCULATE_ROUTES, {
									sourceActionName: COMPONENT_PROPERTY_CHANGED,
									sourceActionPayload: {name, value, previousValue}
								});
							}

							Object.keys(viewports).forEach((viewportElementId) => {
								const currentScreen = get(viewports, [
									viewportElementId,
									'currentScreen'
								]);
								if (isNil(currentScreen)) return;
								const {
									activeRoute: {routeType, fields, optionalParameters: params}
								} = currentScreen;

								/**
								 * todo: if this element is rendering an extension point, as a perf optimization,
								 * we could look at the viewportDependencies map to figure out if the property change
								 * will affect this viewport
								 */

								//DEF0260780: UXFModalViewport opens unexpectedly due to race conditions during UXFModalViewport dismissal
								//Checking if this is a isUXFModalViewport to not render the UXFModalViewport
								//The UXFModalViewport Modals are always exclusively launched using MACROPONENT_VIEWPORT_LOAD_REQUESTED
								//and dismissed like regular modals, to notify uxf, it uses via a MutationObserver to dispatch VIEWPORT_ROUTE_DISMISSED and update the route
								if (uxfViewportModalMap.includes(viewportElementId)) return;

								// dispatch the UXF_VIEWPORT_RENDER_BY_ID event only when
								// viewportElementId doesn't exists in inFlightScriptedScreenConditions
								if (!inFlightScriptedScreenConditions.has(viewportElementId)) {
									dispatch(UXF_VIEWPORT_RENDER_BY_ID, {
										route: routeType,
										fields,
										params,
										viewportElementId
									});
								}
							});
						}
					}
				}
			},
			[UXF_VIEWPORT_RENDER]: {
				effect: (coeffects) => {
					const {
						action: {
							payload,
							meta: {appended: appendedSourceActionMeta = {}}
						},
						dispatch
					} = coeffects;

					dispatch(UXF_VIEWPORT_RENDER_BY_ID, {
						...payload,
						viewportElementId: appendedSourceActionMeta[COMPOSITION_ELEMENT_ID]
					});
				},
				stopPropagation: true
			},
			[UXF_VIEWPORT_DISMISS]: {
				effect: (coeffects) => {
					const {
						updateState,
						action: {
							payload: {route, fields},
							meta: {appended: appendedSourceActionMeta = {}}
						},
						state
					} = coeffects;
					const viewportElementId =
						appendedSourceActionMeta[COMPOSITION_ELEMENT_ID];
					const basePath = getBasePath(viewportElementId);
					const viewportData = get(state, basePath, {});
					const screenId = findKey(viewportData.screens, ({activeRoute}) => {
						return (
							activeRoute.routeType === route &&
							Object.keys(activeRoute.fields).length ===
								Object.keys(fields).length
						);
					});
					const isScreenActive =
						screenId === get(viewportData, ['currentScreen', 'screenId']);

					updateState([
						{
							operation: 'set',
							path: `${basePath}.screens`,
							value: omit(viewportData.screens, screenId),
							shouldUpdate: Boolean(screenId)
						},
						{
							operation: 'set',
							path: `${basePath}.currentScreen`,
							value: undefined,
							shouldUpdate: Boolean(isScreenActive)
						}
					]);
				},
				stopPropagation: true
			},
			[UXF_VIEWPORT_SCRIPTED_CONDITIONS_EVALUATION_COMPLETED]: {
				effect: async (coeffects) => {
					const {
						state,
						host,
						action: {
							meta: {
								requestedRoute,
								incomingFields,
								incomingParameters,
								resolvedPropertyValues,
								viewportElementId,
								matchingMacroponent,
								macroponentList,
								properties,
								transactionId,
								[SIGNAL_VIEWPORT_LOAD_COMPLETION]: signalViewportLoadCompletion,
								scriptedCacheKey
							}
						},
						updateState,
						dispatch
					} = coeffects;

					// DEF0171851
					// Checking that we are only respecting the most recent call to RENDER_BY_ID, to ensure that
					// no race conditions occur. Because some renders wait for a network call, and some do not,
					// there is a possibility that two renders occur (one for a scripted screen, one for a non scripted screen),
					// and although the request for the non scripted screen happened most recently, the scripted screen resolution
					// would happen afterward and would win. This is a safeguard against that.
					const currentTransactionId = viewportTransactions[viewportElementId];

					if (currentTransactionId && transactionId !== currentTransactionId) {
						return;
					}

					const {routeType, order, name, icon, extensionPoint} = requestedRoute;

					const scriptResults = get(
						coeffects,
						'action.payload.result.scriptResults',
						[]
					);

					const scriptedConditionsCache = get(
						state,
						SCRIPTED_CONDITIONS_CACHE_KEY,
						new Map()
					);
					if (scriptedCacheKey) {
						const resolve =
							scriptedConditionsCache.getResolve(scriptedCacheKey);
						if (resolve) resolve(coeffects.action.payload);
					}

					//check if there's evaluated condition response and find a matching macroponent
					let chosenMacroponent = matchingMacroponent;

					//if scriptResults filter macroponents that failed out
					if (scriptResults.length > 0) {
						const failedMacroponentids = scriptResults
							.filter((scriptRes) => {
								return scriptRes.conditionResult === false;
							})
							.map((failedRes) => {
								return failedRes.screenId;
							});

						const candidateMacroponents = macroponentList.filter((mcp) => {
							return !failedMacroponentids.includes(mcp.id);
						});

						chosenMacroponent = candidateMacroponents.find(
							getScreenQualifierFunction(
								macroponentProperties,
								requestedRoute,
								properties,
								incomingFields,
								getResolvedDataBindingFn
							)
						);

						//only add a mark if we evaluated scripted conditions
						mark(
							host,
							getInteractionId(get(coeffects, 'action.meta')),
							UXF_VIEWPORT_SCRIPTED_CONDITIONS_EVALUATION_COMPLETED,
							{
								scriptResults: scriptResults
							}
						);
					}

					//couldn't find a macroponent that satisfies conditions
					if (!chosenMacroponent) {
						console.warn(
							'Failed to find a matching macroponent. Please check screen conditions. If using scripted conditons make sure to have a default tab variant.'
						);
						return;
					}

					const {
						macroponentSysId,
						macroponentConfiguration,
						id: screenId,
						eventMappings = []
					} = chosenMacroponent;

					const promisedTemplate = getTemplates([macroponentSysId]);

					const basePath = getBasePath(viewportElementId);
					const currentScreen = get(state, `${basePath}.currentScreen`, {});
					const screenChanged = screenId !== currentScreen.screenId;
					const screenKey = useScreenKey
						? uniqueScreenKey(incomingFields, routeType)
						: null;

					/** @type {Screen} */
					const screen = {
						activeRoute: {
							routeType,
							extensionPoint,
							order,
							name,
							icon,
							fields: incomingFields,
							optionalParameters: incomingParameters
						},
						requestTime: screenChanged ? Date.now() : currentScreen.requestTime,
						screenId,
						macroponentSysId,
						macroponentConfiguration: {
							...macroponentConfiguration,
							...resolvedPropertyValues
						},
						...includeScreenKey(useScreenKey, screenKey)
					};

					const screenRef = useScreenKey ? screenKey : screenId;
					markInFlightScriptedScreenConditionEvaluation(
						viewportElementId,
						routeType
					);
					updateState([
						{
							path: `${basePath}.screens.${screenRef}`,
							value: screen,
							operation: 'set'
						},
						{
							path: `${basePath}.currentScreen`,
							value: screen,
							operation: 'set'
						}
					]);
					registerScreenActionTransformer(screenId, eventMappings);

					await promisedTemplate;

					if (signalViewportLoadCompletion) {
						dispatchInternalAction(
							dispatch,
							MACROPONENT_VIEWPORT_LOAD_COMPLETED,
							{
								viewportElementId,
								route: routeType
							}
						);
					}
				},
				stopPropagation: true
			},
			[UXF_VIEWPORT_RENDER_BY_ID]: {
				effect: (coeffects) => {
					const {
						action: {
							payload: {route, viewportElementId},
							meta: {
								[SIGNAL_VIEWPORT_LOAD_COMPLETION]:
									signalViewportLoadCompletion = false
							}
						},
						properties,
						dispatch,
						state
					} = coeffects;

					// DEF0206347: There isn't an easy way to fallback default values in destructuring with renaming
					// syntax. Setting a fallback values to empty object for the case of null.
					const incomingFields = defaultTo(
						get(coeffects, 'action.payload.fields'),
						{}
					);
					const incomingParameters = defaultTo(
						get(coeffects, 'action.payload.params'),
						{}
					);

					const currentTransactionId = viewportTransactions[viewportElementId];
					const transactionId = currentTransactionId || cuid();
					if (currentTransactionId !== transactionId)
						viewportTransactions[viewportElementId] = transactionId;

					const subroutes = getInstanceSubroutes(
						properties[META_PROP_NAME_APP_CONFIG_SYS_ID]
					);

					const requestedRoute = subroutes
						.filter(
							(subroute) =>
								subroute.parentCompositionElementId === viewportElementId
						)
						.filter(
							(subroute) =>
								subroute.fields.length === Object.keys(incomingFields).length
						)
						.find((subroute) => subroute.routeType === route);

					if (!requestedRoute) {
						console.error(
							`Requested route ${route} with requested fields could not be found in composition element ${viewportElementId}`
						);
						return;
					}

					const {fields, optionalParameters, extensionPoint} = requestedRoute;

					const resolvedPropertyValues = assign(
						{},
						fields.reduce((acc, cur) => {
							acc[cur] = incomingFields[cur];
							return acc;
						}, {}),
						!isEmpty(incomingParameters)
							? optionalParameters.reduce((acc, cur) => {
									acc[cur] = incomingParameters[cur];
									return acc;
							  }, {})
							: {}
					);

					let matchingMacroponent;
					let macroponentList = get(requestedRoute, 'macroponents', []);

					let evalData = {
						requestedRoute: requestedRoute,
						incomingFields: incomingFields,
						incomingParameters: incomingParameters,
						resolvedPropertyValues: resolvedPropertyValues,
						viewportElementId: viewportElementId,
						macroponentList: macroponentList,
						properties: properties
					};

					let evaluatingScriptedConditions = false;
					//check non-scripted conditions first and filter out any macroponents that fail their evaluation
					macroponentList = macroponentList.filter(
						getScreenQualifierFunction(
							macroponentProperties,
							requestedRoute,
							properties,
							incomingFields,
							getResolvedDataBindingFn
						)
					);

					for (let i = 0; i < macroponentList.length; i++) {
						const mcp = macroponentList[i];
						if (mcp.hasScriptedCondition) {
							//stop and evaluate all scripted conditions at once for all macroponents with scripted conditions
							//make array of screenId:params for request
							const requestData = macroponentList
								.filter((screen) => screen.hasScriptedCondition)
								.map((screen) =>
									getScriptedScreenCondtionRequestObject(
										macroponentProperties,
										extensionPoint,
										getResolvedDataBindingFn,
										screen,
										properties,
										incomingFields,
										incomingParameters
									)
								)
								.filter((screen) => !isEmpty(screen));
							// prevent dispatching request if requestData is empty
							if (isEmpty(requestData)) {
								continue;
							}

							evaluatingScriptedConditions = true;
							addInFlightScriptedScreenConditionEvaluation(
								viewportElementId,
								route
							);

							// check if request has already been made - prevent dispatching request if so
							const scriptedConditionsCache = get(
								state,
								SCRIPTED_CONDITIONS_CACHE_KEY,
								new Map()
							);
							if (!scriptedConditionsCache.has(requestData)) {
								// add requestData to cache
								scriptedConditionsCache.add(requestData);
								dispatch(
									UXF_VIEWPORT_SCRIPTED_CONDITIONS_EVALUATION_REQUESTED,
									{data: requestData},
									{
										...evalData,
										transactionId,
										startTime: performance.now(),
										[SIGNAL_VIEWPORT_LOAD_COMPLETION]:
											signalViewportLoadCompletion,
										scriptedCacheKey: requestData
									}
								);
							} else {
								scriptedConditionsCache.get(requestData)?.then((result) => {
									dispatch(
										UXF_VIEWPORT_SCRIPTED_CONDITIONS_EVALUATION_COMPLETED,
										result,
										{
											...evalData,
											matchingMacroponent: matchingMacroponent,
											transactionId,
											[SIGNAL_VIEWPORT_LOAD_COMPLETION]:
												signalViewportLoadCompletion
										}
									);
								});
							}
							break;
						}
						//if we didn't find a scripted condition this mcp is a match
						matchingMacroponent = mcp;
						break;
					}

					//if didn't have any scripted conditions and we found a matching macroponent continue
					if (!evaluatingScriptedConditions) {
						dispatch(
							UXF_VIEWPORT_SCRIPTED_CONDITIONS_EVALUATION_COMPLETED,
							{},
							{
								...evalData,
								matchingMacroponent: matchingMacroponent,
								transactionId,
								[SIGNAL_VIEWPORT_LOAD_COMPLETION]: signalViewportLoadCompletion
							}
						);
					}
				},
				stopPropagation: true
			}
		}
	};
};
