import { createCustomElement } from '@servicenow/ui-core';
import { snabbdom } from '@servicenow/ui-renderer-snabbdom';
import view from './view';
import variableActions from './actions';
import styles from './_variable.scss';

createCustomElement('sn-catalog-form-variable', {
	renderer: { type: snabbdom },
	view,
	actions: {
		...variableActions.actions
	},
	actionHandlers: {
		...variableActions.actionHandlers
	},
	properties: {
		field: {
			default: {}
		},
		formData: {
			default: {}
		},
		formProps: {
			default: {}
		}
	},
	styles
});
