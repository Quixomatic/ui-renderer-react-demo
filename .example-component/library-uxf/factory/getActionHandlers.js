import {isEmpty} from '@devsnc/snowdash';
import {get} from '@devsnc/snowdash';
import {includes} from '@devsnc/snowdash';
import {reduce} from '@devsnc/snowdash';
import resolveForActionPayload from './UxValueResolver/resolveForActionPayload';
import resolveForConditional from './UxValueResolver/resolveForConditional';

import {
	COMPOSITION_ELEMENT_ID,
	CONTAINING_MACROPONENT_SYS_ID,
	DATA_ELEMENT_ID,
	REPEATER_ITEM,
	MODAL_SELECTED,
	MODAL_SELECTED_RELAY,
	internalActions,
	UXF_INTERNAL_EVENT_META,
	HANDLING_SCOPE,
	UXF_INTERNAL_HANDLING_SCOPE_SAFETY,
	SYMBOL_EVENT_MAPPING_SOURCE_IS_SCREEN_ACTION_TRANSFORMER,
	SYMBOL_EVENT_MAPPING_SOURCE_IS_FROM_SUB_PAGE,
	SYMBOL_ORIGINATING_ELEMENT_ID_FOR_CONTROLLER_OP,
	META_PROP_NAME_CONTROLLER_MAP,
	META_PROP_NAME_PARENT_CONTROLLER_DEPENDENCY_MAP,
	publicActionHandlerNames
} from './constants';
import {isActionBlacklisted, isValidElementEventMapping} from './utils';
import {actionTypes as dbActionTypes} from './databrokers/behaviors/data-broker-runtime/constants';
import {
	isValidInternalAction,
	dispatchInternalAction
} from './getInternalEffect';
import {getRootDispatchFn} from '../factory/registry/index.js';
import {getMiPdbDispatchFn} from './registry/getDispatchFn.js';
import getElement from '../utils/dom';
import {isBoolean} from '@devsnc/snowdash';
import {prefetch} from './prefetch/prefetchAction';
import {isNil} from '@devsnc/snowdash';

const {
	SCRIPT_EXEC_REQUESTED,
	WRAPPED_EVENT_REDISPATCH,
	UXF_VIEWPORT_RENDER_BY_ID
} = internalActions;

const {MACROPONENT_POPOVER_OPEN_REQUESTED} = publicActionHandlerNames;

const {UXF_DB_OP_TRIGGER_REQUESTED} = dbActionTypes;

const getParentPageElementIdForSubPage = (
	dataElementId,
	csdbNodeId,
	pdbNodeIds,
	controllerDependencyMap,
	parentControllerDependencyMap
) => {
	if (!controllerDependencyMap) return undefined;

	if (
		dataElementId === csdbNodeId ||
		(pdbNodeIds && pdbNodeIds.includes(dataElementId))
	)
		return undefined;

	//dependency controller case
	if (parentControllerDependencyMap) {
		if (dataElementId.includes('.')) {
			const [depKey, dependencyId] = dataElementId.split('.', 2);
			return get(
				parentControllerDependencyMap,
				`${controllerDependencyMap[depKey]}.${dependencyId}`
			);
		}
	}
	return controllerDependencyMap[dataElementId];
};

const dispatchEvent = (
	dispatchFn,
	actionName,
	payload,
	meta,
	resolvedConditional
) => {
	if (!isBoolean(resolvedConditional)) {
		console.error(
			'Event mapping conditional must be nil or resolve to a Boolean. Event mapping was ignored.'
		);
		resolvedConditional = false;
	}
	if (!resolvedConditional) {
		return;
	}
	dispatchFn(actionName, payload, meta);
	process.env.DEV_MODE ? console.log(actionName, payload, meta) : null;
};

function isValidDataElementEventMapping(sourceDataElementId, dataElementId) {
	return !!sourceDataElementId && sourceDataElementId === dataElementId;
}

function isValidReverseDependencyEventMapping(mappingNodeId, handlingScope) {
	return !!handlingScope && mappingNodeId === handlingScope;
}

function isValidSelfDispatchedAction(coeffects, handledEventNames) {
	const {action} = coeffects;

	const {type: sourceActionName} = action;

	if (isValidInternalAction(coeffects)) {
		return true;
	} else if (handledEventNames.includes(sourceActionName)) {
		if (action.meta.id === coeffects.properties.nowId) {
			// We are handling an action that was dispatched by the same instance of the macroponent.
			// This happens when
			//  - an event mapping's target event is a handled event on the macroponent
			//  - a screen action transformer does a (delegated) event dispatch to a parent's handled event
			//  - a client script calls api.emit for an event that is handled by the macroponent
			return true;
		}
	} else {
		return false;
	}
}

function getModalSelectedMeta(mcpEl, modalId) {
	return {
		elementRef: getElement(mcpEl, modalId)
	};
}

function getUxfInternalEventMetaOnly(coeffects) {
	const {
		action: {
			meta: {[UXF_INTERNAL_EVENT_META]: __uxfEventMeta = {}}
		}
	} = coeffects;

	return {
		[UXF_INTERNAL_EVENT_META]: __uxfEventMeta
	};
}

const getActionHandlerFn = (
	forScreenActionTransformer,
	macroponentSysId,
	macroponentPropertyDefinitions,
	handledEventNames = [],
	rootNodeHandledEventNames = [],
	csdbNodeId,
	pdbNodeIds,
	externalControllerDependencyNames,
	controllerAliasMap,
	eventMappings,
	checkControllerElementFn
) => {
	return (coeffects) => {
		const {
			dispatch: macroponentDispatch,
			action: {
				payload: sourceActionPayload,
				type: sourceActionName,
				meta: {
					appended: appendedSourceActionMeta = {},
					[UXF_INTERNAL_EVENT_META]: {
						sourceCorrelationId: eventMetaSourceCorrelationId = '',
						permitCorrelationIdMismatch:
							eventMetaPermitCorrelationIdMismatch = false
					} = {},
					[SYMBOL_ORIGINATING_ELEMENT_ID_FOR_CONTROLLER_OP]:
						originatingElementIdForControllerOp = ''
				}
			},
			state: seismicState,
			properties: seismicProperties,
			host: mcpEl
		} = coeffects;

		prefetch(sourceActionName, sourceActionPayload, seismicProperties);

		const uxfInternalEventMeta = getUxfInternalEventMetaOnly(coeffects);

		let {
			[COMPOSITION_ELEMENT_ID]: sourceNodeId,
			[CONTAINING_MACROPONENT_SYS_ID]: containingMacroponentSysId,
			[REPEATER_ITEM]: repeaterItem
		} = appendedSourceActionMeta;

		// fixme: canvas still uses appendToPayload on the root
		// screen-action-transformer, which we need to keep make root-level relay
		// events working. a better fix would be to have canvas call some factory
		// function to set up the screen + mcp with the right data. Remove this
		// once that function exists + canvas is using it.
		if (forScreenActionTransformer && !sourceNodeId) {
			sourceNodeId = sourceActionPayload.__uxfCompositionElId;
		}

		const sourceDataElementId = get(sourceActionPayload, [DATA_ELEMENT_ID]);

		const sourceId = sourceDataElementId ? sourceDataElementId : sourceNodeId;

		const sourceAction = {
			elementId: sourceId,
			name: sourceActionName,
			payload: sourceActionPayload,
			context: {}
		};

		/**
		 * If any event mappings have a matching correlation ID, the correct behavior
		 * of only executing mappings with a matching ID should be followed. Otherwise,
		 * the mismatchedCorrelationIdEventMappings should be executed, which prevents
		 * breaking declarative actions that are missing an addon event mapping.
		 * Remove in Xanadu.
		 */
		let hasEventWithMatchingCorrelationId = false;
		const mismatchedCorrelationIdEventMappings = [];

		const filteredEventMappings = eventMappings.filter((em) => {
			const conditional = get(em, ['conditional'], null);
			const passesConditional = isNil(conditional)
				? true
				: resolveForConditional(
						macroponentSysId,
						macroponentPropertyDefinitions,
						csdbNodeId,
						pdbNodeIds,
						externalControllerDependencyNames,
						[],
						controllerAliasMap,
						seismicProperties,
						seismicState,
						sourceAction,
						conditional,
						repeaterItem
				  );

			if (!passesConditional) return false;

			const {
				nodeId,
				dataElementId,
				sourceCorrelationId: mappingSourceCorrelationId,
				[HANDLING_SCOPE]: handlingScopeContainer
			} = em;

			const handlingScope =
				handlingScopeContainer?.[UXF_INTERNAL_HANDLING_SCOPE_SAFETY];

			const validElementEventMapping = isValidElementEventMapping(
				forScreenActionTransformer,
				macroponentSysId,
				sourceNodeId,
				nodeId,
				containingMacroponentSysId,
				eventMetaSourceCorrelationId,
				mappingSourceCorrelationId
			);

			/**
			 * Temporary workaround to address misconfigured list + related list declarative actions.
			 * Remove in Xanadu.
			 */
			if (eventMetaPermitCorrelationIdMismatch) {
				/**
				 * If a valid event mapping exists, all mismatched event mappings will be ignored.
				 * If the event mapping becomes valid via bypassing the correlation ID check,
				 * it should be stored as a mismatched event mapping.
				 */
				if (validElementEventMapping) {
					hasEventWithMatchingCorrelationId = true;
				} else if (
					isValidElementEventMapping(
						forScreenActionTransformer,
						macroponentSysId,
						sourceNodeId,
						nodeId,
						containingMacroponentSysId,
						'',
						mappingSourceCorrelationId
					)
				) {
					mismatchedCorrelationIdEventMappings.push(em);
				}
			}

			return (
				validElementEventMapping ||
				isValidDataElementEventMapping(sourceDataElementId, dataElementId) ||
				isValidReverseDependencyEventMapping(nodeId, handlingScope) ||
				(nodeId === 'root' &&
					isValidSelfDispatchedAction(coeffects, handledEventNames))
			);
		});

		let newFilteredEventMappings;

		/**
		 * If mismatch is not permitted, a matching event is found, or no mismatched event mappings are found, keep the existing filtered event mappings.
		 * Remove in Xanadu. Otherwise, warn the user and include the mismatched event mappings.
		 */
		if (
			!eventMetaPermitCorrelationIdMismatch ||
			hasEventWithMatchingCorrelationId ||
			isEmpty(mismatchedCorrelationIdEventMappings)
		) {
			newFilteredEventMappings = filteredEventMappings;
		} else {
			console.error(
				`No matching event mapping found for action with ID ${eventMetaSourceCorrelationId}. A new event mapping must be created. This fallback will no longer occur in the next release.`
			);
			newFilteredEventMappings = filteredEventMappings.concat(
				mismatchedCorrelationIdEventMappings
			);
		}

		for (const eventMapping of newFilteredEventMappings) {
			const {
				nodeId,
				payload: definedPayload,
				conditional,
				targetEventName,
				scriptSysId,
				operation,
				[HANDLING_SCOPE]: handlingScopeContainer
			} = eventMapping;

			const handlingScope =
				handlingScopeContainer?.[UXF_INTERNAL_HANDLING_SCOPE_SAFETY];
			const handlerDispatch = isNil(handlingScope)
				? macroponentDispatch
				: getMiPdbDispatchFn(mcpEl, handlingScope, macroponentDispatch);

			const sourceId = sourceDataElementId ? sourceDataElementId : sourceNodeId;

			const sourceAction = {
				elementId: sourceId,
				name: sourceActionName,
				payload: sourceActionPayload,
				context: {}
			};

			if (!isNil(repeaterItem)) {
				sourceAction.context.item = repeaterItem;
			}

			if (!isNil(scriptSysId)) {
				/**!
				 * Preserves the originating elementId of event object in client scripting API.
				 * currentElementId has been introduced in the event object to access the controller instance.
				 **/
				if (!isEmpty(originatingElementIdForControllerOp)) {
					sourceAction.elementId = originatingElementIdForControllerOp;
					sourceAction.currentElementId = sourceId;
				}

				dispatchInternalAction(handlerDispatch, SCRIPT_EXEC_REQUESTED, {
					scriptSysId,
					sourceAction
				});
			} else if (!isNil(operation)) {
				let resolvedOperation = operation;
				let meta = {
					[SYMBOL_EVENT_MAPPING_SOURCE_IS_SCREEN_ACTION_TRANSFORMER]:
						forScreenActionTransformer
				};
				const parentElementId = getParentPageElementIdForSubPage(
					operation.dataElementId,
					csdbNodeId,
					pdbNodeIds,
					seismicProperties[META_PROP_NAME_CONTROLLER_MAP],
					seismicProperties[META_PROP_NAME_PARENT_CONTROLLER_DEPENDENCY_MAP]
				);
				if (parentElementId) {
					meta = {
						...meta,
						[SYMBOL_EVENT_MAPPING_SOURCE_IS_FROM_SUB_PAGE]: true
					};
					resolvedOperation = {
						...resolvedOperation,
						dataElementId: parentElementId
					};
				}

				// append meta only for controller operation
				if (
					checkControllerElementFn &&
					checkControllerElementFn(operation.dataElementId)
				) {
					meta = {
						...meta,
						[SYMBOL_ORIGINATING_ELEMENT_ID_FOR_CONTROLLER_OP]: nodeId
					};
				}
				const resolvedPayload = resolveForActionPayload(
					macroponentSysId,
					macroponentPropertyDefinitions,
					csdbNodeId,
					pdbNodeIds,
					externalControllerDependencyNames,
					[],
					controllerAliasMap,
					seismicProperties,
					seismicState,
					sourceAction,
					definedPayload,
					repeaterItem
				);

				dispatchInternalAction(
					handlerDispatch,
					UXF_DB_OP_TRIGGER_REQUESTED,
					{
						operation: resolvedOperation,
						operationPayload: resolvedPayload
					},
					meta
				);
			} else {
				if (isNil(targetEventName)) {
					console.error(
						`Event mapping target action is undefined (for elementId = ${sourceId})`
					);
				} else if (isActionBlacklisted(targetEventName)) {
					console.error(
						`Refusing to dispatch internal action: ${targetEventName}`
					);
				} else {
					const payload = resolveForActionPayload(
						macroponentSysId,
						macroponentPropertyDefinitions,
						csdbNodeId,
						pdbNodeIds,
						externalControllerDependencyNames,
						[],
						controllerAliasMap,
						seismicProperties,
						seismicState,
						sourceAction,
						definedPayload,
						repeaterItem
					);
					const resolvedConditional = isNil(conditional)
						? true
						: resolveForConditional(
								macroponentSysId,
								macroponentPropertyDefinitions,
								csdbNodeId,
								pdbNodeIds,
								externalControllerDependencyNames,
								[],
								controllerAliasMap,
								seismicProperties,
								seismicState,
								sourceAction,
								conditional,
								repeaterItem
						  );

					// For Open close modal event with viewport modal,
					//   - load the viewport
					//   - hoist the modal to canvas-modal-hoist (dispatch MODAL_SELECTED)
					if (
						includes(targetEventName, MODAL_SELECTED_RELAY) &&
						!isEmpty(get(payload, ['viewportElementId'])) &&
						!isEmpty(get(payload, ['viewportRoute']))
					) {
						const viewportPayload = {
							route: get(payload, ['viewportRoute']),
							fields: get(payload, ['viewportFields']),
							params: get(payload, ['viewportParams']),
							viewportElementId: get(payload, ['viewportElementId'])
						};

						const modalPayload = {
							modalId: get(payload, ['modalId']),
							showModal: get(payload, ['showModal']),
							displayOptions: get(payload, ['displayOptions']),
							bare: get(payload, ['bare']),
							headerLabel: get(payload, ['headerLabel'])
						};

						dispatchEvent(
							handlerDispatch,
							UXF_VIEWPORT_RENDER_BY_ID,
							viewportPayload,
							uxfInternalEventMeta,
							resolvedConditional
						);

						dispatchEvent(
							handlerDispatch,
							MODAL_SELECTED,
							modalPayload,
							uxfInternalEventMeta,
							resolvedConditional
						);
					} else if (targetEventName === MODAL_SELECTED) {
						const meta = {
							...getModalSelectedMeta(mcpEl.firstElementChild, payload.modalId),
							...uxfInternalEventMeta
						};
						dispatchEvent(
							handlerDispatch,
							targetEventName,
							payload,
							meta,
							resolvedConditional
						);
					} else if (targetEventName === MACROPONENT_POPOVER_OPEN_REQUESTED) {
						const meta = {
							sourceAction,
							...uxfInternalEventMeta
						};
						dispatchEvent(
							handlerDispatch,
							targetEventName,
							payload,
							meta,
							resolvedConditional
						);
					} else if (rootNodeHandledEventNames.includes(targetEventName)) {
						const dispatchFn = getRootDispatchFn(mcpEl, handlerDispatch);
						dispatchEvent(
							dispatchFn,
							targetEventName,
							payload,
							uxfInternalEventMeta,
							resolvedConditional
						);
					} else if (
						forScreenActionTransformer &&
						seismicProperties.nowUxfDelegateDispatch
					) {
						// For event mappings to other dispatchedEvents of the macroponent,
						// we want the macroponent itself to do the dispatching so that
						// emitter information is captured correctly. This way, we propogate the
						// event up the chain to the macroponent, and let that unwrap our action
						// and redispatch up like normal. Otherwise, the event looks like it comes
						// from the screen action transformer (not good)
						dispatchInternalAction(
							handlerDispatch,
							WRAPPED_EVENT_REDISPATCH,
							{
								targetEventName,
								wrappedPayload: payload
							},
							uxfInternalEventMeta
						);
					} else {
						dispatchEvent(
							handlerDispatch,
							targetEventName,
							payload,
							uxfInternalEventMeta,
							resolvedConditional
						);
					}
				}
			}
		}
	};
};

export const getActionHandlers = (
	consolidatedEventMappings,
	forScreenActionTransformer,
	macroponentSysId,
	handledEventNames,
	rootNodeHandledEventNames,
	macroponentPropertyDefinitions,
	csdbNodeId,
	pdbNodeIds,
	externalControllerDependencyNames,
	controllerAliasMap,
	checkControllerElementFn
) => {
	return reduce(
		consolidatedEventMappings,
		(acc, eventMappings, actionName) => {
			const stopPropagation = eventMappings[0]?.stopPropagation;
			const stopPropagationConfig = stopPropagation ? {stopPropagation} : {};
			acc[actionName] = {
				effect: getActionHandlerFn(
					forScreenActionTransformer,
					macroponentSysId,
					macroponentPropertyDefinitions,
					handledEventNames,
					rootNodeHandledEventNames,
					csdbNodeId,
					pdbNodeIds,
					externalControllerDependencyNames,
					controllerAliasMap,
					eventMappings,
					checkControllerElementFn
				),
				...stopPropagationConfig
			};
			return acc;
		},
		{}
	);
};
