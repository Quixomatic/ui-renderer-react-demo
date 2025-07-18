import {createCustomElement} from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';

import actionHandlers from './actions';
import view from './view';

export const SNDeclarativeConfirmationModal = 'sn-declarative-confirmation-modal';

createCustomElement(SNDeclarativeConfirmationModal, {
	renderer: {
		type: snabbdom,
		view
	},
	properties: {
		action: {},
		show: false,
		componentId: ''
	},
	actionHandlers
});
