import _ from 'lodash';
import { createCustomElement } from '@servicenow/ui-core';
import { snabbdom } from '@servicenow/ui-renderer-snabbdom';
import { isAttrTrue } from '../utils';
import { default as view } from './view';
import { default as actions } from './actions';
import { default as actionHandlers } from './actionHandlers';
import { parseRowData } from './utils';
import styles from './styles.scss';

createCustomElement('sn-catalog-form-multi-row-variable', {
	renderer: {
		type: snabbdom
	},
	view,
	properties: {
		sourceTable: {
			default: ''
		},
		sourceId: {
			default: ''
		},
		field: {
			default: {}
		},
		parent: {
			default: ''
		},
		parentFields: {
			default: {}
		},
		rowData: {
			computed({ properties: { field } }) {
				return parseRowData(field.fields, field.value, field.displayValue);
			}
		}
	},
	transformState(state) {
		const {
			properties: { field, rowData }
		} = state;

		if (_.size(field) === 0) {
			return { ...state };
		}
		return {
			...state,
			visible: isAttrTrue(_.get(field, 'visible', true)), //TODO: visible is empty
			mandatory: isAttrTrue(_.get(field, 'mandatory', false)),
			readonly: isAttrTrue(_.get(field, 'readonly', false)),
			value: field.value,
			maxRows: parseInt(field.maxRows),
			currentRows: rowData && rowData.length ? rowData.length : 0
		};
	},
	initialState: {
		visible: true,
		mandatory: false,
		readonly: false,
		value: '',
		mode: '',
		popoverActive: false,
		removePopOver: false,
		popoverRowIndex: null,
		rowSelection: {
			allSelectedOnPage: false,
			selectedRecords: []
		},
		watchValueChange: false,
		hasLookupChoices: false
	},
	styles,
	actions,
	actionHandlers
});
