import {t} from 'sn-translate';
import getElement from '../../../utils/dom';
import {getNamespacedComponentId} from '../../utils';
import {
	publicActionHandlerNames,
	publicDispatchedActionNames
} from '../../constants';
import {dispatchInternalAction} from '../../getInternalEffect';

const {MACROPONENT_POPOVER_OPEN_REQUESTED} = publicActionHandlerNames;
const {MACROPONENT_POPOVER_ERROR_OCCURRRED} = publicDispatchedActionNames;

export default () => {
	return {
		name: 'popoverOpenRequested',
		actionHandlers: {
			[MACROPONENT_POPOVER_OPEN_REQUESTED]: {
				effect: ({
					action: {
						type: name,
						payload,
						meta: {sourceAction}
					},
					host,
					dispatch
				}) => {
					const handleError = (fieldName) =>
						dispatchInternalAction(
							dispatch,
							MACROPONENT_POPOVER_ERROR_OCCURRRED,
							{
								message: t('{0} element not found', fieldName),
								sourceAction: {name, payload}
							}
						);
					const {
						popoverElementId,
						popoverTargetElementId,
						popoverTriggerElement: triggerEl
					} = payload;
					const getTargetEl = () => {
						const targetElementId = popoverTargetElementId
							? popoverTargetElementId
							: getNamespacedComponentId(
									host?.nowId,
									sourceAction?.elementId,
									sourceAction?.context?.item
							  );
						return targetElementId && getElement(host, targetElementId, true);
					};
					const popoverEl =
						popoverElementId && getElement(host, popoverElementId);
					if (popoverEl) {
						const targetEl = getTargetEl() || triggerEl;
						if (targetEl) {
							popoverEl.positionTarget = targetEl;
							popoverEl.opened = true;
							if (triggerEl) {
								const handler = (event) => {
									popoverEl.removeEventListener(
										'NOW_POPOVER#OPENED_SET',
										handler
									);
									const {actionSource, value} = event?.detail?.payload || {};
									if (!value && actionSource === 'escape-press')
										triggerEl.focus();
								};
								popoverEl.addEventListener('NOW_POPOVER#OPENED_SET', handler);
							}
						} else handleError('popoverTargetElementId');
					} else handleError('popoverElementId');
				},
				stopPropagation: true
			}
		}
	};
};
