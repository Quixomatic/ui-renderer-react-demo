import getInternalEffect, {
	dispatchInternalAction,
	getModifiedMetaForInternalActionDispatch
} from '../../getInternalEffect';
import {actionTypes as dbActionTypes} from '../../databrokers/behaviors/data-broker-runtime/constants';
import {default as console} from '../../../utils/getLogger';
import {
	COMPOSITION_ELEMENT_ID,
	UXF_INTERNAL_DEPENDENCY_OP_REQUEST_RELAYED,
	UXF_INTERNAL_DEPENDENCY_OP_REQUESTED
} from '../../constants';
import {getParentDispatchFn} from '../../registry/getDispatchFn';

const {UXF_DB_OP_TRIGGER_REQUESTED} = dbActionTypes;

export default (controllerNodes, externalDependencies) => {
	const hasTargetableDependency = !!externalDependencies?.length;
	const hasChildrenToMediate = !!controllerNodes?.length;
	return {
		name: 'dependencyEventTargeting',
		actionHandlers: {
			[UXF_INTERNAL_DEPENDENCY_OP_REQUESTED]: getInternalEffect({
				effect(coeffects) {
					if (!hasTargetableDependency) return;
					const {
						action: {payload, meta},
						dispatch: localDispatch,
						host
					} = coeffects;
					const {
						appendToMeta: {[COMPOSITION_ELEMENT_ID]: dependencyMappingSourceId}
					} = host;
					// IMPORTANT: Avoid using anywhere else! See important note in this functions src file!
					const dispatch = getParentDispatchFn(host, localDispatch);
					dispatch(
						UXF_INTERNAL_DEPENDENCY_OP_REQUEST_RELAYED,
						payload,
						getModifiedMetaForInternalActionDispatch({
							...meta,
							dependencyMappingSourceId
						})
					);
				}
			}),
			[UXF_INTERNAL_DEPENDENCY_OP_REQUEST_RELAYED]: getInternalEffect({
				effect(coeffects) {
					if (!hasChildrenToMediate) return;
					const {
						action: {
							payload: {dependencyAlias, dependencyOp, wrappedPayload},
							meta
						},
						dispatch
					} = coeffects;
					const {dependencyMappingSourceId} = meta;

					const sourceController = controllerNodes.find(
						(node) => node.nodeId === dependencyMappingSourceId
					);
					if (!sourceController) {
						console.warn(
							`${UXF_INTERNAL_DEPENDENCY_OP_REQUEST_RELAYED} is an internal API and not available to component authors. Event mapping was ignored.`
						);
						return;
					}

					const targetController =
						sourceController.dependencies[dependencyAlias];
					if (
						!targetController ||
						!targetController.controllerElementId ||
						targetController.controllerElementId === ''
					) {
						console.warn(
							`Could not find Controller Dependency Event Mapping Target for ${dependencyAlias}.${dependencyOp}. Event mapping was ignored.`
						);
						return;
					}

					dispatchInternalAction(
						dispatch,
						UXF_DB_OP_TRIGGER_REQUESTED,
						{
							operation: {
								operationName: dependencyOp,
								dataElementId: targetController.controllerElementId
							},
							operationPayload: wrappedPayload
						},
						meta
					);
				}
			}),
			[UXF_DB_OP_TRIGGER_REQUESTED]: getInternalEffect({
				stopPropagation: false, // This needs to be false (instead, we'll call action.stopPropataion to keep this same behavior here), so it won't override the behavior we want in getDataBrokerOperationHandlers.
				effect: ({action, dispatch}) => {
					action.stopPropagation();

					if (!hasTargetableDependency) return;
					const {
						payload: {
							operation: {dataElementId, operationName},
							operationPayload
						},
						meta
					} = action;

					if (!externalDependencies.some((dep) => dep.name === dataElementId))
						return;

					dispatchInternalAction(
						dispatch,
						UXF_INTERNAL_DEPENDENCY_OP_REQUESTED,
						{
							dependencyAlias: dataElementId,
							dependencyOp: operationName,
							wrappedPayload: operationPayload
						},
						meta
					);
				}
			})
		}
	};
};
