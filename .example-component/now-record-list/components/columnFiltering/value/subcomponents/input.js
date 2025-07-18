import {createCustomElement} from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';

import {GENERIC_FILTER, UPDATE_FOCUS_TRAP} from '../../../../constants';
import {DEFAULT_DATE_FORMAT} from '../../constants';

import actionHandlers from './inputActions';
import {default as view} from './inputView';

createCustomElement('sn-record-list-column-filter-value-input', {
	renderer: {
		type: snabbdom,
		view
	},
	properties: {
		dateTimeFormat: {default: DEFAULT_DATE_FORMAT},
		name: {default: ''},
		type: {default: GENERIC_FILTER},
		inputValue: {default: '', reflect: true},
		messages: {default: []},
		hasValidInput: {default: false},
		isRange: {default: false},
		filterIndex: {default: -1},
		requiresInput: {default: false}
	},
	onPropertiesSet(host, dispatch) {
		dispatch(UPDATE_FOCUS_TRAP);
	},
	actionHandlers
});
