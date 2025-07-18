import tooltipBehavior from '@servicenow/behavior-tooltip';
import truncationBehavior from '@servicenow/behavior-truncation';
import {createCustomElement} from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';
import isEmpty from 'lodash/isEmpty';

import {dirtyBehavior} from '../../../behaviors/dirtyBehavior/dirtyBehavior';
import {focusTrap} from '../../../behaviors/focusTrap';
import styles from '../styles.scss';

import {default as actionHandlers} from './searchFilterActions';
import {default as view} from './searchFilterView';

const transformState = state => {
	const {
		properties: {comparisonId, inputValue}
	} = state;

	return {
		...state,
		canClear: isEmpty(comparisonId) ? false : !!inputValue,
		hasValidInput: !!inputValue
	};
};

createCustomElement('sn-record-list-column-filter-text', {
	renderer: {
		type: snabbdom,
		view,
		transformState
	},
	behaviors: [focusTrap, dirtyBehavior, truncationBehavior, tooltipBehavior],
	properties: {
		comparisonId: {default: '', reflect: true},
		field: {default: '', reflect: true},
		displayValue: {default: '', reflect: true},
		isGrouped: {default: false},
		inputValue: {default: '', reflect: true},
		isFilterable: {default: true},
		isGroupable: {default: true},
		hideColumnGrouping: {},
		hideColumnFiltering: {},
		comparisonIdMap: {default: {}, reflect: true},
		nowTableReturnFocus: {default: () => {}}
	},
	styles,
	actionHandlers
});
