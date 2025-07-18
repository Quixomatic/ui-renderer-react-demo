import { createCustomElement } from '@servicenow/ui-core';
import { snabbdom } from '@servicenow/ui-renderer-snabbdom';
import { view } from './view.js';
import styles from './styles.scss';
import { actions, actionHandlers } from './actions.js';

createCustomElement('sn-catalog-form-macro-variable', {
	renderer: {
		type: snabbdom
	},
	view,
	properties: {
		field: {
			default: {}
		},
		downloaded: {
			default: false
		},
		formData: {
			default: {}
		}
	},
	styles,
	actions,
	actionHandlers
});
