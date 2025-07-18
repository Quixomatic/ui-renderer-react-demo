import { createCustomElement } from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';
import view from './view';
import { MASKED_TYPE } from './constants';
import { actions, actionHandlers } from './actions.js';
import styles from './styles.scss';

createCustomElement('sn-catalog-form-masked-variable', {
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
		},
		formProps: {
			default: {}
		}
	},
	initialState: {
		type: MASKED_TYPE
	},
	styles,
	actions,
	actionHandlers
});
