let openedModals = {};

const MODAL_TYPE = {
	ALERT: 'alert',
	CONFIRM: 'confirm',
	CONFIRM_DESTROY: 'confirm-destroy',
	IFRAME: 'iframe',
	VIEWPORT: 'viewport',
	UNKNOWN: 'unknown'
};

const getModalType = (element) => {
	if (!element) return MODAL_TYPE.UNKNOWN;
	if (element.tagName === 'MACROPONENT-05D8B1515B230010B913CBD59B81C71A')
		return MODAL_TYPE.ALERT;
	else if (element.tagName === 'MACROPONENT-13ECFE155B630010B913CBD59B81C7D6')
		return MODAL_TYPE.CONFIRM;
	else if (element.tagName === 'MACROPONENT-637FC6A75B230010B913CBD59B81C779')
		return MODAL_TYPE.CONFIRM_DESTROY;
	else if (element.tagName === 'MACROPONENT-E80108425B101010B913CBD59B81C771')
		return MODAL_TYPE.IFRAME;
	else if (element.tagName.indexOf('SCREEN-ACTION-TRANSFORMER-') === 0)
		return MODAL_TYPE.VIEWPORT;
	else return MODAL_TYPE.UNKNOWN;
};

const getModalId = (modalIdStr) => {
	const match = modalIdStr.match(/\[component-id\$='(.*)']/);
	if (match) return match[1];
	return modalIdStr;
};

export const addOpenedModalInfo = (action, host) => {
	if (action.payload.showModal) {
		const elementRef = action.meta?.elementRef;
		const modalType = getModalType(elementRef);
		const modalId = getModalId(action.payload.modalId);
		openedModals[host.nowId] = {
			type: modalType,
			modalId
		};
	} else {
		delete openedModals[host.nowId];
	}
};

export const getOpenedModal = (id) => openedModals[id];

export const removeOpenedModalInfo = (host) => {
	delete openedModals[host.nowId];
};

export const getModalConfirmAction = (modalType) => {
	if (modalType === MODAL_TYPE.CONFIRM)
		return 'NOW_CONFIRM_MODAL#POSITIVE_BUTTON_CLICKED';
	else if (modalType === MODAL_TYPE.CONFIRM_DESTROY)
		return 'NOW_CONFIRM_DESTROY_MODAL#CONFIRM_CLICKED';
	else return '';
};

export const getModalCancelAction = (modalType) => {
	if (modalType === MODAL_TYPE.CONFIRM)
		return 'NOW_CONFIRM_MODAL#NEGATIVE_BUTTON_CLICKED';
	else if (modalType === MODAL_TYPE.CONFIRM_DESTROY)
		return 'NOW_CONFIRM_DESTROY_MODAL#CANCEL_CLICKED';
	else return '';
};
