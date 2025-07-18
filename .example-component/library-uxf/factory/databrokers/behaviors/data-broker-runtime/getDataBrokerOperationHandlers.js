import {get} from '@devsnc/snowdash';
import {actionTypes} from './constants';
import {
	SYMBOL_EVENT_MAPPING_SOURCE_IS_SCREEN_ACTION_TRANSFORMER,
	SYMBOL_EVENT_MAPPING_SOURCE_IS_FROM_SUB_PAGE,
	SYMBOL_ORIGINATING_ELEMENT_ID_FOR_CONTROLLER_OP,
	CONTROLLER
} from '../../../constants.js';
import getResolvedInputsForDbOpExec from '../../../UxValueResolver/getResolvedInputsForDbOpExec';
import {
	getInternalEffect,
	dispatchInternalAction
} from '../../../getInternalEffect.js';
import {getNamespacedComponentId} from '../../../utils';
const UXF_CSDB_ID = Symbol.for(
	'__DO_NOT_USE_THS_IS_NOT_A_PUBLIC_API__uxfCsdbId'
);
const {
	UXF_DB_OP_EXEC_REQUESTED,
	UXF_DB_REFRESH_RELATED_REQUESTED,
	UXF_DB_OP_TRIGGER_REQUESTED
} = actionTypes;
import {getCsdbDispatchFn, getMiPdbDispatchFn} from '../../../registry';
import {default as console} from '../../../../utils/getLogger.js';
import {isNil} from '@devsnc/snowdash';

export default function getDataBrokerOperationHandlers(
	csdbNode,
	dataShell,
	hasPdbNode,
	targetExclusions = [],
	isControllerMacroponent
) {
	const hasCsdbNode = !isNil(csdbNode);

	return {
		[UXF_DB_OP_TRIGGER_REQUESTED]: getInternalEffect({
			stopPropagation: false,
			effect: ({action, dispatch, host, properties}) => {
				const {
					payload: {
						operation: {dataElementId, operationName},
						operationPayload
					},
					meta: {
						[SYMBOL_EVENT_MAPPING_SOURCE_IS_SCREEN_ACTION_TRANSFORMER]:
							sourceIsScreenActionTransformer,
						[SYMBOL_EVENT_MAPPING_SOURCE_IS_FROM_SUB_PAGE]: sourceIsFromSubPage,
						[SYMBOL_ORIGINATING_ELEMENT_ID_FOR_CONTROLLER_OP]:
							originatingElementIdForControllerOp,
						id: actionSourceElementId
					}
				} = action;
				const {nowId} = properties;
				// When the source is a screenActionTransformer or sourceIsFromSubPage and the incoming
				// targeted host is a controller macroponent we need to allow propagation so that
				// the action bubbles up to the page definition macroponent. In any other case, we
				// want to fallback to the previous behavior and stop propagation
				if (
					isControllerMacroponent &&
					(sourceIsScreenActionTransformer || sourceIsFromSubPage)
				)
					return;

				// when action is dispatched from subpage intending for parent controller, it should bypass handling the event so it'll be handled on the parent page.
				// this is the case when subpage also has its own controller.
				if (sourceIsFromSubPage && nowId === actionSourceElementId) return;

				action.stopPropagation();

				if (targetExclusions.includes(dataElementId)) return;

				const dataBrokerId = get(dataShell, [
					'dataElements',
					dataElementId,
					'definitionSysId'
				]);

				const dataBrokerType = get(dataShell, [
					'dataElements',
					dataElementId,
					'type'
				]);

				const operationDefinition = get(dataShell, [
					'dataBrokers',
					dataBrokerId,
					'operations',
					operationName
				]);

				if (isNil(operationDefinition)) {
					console.warn(
						`Unable to locate data broker with id = ${dataElementId}, operation name = ${operationName}`
					);
					return;
				}

				switch (operationDefinition.type) {
					case 'refresh':
						if (!isNil(dataElementId))
							dispatchInternalAction(
								dispatch,
								UXF_DB_REFRESH_RELATED_REQUESTED,
								{
									id: dataElementId
								}
							);
						break;
					case 'broker':
						//for data broker, the source element have to be the same as the actionSourceElementId because only a macroponent that has a data broker will be able to execute/refresh.
						if (nowId !== actionSourceElementId) return;

						dispatchInternalAction(
							dispatch,
							UXF_DB_OP_EXEC_REQUESTED,
							{
								data: [
									{
										type: operationDefinition.targetActionType, // fixme: derive from broker def
										definitionSysId: operationDefinition.targetActionId,
										parentResourceId: dataElementId,
										inputValues: getResolvedInputsForDbOpExec(
											operationDefinition.targetActionInputValues,
											operationPayload
										)
									}
								]
							},
							{operationName: operationDefinition.name}
						);
						break;
					case 'delegate':
						{
							var dbDispatch;
							if (dataBrokerType === CONTROLLER || (hasPdbNode && !hasCsdbNode))
								dbDispatch = getMiPdbDispatchFn(host, dataElementId, dispatch);
							else if (hasCsdbNode)
								dbDispatch = getCsdbDispatchFn(host, csdbNode.nodeId, dispatch);
							else dbDispatch = dispatch;

							let operationMeta = {
								[UXF_CSDB_ID]: getNamespacedComponentId(
									nowId,
									hasCsdbNode ? csdbNode.nodeId : dataElementId
								)
							};

							if (dataBrokerType === CONTROLLER) {
								operationMeta = {
									...operationMeta,
									[SYMBOL_ORIGINATING_ELEMENT_ID_FOR_CONTROLLER_OP]:
										originatingElementIdForControllerOp
								};
							}

							dbDispatch(
								operationDefinition.targetEventName,
								operationPayload,
								operationMeta
							);
						}
						break;
					default:
						break;
				}
			}
		})
	};
}
