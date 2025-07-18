import {createCustomElement} from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';
import view from './view';

export {default as canRenderFieldAction} from './field-renderer/utils';
export const SNDeclarativeFieldAction = 'sn-declarative-field-action';

createCustomElement(SNDeclarativeFieldAction, {
	renderer: {
		type: snabbdom,
		view
	},
	properties: {
		model: {
			default: {}
		},
		actions: {
			default: null
		},
		formData: {
			default: {}
		},
		fetchDeclarativeActions: {
			default: false
		}
	}
});
