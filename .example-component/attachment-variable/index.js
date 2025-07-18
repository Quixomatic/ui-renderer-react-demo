import { createCustomElement } from '@servicenow/ui-core';
import { snabbdom } from '@servicenow/ui-renderer-snabbdom';
import styles from './styles.scss';
import { view } from './view.js';
import { actions, actionHandlers } from './actions.js';

createCustomElement('sn-catalog-form-attachment-variable', {
	renderer: {
		type: snabbdom
	},
	view,
	properties: {
		field: {
			default: {}
		},
		formData: {
			default: {}
		},
		instanceId: {
			default: ''
		}
	},
	styles,
	actions,
	actionHandlers
});
