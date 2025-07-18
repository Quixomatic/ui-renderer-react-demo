import {deepSearchElement} from './utils';
import {MODAL_SELECTED, publicActionHandlerNames} from '../factory/constants';
let dialog_controller = null;

export const toggleModalOverrides = (modalPayload) => {
	const canvasModalHoist = findCanvasModalHoist();

	if (!canvasModalHoist) {
		console.warn('sn-canvas-modal-hoist is not found or mounted yet');
		return;
	}

	canvasModalHoist.dispatch(MODAL_SELECTED, {
		...modalPayload,
		skipBlocking: true
	});
};

const findCanvasModalHoist = () => {
	const appShellMacroponent = document.querySelector('[macroponent-namespace]');

	if (
		!appShellMacroponent ||
		appShellMacroponent.tagName.toLowerCase().indexOf('macroponent-') !== 0
	) {
		console.warn('appShellMacroponent is not found or mounted yet');
		return;
	}
	return deepSearchElement('sn-canvas-modal-hoist', appShellMacroponent);
};

export const openPopoverOverrides = (macroponentSysId, popoverPayload) => {
	const {MACROPONENT_POPOVER_OPEN_REQUESTED} = publicActionHandlerNames;
	const popoverMacroponent = deepSearchElement(
		'macroponent-' + macroponentSysId
	);

	if (!popoverMacroponent) {
		console.warn(
			'macroponent-%s is not found or mounted yet',
			macroponentSysId
		);
		return;
	}
	popoverMacroponent.dispatch(MACROPONENT_POPOVER_OPEN_REQUESTED, {
		...popoverPayload,
		skipBlocking: true
	});
};

export const openDialogOverrides = (dialogControllerSysId, modelessPayload) => {
	const {OPEN_MODELESS_DIALOG} = publicActionHandlerNames;
	dialog_controller = !dialog_controller
		? deepSearchElement('macroponent-' + dialogControllerSysId)
		: dialog_controller;
	dialog_controller.dispatch(OPEN_MODELESS_DIALOG, {
		...modelessPayload,
		skipBlocking: true
	});
};

export const closeDialogOverrides = (dialogControllerSysId) => {
	const {CLOSE_MODELESS_DIALOG} = publicActionHandlerNames;
	dialog_controller = !dialog_controller
		? deepSearchElement('macroponent-' + dialogControllerSysId)
		: dialog_controller;
	dialog_controller.dispatch(CLOSE_MODELESS_DIALOG, {
		skipBlocking: true
	});
};
