import rtlBehavior from '@servicenow/behavior-rtl';
import tooltipBehavior from '@servicenow/behavior-tooltip';
import truncationBehavior from '@servicenow/behavior-truncation';
import {createCustomElement} from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';

import {focusTrap} from '../../../behaviors/focusTrap';
import {IN} from '../../../constants';
import styles from '../styles.scss';

import actionHandlers from './choiceFilterActions';
import view from './choiceFilterView';

const SN_RECORD_LIST_COLUMN_FILTER_CHOICE =
	'sn-record-list-column-filter-choice';

createCustomElement(SN_RECORD_LIST_COLUMN_FILTER_CHOICE, {
	renderer: {
		type: snabbdom,
		view
	},
	behaviors: [focusTrap, rtlBehavior, truncationBehavior, tooltipBehavior],
	initialState: {
		initialChoices: [],
		filteredChoices: [],
		defaultSelected: [],
		originalSelected: '',
		inputValue: '',
		errors: []
	},
	properties: {
		loading: {
			default: true
		},
		comparisonMap: {
			default: {},
			reflect: true
		},
		field: {
			default: '',
			reflect: true
		},
		displayValue: {
			default: '',
			reflect: true
		},
		selectedChoices: {
			default: []
		},
		isGroupable: {
			default: true
		},
		isFilterable: {
			default: true
		},
		operator: {
			default: IN,
			reflect: true
		},
		table: {},
		hideColumnGrouping: {},
		hideColumnFiltering: {},
		isGrouped: {},
		nowTableReturnFocus: {default: () => {}}
	},
	actionHandlers,
	styles
});

export default SN_RECORD_LIST_COLUMN_FILTER_CHOICE;
