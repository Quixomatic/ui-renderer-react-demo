import { createCustomElement } from '@servicenow/ui-core';
import { snabbdom } from '@servicenow/ui-renderer-snabbdom';
import styles from './styles.scss';
import { view } from './view.js';

createCustomElement('sn-catalog-form-rich-text-label-variable', {
	renderer: {
		type: snabbdom
	},
	view,
	properties: {
		field: {
			default: {}
		}
	},
	styles
});
