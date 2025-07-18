import {DA_WRAPPED_CLICKED, UXF_INTERNAL_EVENT_META} from '../common/constants';
import {actionTypes} from '@servicenow/ui-core';
import {createHttpEffect} from '@servicenow/ui-effect-http';
import {
	dynamicConditionCompletedEffect,
	handlePropertyChanged,
	relayDAUpdates,
	runDynamicConditionsEffect
} from './dynamicConditionsUtil';
import {get, isArray, isFunction, pick} from 'lodash';
import {loadComponent} from '../utils/dynamicLoad';
import trackUxMetrics from '../utils/uxMetricsUtils';
const {COMPONENT_PROPERTY_CHANGED, COMPONENT_DOM_TREE_READY} = actionTypes;
export const DECLARATIVE_ACTION_RUN_DYNAMIC_CONDITIONS =
	'DECLARATIVE_ACTION_INTERNAL#RUN_DYNAMIC_CONDITIONS';
export const DECLARATIVE_ACTION_RUN_DYNAMIC_CONDITIONS_COMPLETED =
	'DECLARATIVE_ACTION#RUN_DYNAMIC_CONDITION_COMPLETED';
export const DECLARATIVE_ACTION_RUN_DYNAMIC_CONDITIONS_FAILED =
	'DECLARATIVE_ACTION#RUN_DYNAMIC_CONDITION_FAILED';

export const DECLARATIVE_ACTION = 'DECLARATIVE_ACTION';
export const DECLARATIVE_ACTION_UPDATE_RENDER = 'DECLARATIVE_ACTION_INTERNAL#UPDATE_RENDER';
export const DECLARATIVE_ACTION_EXECUTE_ACTION = 'DECLARATIVE_ACTION_INTERNAL#EXECUTE_ACTION';
export const DECLARATIVE_ACTION_CANCEL_ACTION = 'DECLARATIVE_ACTION_INTERNAL#CANCEL_ACTION';
export const DECLARATIVE_ACTION_CLOSE_MODAL = 'DECLARATIVE_ACTION_INTERNAL#CLOSE_MODAL';
export const DECLARATIVE_ACTION_SCRIPT_START = 'DECLARATIVE_ACTION_INTERNAL#SCRIPT_START';
export const DECLARATIVE_ACTION_SCRIPT_SUCCESS = 'DECLARATIVE_ACTION_INTERNAL#SCRIPT_SUCCESS';
export const DECLARATIVE_ACTION_SCRIPT_FAILED = 'DECLARATIVE_ACTION_INTERNAL#SCRIPT_FAILED';

export const PUBLIC_DECLARATIVE_ACTION_SCRIPT_SUCCESS = 'DECLARATIVE_ACTION#SCRIPT_SUCCESS';
export const PUBLIC_DECLARATIVE_ACTION_SCRIPT_FAILED = 'DECLARATIVE_ACTION#SCRIPT_FAILED';
export const PUBLIC_DECLARATIVE_ACTION_UPDATE_RENDER = 'DECLARATIVE_ACTION#UPDATE_RENDER';

export const DECLARATIVE_ACTION_OPEN_LINK = 'DECLARATIVE_ACTION#OPEN_LINK';
export const DECLARATIVE_ACTION_CLIENT_SCRIPT_EXECUTION_REQUESTED =
	'DECLARATIVE_ACTION#CLIENT_SCRIPT_EXECUTION_REQUESTED';
const HTTP_ERROR_OCCURRED = 'HTTP_ERROR_OCCURRED';

export const VALUE_CHANGED = 'VALUE_CHANGED';
export const ACTION_COMPONENT = 'action_component';
export const DISPATCH_ACTION = 'dispatch_action';
export const CLIENT_SCRIPT = 'client_script';
export const SERVER_SCRIPT = 'server_script';
export const UXF_CLIENT_ACTION = 'uxf_client_action';
const SERVER_SCRIPT_API = '/api/now/ui/declarative_action/:assignmentId';
const SERVER_SCRIPT_API_PATH_PARAMS = ['assignmentId'];
const SERVER_SCRIPT_API_QUERY_PARAMS = ['sysparm_table'];
const SERVER_SCRIPT_API_BODY_PARAMS = [
	'sysId',
	'sysIds',
	'fields',
	'encodedRecord',
	'query',
	'selectionQuery',
	'parentTable',
	'parentRecordSysId'
];

// Field model doesn't have sysId field
const consolidateModel = model => {
	let fieldsParams = {};
	let fields = get(model, 'fields');
	if (fields) {
		if (!isArray(fields)) fields = Object.values(fields); //DA action executor needs fields in array different than our related items and side panel
		fieldsParams = {fields};
	}

	return {
		...model,
		sysId: model.isNewRecord ? '-1' : model.sysId || model.recordSysId,
		...fieldsParams
	};
};

const createHttpData = (action, model) => ({
	assignmentId: action.assignmentId,
	sysparm_table: model.table || model.tableName,
	data: pick(consolidateModel(model), SERVER_SCRIPT_API_BODY_PARAMS)
});

// dispatches an action with the necessary payload to execute the action
// This function assumes the user has already confirmed the action if confirmation
// is required. TODO: Refactor to handle ACTION_COMPONENT without needing to do a double render
const dispatchActionByType = (dispatch, action, model, properties) => {
	const {actionType, actionDispatch, actionPayload, assignmentId} = action;
	const {shouldWrapAction = false} = properties;

	if (actionType === DISPATCH_ACTION || actionType === UXF_CLIENT_ACTION) {
		if (!shouldWrapAction) {
			dispatch(actionDispatch, actionPayload);
		} else {
			dispatch(
				DA_WRAPPED_CLICKED,
				{
					wrapped_action_name: actionDispatch,
					wrapped_payload: actionPayload,
					wrapped_action_type: actionType
				},
				{
					[UXF_INTERNAL_EVENT_META]: {
						sourceCorrelationId: assignmentId
					}
				}
			);
		}
	} else if (actionType === SERVER_SCRIPT) {
		dispatch(DECLARATIVE_ACTION_SCRIPT_START, createHttpData(action, model));
	} else if (actionType === CLIENT_SCRIPT) {
		const {actionName, assignmentId, clientScript} = action;
		dispatch(DECLARATIVE_ACTION_CLIENT_SCRIPT_EXECUTION_REQUESTED, {
			actionName,
			assignmentId,
			clientScript,
			model
		});
	}
};

const getDispatcher = ({action, properties, dispatch}) => {
	const {shouldAppendActionEvent} = properties;
	if (!shouldAppendActionEvent) return dispatch;
	const createActionEvent = ({type, target, metaKey}) => {
		type, target, metaKey;
	};
	const {
		meta: {event, actionEvent = createActionEvent(event)}
	} = action;
	const addToPayload = (name, payload) =>
		name === DA_WRAPPED_CLICKED
			? {
					...payload,
					wrapped_payload: {
						...payload.wrapped_payload,
						actionEvent
					}
			  }
			: {...payload, actionEvent};
	return (name, payload, meta) => dispatch(name, addToPayload(name, payload), meta);
};

export const mediator = coeffects => {
	const {
		action: {
			payload: {model, action}
		},
		properties
	} = coeffects;
	const {confirmationRequired} = action;

	trackUxMetrics(coeffects);
	const dispatch = getDispatcher(coeffects);

	if (!confirmationRequired) dispatchActionByType(dispatch, action, model, properties);

	dispatch(DECLARATIVE_ACTION_UPDATE_RENDER, {
		model,
		action,
		displayConfirmation: confirmationRequired
	});
};

const dispatchNotifications = (sessionNotifications = [], dispatch) => {
	if (!sessionNotifications.length) return;

	const notifications = sessionNotifications.reduce((allNotifications, {type, text}) => {
		if (!text) return allNotifications;

		return [
			...allNotifications,
			{
				type,
				message: text
			}
		];
	}, []);
	if (notifications.length)
		dispatch('ADD_NOTIFICATIONS', {
			notifications
		});
};

// Handler for DAs that may update the field value.
// The component author would dispatch `VALUE_CHANGED`.
// Uses the onValueChange passed by form (Section.js)
// Ultimately it will invoke formData.setValue(...)
// Payload must include: name, value, displayValue
// This is specific to field declarative actions
export const updateFormFieldValue = ({action: {payload}, state}) => {
	const {model} = state;
	const {onValueChange} = model;

	if (!isFunction(onValueChange)) return;

	onValueChange({
		...payload,
		name: payload.name || model.name
	});
};

export default {
	[DECLARATIVE_ACTION]: {
		effect: mediator,
		stopPropagation: true
	},
	[DECLARATIVE_ACTION_UPDATE_RENDER]: {
		effect: ({updateState, action, dispatch}) => {
			const {action: payloadAction, model, displayConfirmation} = action.payload;
			const isDefined =
				!payloadAction.actionComponent ||
				payloadAction.actionComponent === 'sn-declarative-reference-search' ||
				customElements.get(payloadAction.actionComponent);
			const updatingState = {
				action: payloadAction,
				model,
				displayConfirmation,
				key: Date.now() // key is Date.now() because we need to the author's component to re-render always
			};
			if (isDefined) {
				updateState(updatingState);
			} else {
				loadComponent(payloadAction.actionComponent).then(loadedComponents => {
					updateState(updatingState);
				});
			}

			dispatch(PUBLIC_DECLARATIVE_ACTION_UPDATE_RENDER, action.payload);
		},
		stopPropagation: true
	},
	[DECLARATIVE_ACTION_EXECUTE_ACTION]: {
		effect: ({state: {action, model}, dispatch, properties}) =>
			dispatchActionByType(dispatch, action, model, properties),
		stopPropagation: true
	},
	[DECLARATIVE_ACTION_CANCEL_ACTION]: {
		effect: ({updateState}) => {
			updateState({
				action: null,
				model: null
			});
		},
		stopPropagation: true
	},
	[DECLARATIVE_ACTION_SCRIPT_START]: {
		...createHttpEffect(SERVER_SCRIPT_API, {
			method: 'POST',
			headers: {'X-WantSessionNotificationMessages': true},
			queryParams: SERVER_SCRIPT_API_QUERY_PARAMS,
			pathParams: SERVER_SCRIPT_API_PATH_PARAMS,
			dataParam: 'data',
			successActionType: DECLARATIVE_ACTION_SCRIPT_SUCCESS,
			errorActionType: DECLARATIVE_ACTION_SCRIPT_FAILED
		}),
		stopPropagation: true
	},
	[DECLARATIVE_ACTION_SCRIPT_SUCCESS]: {
		effect: ({state: {action: stateAction, model}, dispatch, action}) => {
			dispatch('REFRESH_REQUESTED');

			const sessionNotifications = get(action, 'payload.session.notifications', []);
			dispatchNotifications(sessionNotifications, dispatch);

			dispatch(PUBLIC_DECLARATIVE_ACTION_SCRIPT_SUCCESS, {
				...action.payload,
				action: stateAction,
				model
			});
		},
		stopPropagation: true
	},
	[DECLARATIVE_ACTION_SCRIPT_FAILED]: {
		effect: ({state: {action: stateAction, model}, dispatch, action}) => {
			let message = get(action, 'payload.data.error.message', '');
			if (!message) {
				const result = get(action, 'payload.data.result', {});
				const sysId = Object.keys(result)[0];
				message = get(result, `${sysId}.resultBody.error.message`, '');
			}

			if (message)
				dispatch('ADD_NOTIFICATIONS', {
					notifications: [
						{
							type: 'error',
							message
						}
					]
				});

			const sessionNotifications = get(action, 'payload.data.session.notifications', []);
			dispatchNotifications(sessionNotifications, dispatch);

			dispatch(PUBLIC_DECLARATIVE_ACTION_SCRIPT_FAILED, {
				...action.payload,
				action: stateAction,
				model
			});
		},
		stopPropagation: true
	},
	[DECLARATIVE_ACTION_CLOSE_MODAL]: {
		effect: ({updateState}) => {
			updateState({
				displayConfirmation: false
			});
		},
		stopPropagation: true
	},
	[DECLARATIVE_ACTION_OPEN_LINK]: {
		effect: ({action}) => {
			const {
				payload: {url}
			} = action;

			if (url) window.open(url, '_blank');
		},
		stopPropagation: true
	},
	[VALUE_CHANGED]: {
		effect: updateFormFieldValue,
		stopPropagation: true
	},
	// seismic dispatch Standard action dispatched on HTTP errors from the server, and canvas will handle it and display a standard error modal.
	// We don't want that since our call should be handled in component and we already show session message
	[HTTP_ERROR_OCCURRED]: {
		effect: () => {},
		stopPropagation: true
	},
	[COMPONENT_PROPERTY_CHANGED]: context => {
		const {
			properties: {shouldEvaluateDynamicConditions = false}
		} = context;
		if (shouldEvaluateDynamicConditions) {
			handlePropertyChanged(context);
		}
	},
	[DECLARATIVE_ACTION_RUN_DYNAMIC_CONDITIONS]: {
		...runDynamicConditionsEffect,
		stopPropagation: true
	},
	[DECLARATIVE_ACTION_RUN_DYNAMIC_CONDITIONS_COMPLETED]: ({
		action,
		dispatch,
		properties,
		updateState,
		state,
		host
	}) => {
		dynamicConditionCompletedEffect({action, dispatch, properties, updateState, state, host});
	},
	[DECLARATIVE_ACTION_RUN_DYNAMIC_CONDITIONS_FAILED]: ({action}) => {
		console.error('Running Dynamic Conditions Failed', action.payload.errors);
	},
	[COMPONENT_DOM_TREE_READY]: ({
		host,
		properties: {
			modelData = {},
			declarativeActions = [],
			shouldEvaluateDynamicConditions = false
		}
	}) => {
		if (shouldEvaluateDynamicConditions) {
			//update the child of mediator with new DA info
			const {daRelayPropName = ''} = modelData;
			relayDAUpdates(host, daRelayPropName, declarativeActions);
		}
	}
};
