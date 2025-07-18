import { createCustomElement } from '@servicenow/ui-core';
import { snabbdom } from '@servicenow/ui-renderer-snabbdom';
import view from './view';
import styles from './styles.scss';

createCustomElement('sn-catalog-form-container-variable', {
	renderer: {
		type: snabbdom
	},
	view,
	properties: {
		layout: {
			default: {}
		},
		formData: {
			default: {}
		},
		fields: {
			default: {}
		},
		columns: {
			default: []
		},
		parent: {
			default: '',
			reflect: true
		},
		variablesLayout: {
			default: []
		},
		formProps: {
			default: {}
		}
	},
	initialState: {
		isVisible: true
	},
	styles
});
