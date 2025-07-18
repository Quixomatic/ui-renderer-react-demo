import {actionTypes} from '@servicenow/ui-core';
import {intentActions} from '@devsnc/library-intent-channel';
import {
	SYMBOL_ORIGINATING_ELEMENT_ID_FOR_CONTROLLER_OP,
	internalActions,
	COMPOSITION_ELEMENT_ID,
	MODAL_SELECTED
} from '../../constants';
import {actionTypes as dbActionTypes} from '../../databrokers/behaviors/data-broker-runtime/constants';
import {dispatchInternalAction} from '../../getInternalEffect';
import {getExperienceName} from '../../nodeRenderers/helpers';
import {isEqual, get, omit} from '@devsnc/snowdash';
import {
	getActionbarsForTranslator,
	deleteActionBarsForTranslator
} from './translatorDAHelpers';
import {triggerAction} from '@servicenow/now-trigger-library';
import {
	intentType,
	intentTarget,
	dataOperations,
	recordControllerOperations,
	gFormOperations,
	feedbackStatus,
	ACTION_BAR_TRIGGER_ACTION_KEY,
	ACTION_BAR_GET_ACTION_STATE_KEY,
	recordControllerActions,
	gFormDataBrokerActions
} from './constants';
import {
	getOpenedModal,
	getModalConfirmAction,
	getModalCancelAction
} from './translatorModalHelper';

const {UXF_DB_OP_TRIGGER_REQUESTED} = dbActionTypes;
const {
	COMPONENT_PROPERTY_CHANGED,
	COMPONENT_CONNECTED,
	COMPONENT_DISCONNECTED
} = actionTypes;
const {
	CONTROLLER_PROP_RESOLVED,
	CONTROLLER_PROP_CHANGED,
	CONTROLLER_NODE_INSERTED
} = internalActions;

const contextProps = {
	table: ['table', 'inputTable'],
	sysId: ['sysId', 'inputSysId']
};

const {
	UPDATE_CONTEXT,
	SET_ACTIVE_CONTEXT,
	UNSET_ACTIVE_CONTEXT,
	INTENT_RECEIVED,
	SEND_INTENT_FEEDBACK,
	SEND_SYSTEM_MESSAGE
} = intentActions;

const hasContextChanged = (name, previousValue, value) => {
	const isContextProp = Object.values(contextProps).some((props) =>
		props.includes(name)
	);
	return isContextProp && value !== previousValue;
};

const hasActiveChanged = (name, previousValue, value) => {
	const isScreen = name === 'screen';
	return isScreen && value.isActive !== previousValue.isActive;
};

const getContext = (properties, experienceName) => {
	const context = Object.keys(contextProps).reduce((acc, key) => {
		const propName = contextProps[key].find((prop) =>
			Object.prototype.hasOwnProperty.call(properties, prop)
		);
		acc[key] = properties[propName];
		return acc;
	}, {});
	return {
		...context,
		experienceName
	};
};

const shouldUpdateContext = (nodeId, context, pageContexts) =>
	!isEqual(context, pageContexts[nodeId]);

const isActiveScreen = (properties) => properties.screen?.isActive;

const getSupportedOperations = (dataShell, nodeId) => {
	const dataElements = dataShell?.dataElements || {};
	const dataBrokerSysId = dataElements[nodeId]?.definitionSysId;
	const dataBroker = dataShell?.dataBrokers?.[dataBrokerSysId];
	return Object.keys(dataBroker.operations);
};

const getField = (fieldName, nodes, dbNodeId, path) => {
	return get(nodes, `${dbNodeId}.${path}.${fieldName}`);
};

const sendFeedback = (dispatch, originalIntent, status, message) => {
	dispatch(SEND_INTENT_FEEDBACK, {
		originalIntent,
		status,
		message
	});
};

export default function getTranslatorBehavior({
	uxControllerNodes,
	clientStateDataBrokerNode,
	nodeId,
	macroponentSysId,
	dataShell
}) {
	const recordController = uxControllerNodes?.filter(
		(ctrlNode) =>
			ctrlNode.definitionSysId === '67ee2538534501108135ddeeff7b121b'
	)[0];

	const hasFormDataBroker =
		clientStateDataBrokerNode?.definitionSysId ==
		'd8df214579298b9e2b995730cb53b9e3';

	//TODO: support multiple record controllers
	const dbNodeId = recordController
		? recordController.nodeId
		: hasFormDataBroker
		? clientStateDataBrokerNode.nodeId
		: '';
	const dataOperationsAdapter = recordController
		? recordControllerOperations
		: hasFormDataBroker
		? gFormOperations
		: {};

	const fieldsPath = recordController
		? `form.fields`
		: hasFormDataBroker
		? `nowRecordFormBlob.fields`
		: '';
	const matchedContext = (identifier, pageContexts) => {
		const currentContext = pageContexts?.[dbNodeId];
		if (!currentContext) return false;
		if (
			Object.keys(identifier).some(
				(key) => currentContext[key] !== identifier[key]
			)
		)
			return false;

		return true;
	};

	const getLookupContext = (pageContexts) =>
		omit(pageContexts?.[dbNodeId], 'experienceName');

	const isValidNode = (nowId = '') => {
		const nodeId = nowId.split('-').pop();
		return nodeId && nodeId === dbNodeId;
	};

	const handleFormSubmit = (action, host, dispatch) => {
		const {status, messages, ...rest} = action.payload;
		dispatch(SEND_SYSTEM_MESSAGE, {
			message: {
				status,
				messages,
				...rest
			}
		});
	};

	//let experienceName;
	let translatorData = {};
	return {
		name: 'translatorBehavior',
		setInitialState({properties}) {
			const experienceName = getExperienceName(properties);
			return {experienceName};
		},
		actionHandlers: {
			[COMPONENT_CONNECTED]({dispatch, properties, host}) {
				if (dbNodeId)
					translatorData[host.nowId] = {
						contexts: {},
						nodes: {}
					};

				if (isActiveScreen(properties))
					dispatch(SET_ACTIVE_CONTEXT, {translatorId: host.nowId});
			},
			[INTENT_RECEIVED]({action, dispatch, host}) {
				const intent = action.payload.intent;
				const {
					identifier = {},
					type,
					target,
					operation,
					operationPayload
				} = intent;

				if (!matchedContext(identifier, translatorData[host.nowId].contexts))
					return;

				if (type === intentType.DATA_OPERATION) {
					if (target !== intentTarget.FORM) return;

					if (operation === dataOperations.GET_FIELD) {
						const {fieldName} = operationPayload;
						const field = getField(
							fieldName,
							translatorData[host.nowId].nodes,
							dbNodeId,
							fieldsPath
						);
						const status = field
							? feedbackStatus.SUCCESS
							: feedbackStatus.ERROR;
						sendFeedback(dispatch, intent, status, {
							field
						});
					} else if (operation === dataOperations.GET_ACTION_STATE) {
						const actionBars = getActionbarsForTranslator(
							host.nowId,
							getLookupContext(translatorData[host.nowId].contexts)
						);
						actionBars.forEach((actionBar) =>
							triggerAction(
								actionBar,
								ACTION_BAR_GET_ACTION_STATE_KEY,
								operationPayload
							).then(
								(result) => {
									sendFeedback(dispatch, intent, feedbackStatus.SUCCESS, {
										...result
									});
								},
								(error) => {
									sendFeedback(dispatch, intent, feedbackStatus.ERROR, {
										error
									});
								}
							)
						);
					} else if (operation === dataOperations.EXECUTE_ACTION) {
						const actionBars = getActionbarsForTranslator(
							host.nowId,
							getLookupContext(translatorData[host.nowId].contexts)
						);
						actionBars.some((actionBar) => {
							triggerAction(
								actionBar,
								ACTION_BAR_TRIGGER_ACTION_KEY,
								operationPayload
							);
						});
					} else if (operation === dataOperations.CLOSE_OPENED_MODAL) {
						const {type, buttonAction} = operationPayload;
						if (type !== 'close')
							//only support close for now
							return;
						const key = host.parentNode?.nowId;
						const openedModalInfo = key ? getOpenedModal(key) : undefined;

						if (!openedModalInfo) {
							dispatchInternalAction(
								dispatch,
								UXF_DB_OP_TRIGGER_REQUESTED,
								{
									operation: {
										dataElementId: dbNodeId,
										operationName: dataOperationsAdapter[operation]
									},
									operationPayload
								},
								{[SYMBOL_ORIGINATING_ELEMENT_ID_FOR_CONTROLLER_OP]: nodeId}
							);
							return;
						}

						if (buttonAction === 'confirm') {
							const confirmActionType = getModalConfirmAction(
								openedModalInfo.type
							);
							if (confirmActionType) dispatch(confirmActionType);
							else {
								sendFeedback(dispatch, intent, feedbackStatus.WARN, {
									error: `Unable to execute button action '${buttonAction}'`
								});
							}
						} else if (buttonAction === 'cancel') {
							const cancelActionType = getModalCancelAction(
								openedModalInfo.type
							);
							if (cancelActionType) dispatch(cancelActionType);
							else {
								sendFeedback(dispatch, intent, feedbackStatus.WARN, {
									error: `Unable to execute button action '${buttonAction}'`
								});
							}
						}

						dispatch(
							MODAL_SELECTED,
							{showModal: false},
							{appended: {[COMPOSITION_ELEMENT_ID]: openedModalInfo.modalId}}
						);
					} else if (dataOperationsAdapter[operation]) {
						dispatchInternalAction(
							dispatch,
							UXF_DB_OP_TRIGGER_REQUESTED,
							{
								operation: {
									dataElementId: dbNodeId,
									operationName: dataOperationsAdapter[operation]
								},
								operationPayload
							},
							{[SYMBOL_ORIGINATING_ELEMENT_ID_FOR_CONTROLLER_OP]: nodeId}
						);
					}
				} else if (type === intentType.DB_OPERATION) {
					const dbOperations = getSupportedOperations(dataShell, dbNodeId);

					if (dbOperations.includes(operation)) {
						dispatchInternalAction(
							dispatch,
							UXF_DB_OP_TRIGGER_REQUESTED,
							{
								operation: {
									dataElementId: dbNodeId,
									operationName: operation
								},
								operationPayload
							},
							{[SYMBOL_ORIGINATING_ELEMENT_ID_FOR_CONTROLLER_OP]: nodeId}
						);
					}
				}
			},
			[CONTROLLER_PROP_RESOLVED]({action, dispatch, host, state}) {
				const {properties, nodeId, definitionSysId, containerSysId} =
					action.payload;
				if (macroponentSysId !== containerSysId) return;
				if (!nodeId || !definitionSysId) return;
				if (!recordController && !clientStateDataBrokerNode) return;

				if (
					(recordController?.nodeId === nodeId &&
						recordController?.definitionSysId === definitionSysId) ||
					(clientStateDataBrokerNode?.nodeId === nodeId &&
						clientStateDataBrokerNode?.definitionSysId === definitionSysId)
				) {
					const context = getContext(properties, state.experienceName);
					if (
						!shouldUpdateContext(
							nodeId,
							context,
							translatorData[host.nowId].contexts
						)
					)
						return;
					translatorData[host.nowId].contexts[nodeId] = context;
					dispatch(UPDATE_CONTEXT, {context});
				}
			},
			[CONTROLLER_PROP_CHANGED]({action, dispatch, host, state}) {
				const {
					payload: {
						name,
						value,
						previousValue,
						isOutputProp,
						properties: props,
						nowId
					}
				} = action;
				if (isOutputProp) return;
				if (!isValidNode(nowId)) return;
				if (hasContextChanged(name, previousValue, value)) {
					const context = {
						...getContext(props, state.experienceName),
						[name]: value
					};
					if (
						!shouldUpdateContext(
							nodeId,
							context,
							translatorData[host.nowId].contexts
						)
					)
						return;
					translatorData[host.nowId].contexts[nodeId] = context;
					dispatch(UPDATE_CONTEXT, {
						context
					});
				}
			},
			[COMPONENT_PROPERTY_CHANGED]({action, dispatch, host}) {
				const {
					payload: {name, value, previousValue}
				} = action;

				if (hasActiveChanged(name, previousValue, value)) {
					if (value?.isActive)
						dispatch(SET_ACTIVE_CONTEXT, {translatorId: host.nowId});
					else dispatch(UNSET_ACTIVE_CONTEXT, {translatorId: host.nowId});
				}
			},
			[CONTROLLER_NODE_INSERTED]({action, host}) {
				const {nodeId, definitionSysId, containerSysId, node} = action.payload;

				if (macroponentSysId !== containerSysId) return;
				if (!nodeId || !definitionSysId) return;
				if (!recordController && !clientStateDataBrokerNode) return;
				if (
					(recordController?.nodeId === nodeId &&
						recordController?.definitionSysId === definitionSysId) ||
					(clientStateDataBrokerNode?.nodeId === nodeId &&
						clientStateDataBrokerNode?.definitionSysId === definitionSysId)
				) {
					translatorData[host.nowId].nodes[nodeId] = node;
				}
			},
			[COMPONENT_DISCONNECTED]({host}) {
				delete translatorData[host.nowId];
				deleteActionBarsForTranslator(host.nowId);
			},
			[recordControllerActions.FORM_SUBMIT_COMPLETED]: {
				effect: ({action, host, dispatch}) => {
					if (!recordController) return;
					handleFormSubmit(action, host, dispatch);
				},
				stopPropagation: true
			},
			[gFormDataBrokerActions.FORM_SUBMIT_COMPLETED]: {
				effect: ({action, host, dispatch}) => {
					if (recordController || !clientStateDataBrokerNode) return;
					handleFormSubmit(action, host, dispatch);
				},
				stopPropagation: true
			}
		}
	};
}
