import tooltipBehavior from '@servicenow/behavior-tooltip';
import truncationBehavior from '@servicenow/behavior-truncation';
import {createCustomElement} from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';

import {dirtyBehavior} from '../../../behaviors/dirtyBehavior/dirtyBehavior';
import {focusTrap} from '../../../behaviors/focusTrap';
import styles from '../styles.scss';

import actionHandlers from './advancedFilterActions';
import view from './advancedFilterView';

const SN_RECORD_LIST_COLUMN_FILTER_ADVANCED =
	'sn-record-list-column-filter-advanced';

createCustomElement(SN_RECORD_LIST_COLUMN_FILTER_ADVANCED, {
	renderer: {
		type: snabbdom,
		view
	},
	behaviors: [focusTrap, dirtyBehavior, truncationBehavior, tooltipBehavior],
	properties: {
		displayValue: {default: '', reflect: true},
		field: {default: '', reflect: true},
		parsedQueryCount: {default: 0},
		isGrouped: {default: false},
		isFilterable: {default: true},
		isGroupable: {default: true},
		hideColumnGrouping: {default: false},
		hideColumnFiltering: {default: false},
		nowTableReturnFocus: {default: () => {}}
	},
	actionHandlers,
	styles
});

export default SN_RECORD_LIST_COLUMN_FILTER_ADVANCED;
