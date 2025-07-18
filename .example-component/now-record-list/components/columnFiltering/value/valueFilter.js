import tooltipBehavior from '@servicenow/behavior-tooltip';
import truncationBehavior from '@servicenow/behavior-truncation';
import {createCustomElement} from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';
import includes from 'lodash/includes';
import isEmpty from 'lodash/isEmpty';
import moment from 'moment';

import {dirtyBehavior} from '../../../behaviors/dirtyBehavior/dirtyBehavior';
import {focusTrap} from '../../../behaviors/focusTrap';
import {DATE_FILTER, GENERIC_FILTER, NUMERIC_FILTER} from '../../../constants';
import {
	COL_FILTER_TYPE_BETWEEN,
	COL_FILTER_TYPE_IS_EMPTY,
	COL_FILTER_TYPE_IS_NOT_EMPTY,
	OPERATORS_MAP_COLUMN_FILTERING,
	DEFAULT_DATE_FORMAT
} from '../constants';
import {getFilterIndex, getTypeFilters, isValidDate} from '../helpers';
import styles from '../styles.scss';

import actionHandlers from './valueFilterActions';
import {default as view} from './valueFilterView';

const getFilteredOperators = (filterTypes, excludedOperators) => {
	if (isEmpty(excludedOperators)) return filterTypes;
	return filterTypes.filter(
		filterType => !excludedOperators.includes(filterType.operator)
	);
};

const getExcludedOperatorsValueArray = excludedOperators => {
	if (isEmpty(excludedOperators)) return [];
	const excludedOperatorsValueArray = [];
	for (const key in OPERATORS_MAP_COLUMN_FILTERING) {
		const operatorValue = OPERATORS_MAP_COLUMN_FILTERING[key];
		const isOperatorExcluded = excludedOperators.some(oper =>
			operatorValue.includes(oper)
		);

		if (isOperatorExcluded) {
			excludedOperatorsValueArray.push(key);
		}
	}
	return excludedOperatorsValueArray;
};

const transformState = state => {
	const {
		properties: {
			comparisonId,
			inputValue1,
			inputValue2,
			operator,
			type,
			dateTimeFormat,
			excludedOperators
		}
	} = state;
	const COL_TYPE_FILTERS = getFilteredOperators(
		getTypeFilters(type),
		getExcludedOperatorsValueArray(excludedOperators)
	);
	const isRange = operator === COL_FILTER_TYPE_BETWEEN.operator;
	const filterIndex = getFilterIndex(COL_TYPE_FILTERS, isRange, operator);
	const requiresInput = !includes(
		[COL_FILTER_TYPE_IS_EMPTY, COL_FILTER_TYPE_IS_NOT_EMPTY],
		COL_TYPE_FILTERS[filterIndex]
	);
	const canClear = isEmpty(comparisonId)
		? false
		: requiresInput
		? !!(inputValue1 || inputValue2)
		: true;

	let hasValidInput = true;

	if (requiresInput) {
		if (isRange) {
			if (inputValue1 && inputValue2) {
				const low =
					type === NUMERIC_FILTER
						? Number(inputValue1)
						: moment(inputValue1, dateTimeFormat);
				const high =
					type === NUMERIC_FILTER
						? Number(inputValue2)
						: moment(inputValue2, dateTimeFormat);
				hasValidInput = low < high;
			} else {
				hasValidInput = false;
			}
		} else {
			hasValidInput =
				type === DATE_FILTER
					? isValidDate(inputValue1, dateTimeFormat)
					: !!inputValue1;
		}
	}
	return {
		...state,
		canClear,
		hasValidInput,
		isRange,
		requiresInput,
		filterIndex,
		COL_TYPE_FILTERS
	};
};

const SN_RECORD_LIST_COLUMN_FILTER_VALUE = 'sn-record-list-column-filter-value';

createCustomElement(SN_RECORD_LIST_COLUMN_FILTER_VALUE, {
	renderer: {
		type: snabbdom,
		view,
		transformState
	},
	behaviors: [focusTrap, dirtyBehavior, truncationBehavior, tooltipBehavior],
	properties: {
		comparisonId: {default: '', reflect: true},
		dateTimeFormat: {default: DEFAULT_DATE_FORMAT},
		field: {default: '', reflect: true},
		displayValue: {default: '', reflect: true},
		isGrouped: {default: false},
		inputValue1: {default: '', reflect: true},
		inputValue2: {default: '', reflect: true},
		operator: {default: '', reflect: true},
		type: {default: GENERIC_FILTER, reflect: true},
		isFilterable: {default: true},
		isGroupable: {default: true},
		hideColumnGrouping: {},
		hideColumnFiltering: {},
		nowTableReturnFocus: {default: () => {}},
		excludedOperators: {default: []}
	},
	actionHandlers,
	styles
});

export default SN_RECORD_LIST_COLUMN_FILTER_VALUE;
