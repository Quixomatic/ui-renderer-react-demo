import { createCustomElement } from '@servicenow/ui-core';
import { snabbdom } from '@servicenow/ui-renderer-snabbdom';
import { view } from './view';
import styles from './styles.scss';

createCustomElement('sn-catalog-form-checkbox-variable', {
	renderer: { type: snabbdom },
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
	styles
});
