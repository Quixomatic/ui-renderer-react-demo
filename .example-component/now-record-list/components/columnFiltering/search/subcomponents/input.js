import {createCustomElement} from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';

import {UPDATE_FOCUS_TRAP} from '../../../../constants';

import styles from './input.scss';
import actionHandlers from './inputActions';
import {default as view} from './inputView';

createCustomElement('sn-record-list-column-filter-search-input', {
	renderer: {
		type: snabbdom,
		view
	},
	properties: {
		name: {default: ''},
		inputValue: {default: '', reflect: true}
	},
	onPropertiesSet(host, dispatch) {
		dispatch(UPDATE_FOCUS_TRAP);
	},
	actionHandlers,
	styles
});
