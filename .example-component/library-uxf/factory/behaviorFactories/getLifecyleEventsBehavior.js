import {partial} from '@devsnc/snowdash';
import {actionTypes} from '@servicenow/ui-core';
import {camelCase} from '../utils.js';
import nodeStore from '../macroponentInMemoryStore.js';
import {isEmpty} from '@devsnc/snowdash';
import {get} from '@devsnc/snowdash';
import {isEqual} from '@devsnc/snowdash';
import {some} from '@devsnc/snowdash';

const {
	COMPONENT_PROPERTY_CHANGED,
	COMPONENT_DOM_TREE_READY,
	COMPONENT_DISCONNECTED
} = actionTypes;
const COMPONENT_STATE_UPDATED = 'SEISMIC_COMPONENT_STATE_UPDATED';
import {
	viewportActions,
	publicActionHandlerNames,
	publicDispatchedActionNames,
	IS_MACROPONENT_READY,
	IS_SOURCED_FROM_SET_STATE,
	UXF_META_PROP_NAME_PREFIX,
	SIGNAL_VIEWPORT_LOAD_COMPLETION,
	SIGNAL_VIEWPORT_ROUTE_INITIALIZATION_COMPLETION,
	SIGNAL_MACROPONENT_READY_STATE_UPDATED,
	SIGNAL_MACROPONENT_READY_DISPATCHED,
	internalActions,
	MACROPONENT_VALUE_UPDATED
} from '../constants.js';
import resolveForInitialStateValues from '../UxValueResolver/resolveForInitialStateValues';
import getInternalEffect, {dispatchInternalAction} from '../getInternalEffect';

import stateUpdateRequestedActionHandler from './primitiveOperations/stateUpdateRequestedActionHandler';
import {removeMacroponentInstance} from '../registry/macroponentInstanceRegistry.js';
import {httpErrorOccurredEffect} from '../../effects/httpErrorOccurredEffect';
import trackUsageActionHandler from './trackUsage/trackUsageActionHandler';
import getResolversForView from '../UxValueResolver/getResolversForView';
import resolveForView from '../UxValueResolver/resolveForView';
import {isNil} from '@devsnc/snowdash';

import {mapValues} from '@devsnc/snowdash';

const {
	MACROPONENT_READY,
	MACROPONENT_PROPERTY_CHANGED,
	MACROPONENT_VIEWPORT_ROUTE_INITIALIZATION_COMPLETED,
	MACROPONENT_PAGE_ERROR_OCCURRED
} = publicDispatchedActionNames;
const {
	MACROPONENT_STATE_UPDATE_REQUESTED,
	MACROPONENT_VIEWPORT_LOAD_REQUESTED,
	MACROPONENT_VIEWPORT_LOAD_COMPLETED,
	HTTP_ERROR_OCCURRED,
	TRACK_USAGE_REQUESTED
} = publicActionHandlerNames;
const {UXF_VIEWPORT_RENDER_BY_ID, UXF_VIEWPORT_ROUTE_INITIALIZATION_COMPLETED} =
	viewportActions;

const {
	MACROPONENT_STATE_UPDATED,
	WRAPPED_EVENT_REDISPATCH,
	CONTROLLER_PROP_CHANGED
} = internalActions;

const metaPropNamePrefixCamelCased = camelCase(UXF_META_PROP_NAME_PREFIX);

const isControllerNode = (node) => !node.tagName;

// see if any of the outputProp's member isn't available yet
const isPropMemberUnresolved = (prop) =>
	typeof prop === 'object'
		? some(Object.keys(prop), (m) => prop[m] === undefined)
		: !isEmpty(prop);

const checkForControllerOutputProps = (
	name,
	outputPropMappings,
	properties,
	csdbNodeId,
	pdbNodeIds,
	externalControllerDependencies,
	proxyDataBrokerNodes,
	id,
	state,
	controllerAliasMap
) => {
	// For the non controller macroponent props, return true
	// otherwise evaluate outputProps for controller are resolved
	if (!outputPropMappings[name]) return true;

	// Check for outputProp availability for the controller macroponent
	if (outputPropMappings[name]) {
		const resolversForOutputProperties = getResolversForView(
			id,
			properties,
			csdbNodeId,
			pdbNodeIds,
			externalControllerDependencies,
			proxyDataBrokerNodes,
			controllerAliasMap
		);

		// resolve the outputProp
		const resolvedPropValue = resolveForView(
			resolversForOutputProperties,
			properties,
			state,
			outputPropMappings[name]
		);

		return (
			!isEmpty(resolvedPropValue) && !isPropMemberUnresolved(resolvedPropValue)
		);
	}
};

export const getLifecyleEventsBehavior = (
	unresolvedInitialState,
	stateProperties = [],
	consolidatedEventMappings,
	shouldHaveWrappedEventDispatch,
	csdbNodeId,
	pdbNodeIds,
	outputPropMappings,
	externalControllerDependencies,
	proxyDataBrokerNodes,
	id,
	rootNode,
	controllerAliasMap,
	dispatchMcpUpdates = false
) => {
	const requiresInitialStateResolution = !isEmpty(unresolvedInitialState);
	const statePropertyNames = stateProperties.map(({name}) => name);
	const isOutputProp = (name) => !!outputPropMappings[name];
	const shouldDispatchControllerPropChanged = (name) =>
		isControllerNode(rootNode) &&
		!isOutputProp(name) &&
		!name.includes('nowUxf');

	return {
		name: 'macroponentInternalEvents',
		actionHandlers: {
			[COMPONENT_DOM_TREE_READY]({
				updateState,
				properties: seismicProperties,
				dispatch,
				host
			}) {
				if (host[SIGNAL_MACROPONENT_READY_DISPATCHED]) return;

				if (requiresInitialStateResolution) {
					const resolvedInitialState = mapValues(
						unresolvedInitialState,
						partial(resolveForInitialStateValues, seismicProperties)
					);
					const updaterFn = () => {
						return {
							...resolvedInitialState,
							[IS_MACROPONENT_READY]: true
						};
					};
					updaterFn[SIGNAL_MACROPONENT_READY_STATE_UPDATED] = true;
					updateState(updaterFn);
				} else {
					host[SIGNAL_MACROPONENT_READY_DISPATCHED] = true;
					dispatchInternalAction(dispatch, MACROPONENT_READY);
				}
			},
			[COMPONENT_PROPERTY_CHANGED]({
				action,
				dispatch,
				properties,
				state,
				host
			}) {
				const {
					payload: {name, previousValue, value}
				} = action;

				const outputPropsAvailable = checkForControllerOutputProps(
					name,
					outputPropMappings,
					properties,
					csdbNodeId,
					pdbNodeIds,
					externalControllerDependencies,
					proxyDataBrokerNodes,
					id,
					state,
					controllerAliasMap
				);

				if (shouldDispatchControllerPropChanged(name)) {
					dispatchInternalAction(dispatch, CONTROLLER_PROP_CHANGED, {
						...action.payload,
						isOutputProp: isOutputProp(name),
						properties,
						nowId: host.nowId
					});
				}

				const depPropsAvailable = (name, value) => {
					// if prop isn't dep-* return true
					// otherwise check for at-least one prop's member isn't available
					if (!name.startsWith('dep')) return true;

					// Check availability for dep-* Props. e.g. depNowUxfGformAcl
					if (!isEmpty(value) && typeof value === 'object') {
						const isPropMemberUndefined = some(
							Object.keys(value),
							(m) => value[m] === undefined
						);
						return !isPropMemberUndefined;
					} else {
						return !isEmpty(value);
					}
				};

				if (
					!name.startsWith(metaPropNamePrefixCamelCased) &&
					!isEqual(previousValue, value) &&
					depPropsAvailable(name, value) &&
					outputPropsAvailable
				) {
					const payload = {
						name: action.payload.name,
						value: action.payload.value,
						previousValue: action.payload.previousValue
					};
					dispatchInternalAction(
						dispatch,
						MACROPONENT_PROPERTY_CHANGED,
						payload
					);
				}
			},
			[COMPONENT_DISCONNECTED]({host, properties}) {
				const {nodeId} = properties;
				removeMacroponentInstance(host);
				nodeStore.clear(nodeId);
			},
			[COMPONENT_STATE_UPDATED]({action, dispatch, state, host}) {
				const {
					payload: {previousState, update}
				} = action;

				// We are only interested in state updates that are done from client scripts (or macroponent declarative state updates)
				if (update[IS_SOURCED_FROM_SET_STATE]) {
					const {statePropertyName} = update;
					if (
						statePropertyNames.includes(statePropertyName) &&
						previousState[statePropertyName] !== state[statePropertyName]
					) {
						dispatchInternalAction(dispatch, MACROPONENT_STATE_UPDATED, {
							statePropertyName
						});
					}
				} else if (update[SIGNAL_VIEWPORT_ROUTE_INITIALIZATION_COMPLETION]) {
					// We are making sure that the state has already been updated wih the viewport routes
					// when we are dispatching UXF_VIEWPORT_ROUTE_INITIALIZATION_COMPLETED
					dispatch(UXF_VIEWPORT_ROUTE_INITIALIZATION_COMPLETED);
				} else if (
					update[SIGNAL_MACROPONENT_READY_STATE_UPDATED] &&
					!host[SIGNAL_MACROPONENT_READY_DISPATCHED]
				) {
					host[SIGNAL_MACROPONENT_READY_DISPATCHED] = true;
					dispatchInternalAction(dispatch, MACROPONENT_READY);
				}
			},
			[MACROPONENT_VIEWPORT_LOAD_REQUESTED]: {
				effect({dispatch, action}) {
					dispatchInternalAction(
						dispatch,
						UXF_VIEWPORT_RENDER_BY_ID,
						action.payload,
						{[SIGNAL_VIEWPORT_LOAD_COMPLETION]: true}
					);
				},
				stopPropagation: true
			},
			[MACROPONENT_VIEWPORT_LOAD_COMPLETED]: {
				stopPropagation: true
			},
			[HTTP_ERROR_OCCURRED]: {
				effect: httpErrorOccurredEffect,
				args: [consolidatedEventMappings, MACROPONENT_PAGE_ERROR_OCCURRED],
				stopPropagation: !isNil(
					get(consolidatedEventMappings, MACROPONENT_PAGE_ERROR_OCCURRED)
				)
			},
			[MACROPONENT_PAGE_ERROR_OCCURRED]: {
				stopPropagation: true
			},
			[MACROPONENT_READY]: {
				stopPropagation: true
			},
			[MACROPONENT_PROPERTY_CHANGED]: {
				stopPropagation: true,
				effect: (coeffects) => {
					if (!dispatchMcpUpdates) {
						return;
					}

					const {dispatch, action} = coeffects;
					const {name: propertyName, value: updatedValue} = action.payload;

					dispatch(MACROPONENT_VALUE_UPDATED, {
						macroponentSysId: id,
						context: {
							props: {
								[propertyName]: updatedValue
							}
						}
					});
				}
			},
			[MACROPONENT_STATE_UPDATE_REQUESTED]: {
				effect: (coeffects) => {
					stateUpdateRequestedActionHandler(coeffects, id, dispatchMcpUpdates);
				},
				stopPropagation: true
			},
			[TRACK_USAGE_REQUESTED]: {
				effect: trackUsageActionHandler,
				stopPropagation: true
			},
			[MACROPONENT_VIEWPORT_ROUTE_INITIALIZATION_COMPLETED]: {
				stopPropagation: true
			},
			...(shouldHaveWrappedEventDispatch
				? {
						[WRAPPED_EVENT_REDISPATCH]: getInternalEffect({
							effect({dispatch, action}) {
								const {
									payload: {wrappedPayload, targetEventName}
								} = action;

								dispatch(targetEventName, wrappedPayload);
							}
						})
				  }
				: {})
		}
	};
};
