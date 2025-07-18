import { createCustomElement } from '@servicenow/ui-core';
import { snabbdom } from '@servicenow/ui-renderer-snabbdom';
import styles from './styles.scss';
import { view } from './view.js';
import { actions, actionHandlers } from './actions.js';
import { getValueListFromField } from './utils';

createCustomElement('sn-catalog-form-multiple-select', {
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
		}
	},
	transformState: state => {
		const {
			properties: { field }
		} = state;
		const valuesList = getValueListFromField(field);
		return {
			...state,
			valuesList
		};
	},
	initialState: {
		valuesList: [],
		openModal: false
	},
	styles,
	actions,
	actionHandlers
});
