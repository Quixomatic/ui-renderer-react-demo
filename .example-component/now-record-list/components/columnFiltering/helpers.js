import '@servicenow/now-text-link';
import {NOW_GRID_CLOSE_POPOVER} from '@servicenow/now-grid';
import {Fragment} from '@servicenow/ui-renderer-snabbdom';
import findIndex from 'lodash/findIndex';
import get from 'lodash/get';
import head from 'lodash/head';
import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';
import isUndefined from 'lodash/isUndefined';
import moment from 'moment';
import {t} from 'sn-translate';

import {
	ADVANCED_FILTER,
	AT_DELIMITER,
	CHOICE_FILTER,
	DATE_FILTER,
	DATE_TIME_FILTER,
	FILTER_TYPE_FLAGS,
	GENERIC_FILTER,
	GLIDE_DATE,
	GLIDE_DATE_TIME,
	GLIDE_REFERNCE,
	GRID_ADD_GROUPBY,
	GRID_CLOSE_POPOVER,
	GRID_REMOVE_GROUPBY,
	IN,
	NUMERIC_FILTER,
	REFERENCE_FILTER,
	UNSUPPORTED_FILTER,
	BOOLEAN_FILTER
} from '../../constants';
import {
	getDateTimeString,
	parseDateTimeString
} from '../../utils/dateTimeHelper';

import {
	CLOSE,
	CLOSE_WITHOUT_FILTERING,
	COL_DATE_FILTERS,
	COL_FILTER_TYPE_BETWEEN,
	COL_GENERIC_FILTERS,
	COL_NUMERIC_FILTERS,
	COL_REFERENCE_FILTERS,
	COL_BOOLEAN_FILTERS,
	FILTER_CLOSE_BUTTON,
	OPERATORS_MAP_COLUMN_FILTERING
} from './constants';

export const isDataCurrent = (pathToProp, actionToDispatch) => (
	oldNode,
	newNode
) => {
	if (
		get(oldNode, `data.props[${pathToProp}]`) !==
		get(newNode, `data.props[${pathToProp}]`)
	)
		newNode.data.ref.current.dispatch(actionToDispatch);
};

export const getColumnFilteringProps = ({properties}) => {
	const {
		column: {
			columnName: elementName,
			columnData: {label, referenceDisplayName},
			filterType
		},
		column,
		parsedQueryModel: {glideQuery, count},
		parsedQueryModel,
		isGlideQuery,
		filterId,
		isGrouped,
		isFilterable,
		isGroupable,
		listInstanceId,
		hideColumnGrouping,
		hideColumnFiltering,
		table,
		nowTableReturnFocus,
		nonGlideFilterProps,
		tableMetadata: {dateFormat, dateTimeFormat}
	} = properties;

	const dateTimeFormatValue =
		filterType === DATE_TIME_FILTER
			? getDateTimeFormatValue(dateTimeFormat)
			: getDateFormatValue(dateFormat);

	const props = {
		column,
		parsedQueryModel,
		filterId,
		isGrouped,
		isFilterable,
		isGroupable,
		listInstanceId,
		hideColumnGrouping,
		hideColumnFiltering,
		table,
		nowTableReturnFocus,
		isGlideQuery,
		nonGlideFilterProps,
		dateTimeFormat: dateTimeFormatValue
	};

	const excludedOperators = get(column, 'columnData.excludedOperators', []);

	if (isGlideQuery && isEmpty(glideQuery)) return {loading: true};

	const filterProps = !isGlideQuery
		? getNonGlideColumnFilteringProps(
				elementName,
				nonGlideFilterProps,
				filterType
		  )
		: isChoice(filterType)
		? getChoiceFilterProps(glideQuery, elementName, excludedOperators)
		: getAllOtherFilterProps(
				glideQuery,
				elementName,
				referenceDisplayName,
				filterType,
				dateTimeFormatValue,
				excludedOperators
		  );

	return {
		...filterProps,
		...props,
		field: elementName,
		displayValue: label,
		loading: false,
		parsedQueryCount: count,
		excludedOperators
	};
};

const getNonGlideColumnFilteringProps = (
	elementName,
	nonGlideFilterProps,
	filterType
) => {
	const {comparison_id_map} = nonGlideFilterProps;

	const comparison = isEmpty(comparison_id_map)
		? {}
		: head(
				Object.values(comparison_id_map).filter(
					curr => curr.field == elementName
				)
		  );

	return {
		comparisonId: isEmpty(comparison) ? '' : comparison.id,
		inputValue: isEmpty(comparison) ? '' : comparison.value,
		type: filterType
	};
};

/**
 * This function will return correct field count for a column field. Here we check the comparison field count map for both the
 * field name as well as the dot walked reference display name (if it exists). This is to account for the edge case where
 * a user adds a reference to a reference and also has the dot walked field to the nested reference as a column on the table.
 * Any conditions applied to the column should show up for both
 * @param {Object} comparison_field_count_map
 * @param {*} elemName
 * @param {*} referenceDisplayName
 * @returns
 */
export const getFieldCountWithReferenceDisplayName = (
	comparison_field_count_map,
	elemName,
	referenceDisplayName
) => {
	const elementFieldCount = comparison_field_count_map[elemName] || 0;
	const referenceDisplayFieldCount =
		comparison_field_count_map[`${elemName}.${referenceDisplayName}`] || 0;

	return elementFieldCount + referenceDisplayFieldCount;
};

/**
 * This function returns the props for the appropriate column filtering type that is not one of the special types defined
 * such as choice
 * @param {Object} glideQuery
 * @param {String} elemName
 * @param {String} referenceDisplayName
 * @param {String} filterType
 * @param {String} dateTimeFormatValue
 * @param {Array}  excludedOperators
 * @returns {Object}
 */
export const getAllOtherFilterProps = (
	glideQuery,
	elemName,
	referenceDisplayName,
	filterType,
	dateTimeFormatValue,
	excludedOperators
) => {
	const {comparison_field_count_map, comparison_id_map} = glideQuery;

	const fieldCount = getFieldCountWithReferenceDisplayName(
		comparison_field_count_map,
		elemName,
		referenceDisplayName
	);

	const comparison =
		fieldCount === 1
			? getSingleComparison(comparison_id_map, elemName, referenceDisplayName)
			: {};

	const {id, operator, value} = comparison;

	const operatorValueList = OPERATORS_MAP_COLUMN_FILTERING[operator];

	if (!isEmpty(excludedOperators) && !isEmpty(operatorValueList)) {
		const isOperatorExcluded = excludedOperators.some(oper =>
			operatorValueList.includes(oper)
		);

		if (isOperatorExcluded) return {type: ADVANCED_FILTER};
	}

	return {
		...getTypeAndInputValues(
			fieldCount > 1,
			filterType,
			operator,
			value,
			dateTimeFormatValue
		),
		comparisonId: isEmpty(id) ? '' : id,
		operator: getOperator(operator, filterType)
	};
};

export const getChoiceFilterProps = (
	glideQuery,
	elemName,
	excludedOperators
) => {
	const {comparison_field_count_map, comparison_id_map} = glideQuery;
	const fieldCount = comparison_field_count_map[elemName] || 0;

	if (fieldCount > 2) return {type: ADVANCED_FILTER};

	if (!isEmpty(excludedOperators)) {
		const isOperatorExcluded = excludedOperators.findIndex(
			operator =>
				operator in FILTER_TYPE_FLAGS[CHOICE_FILTER].optionsSupportedMap
		);

		if (isOperatorExcluded !== -1) return {type: ADVANCED_FILTER};
	}

	return {
		...(fieldCount > 0
			? getChoiceTypeAndInputValues(comparison_id_map, elemName)
			: {type: CHOICE_FILTER})
	};
};

// The `if(operator === ...)` lines below are for DEF0090933.
// The issue here is that 'LIKE' and 'NOT LIKE' are converted to
// 'CONTAINS' and 'DOES NOT CONTAIN' by GlideRecord serverside.
// However, if we change our COL_TYPE_FILTERS to reflect that, it will
// break condition builder because it also expects 'LIKE' and 'NOT LIKE'
export const getFilterIndex = (filters, isRange, operator) => {
	const index = findIndex(filters, f => {
		if (isRange) return f.operator === COL_FILTER_TYPE_BETWEEN.operator;
		if (operator === 'CONTAINS') return f.operator === 'LIKE';
		if (operator === 'DOES NOT CONTAIN') return f.operator === 'NOT LIKE';
		return f.operator === operator;
	});
	return index === -1 ? 0 : index;
};

const isUnsupportedColumn = column =>
	FILTER_TYPE_FLAGS[UNSUPPORTED_FILTER].indexOf(getInternalType(column)) !== -1;

const isChoiceColumn = column => get(column, 'columnData.isChoice', false);

const isNumericColumn = column =>
	FILTER_TYPE_FLAGS[NUMERIC_FILTER].dataTypesSupported.indexOf(
		getInternalType(column)
	) !== -1;

const isDateColumn = column =>
	getInternalType(column) === GLIDE_DATE ||
	getInternalType(column) === GLIDE_DATE_TIME;

const isReferenceColumn = column => getInternalType(column) === GLIDE_REFERNCE;

const getInternalType = column => get(column, 'columnData.internalType', '');

export const getFilterTypeForColumn = (column = {}) => {
	if (isUnsupportedColumn(column)) return UNSUPPORTED_FILTER;

	if (isChoiceColumn(column)) return CHOICE_FILTER;

	if (isNumericColumn(column)) return NUMERIC_FILTER;

	if (isDateColumn(column)) return DATE_FILTER;

	if (isReferenceColumn(column)) return REFERENCE_FILTER;

	return GENERIC_FILTER;
};

export const getIsRange = ({inputValue1, inputValue2, operator}) => {
	(!isEmpty(inputValue1) && !isEmpty(inputValue2)) ||
		operator === COL_FILTER_TYPE_BETWEEN.operator;
};

const getOperator = (operator, type) => {
	if (isEmpty(operator)) {
		if (type === CHOICE_FILTER) return IN;
		if (type === REFERENCE_FILTER) return COL_REFERENCE_FILTERS[0].operator;
		return COL_GENERIC_FILTERS[4].operator;
	}
	return operator;
};

export const getTypeFilters = type => {
	switch (type) {
		case GENERIC_FILTER:
			return COL_GENERIC_FILTERS;
		case REFERENCE_FILTER:
			return COL_REFERENCE_FILTERS;
		case NUMERIC_FILTER:
			return COL_NUMERIC_FILTERS;
		case DATE_FILTER:
		case DATE_TIME_FILTER:
			return COL_DATE_FILTERS;
		case BOOLEAN_FILTER:
			return COL_BOOLEAN_FILTERS;
		default:
			return [];
	}
};

export const getValueForDispatch = props => {
	const {type, requiresInput, isRange, inputValue1, inputValue2} = props;
	return requiresInput
		? isRange
			? isDateOrDateTime(type)
				? getDateTimeString(props)
				: inputValue1 + AT_DELIMITER + inputValue2
			: isDateOrDateTime(type)
			? getDateTimeString(props)
			: inputValue1
		: null;
};

export const isDateOrDateTime = type =>
	type === DATE_FILTER || type === DATE_TIME_FILTER;

export const isValidDate = (dateString, format) =>
	moment(dateString, format, true).isValid();

export const isChoice = type => type === CHOICE_FILTER;

export const shouldRenderColumnFilter = (hideColumnFiltering, isFilterable) =>
	!hideColumnFiltering && isFilterable;

export const shouldRenderGroupBy = (hideColumnGrouping, isGroupable) =>
	!hideColumnGrouping && isGroupable;

export const renderFilterDivider = shouldRenderGroupBy =>
	shouldRenderGroupBy ? <div className="filter-container-divider" /> : null;

export const renderGroupBy = ({
	hideColumnGrouping,
	isGroupable,
	field,
	isGrouped,
	displayValue
}) => {
	if (!shouldRenderGroupBy(hideColumnGrouping, isGroupable)) {
		return null;
	}
	const actionName = isGrouped ? GRID_REMOVE_GROUPBY : GRID_ADD_GROUPBY;
	const label = isGrouped
		? t('Ungroup by {0}', displayValue)
		: t('Group by {0}', displayValue);
	const extraPayload = {actionName, field};

	return (
		<Fragment>
			<div className="filter-container-header header">
				<now-text-link
					href="javascript:void(0)"
					label={label}
					variant="primary"
					data-truncation
					append-to-payload={extraPayload}
				/>
			</div>
		</Fragment>
	);
};

export const renderFilterCloseButton = hasValidInput => {
	const tooltipLabel = hasValidInput ? CLOSE_WITHOUT_FILTERING : CLOSE;

	return (
		<div className="filter-close-container">
			<now-button-iconic
				bare={true}
				configAria={{
					'aria-label': tooltipLabel
				}}
				component-name={FILTER_CLOSE_BUTTON}
				data-testId="filterCloseButton"
				hidePadding={true}
				icon="close-outline"
				id="filter-close-button"
				size="sm"
				tooltipContent={tooltipLabel}
				variant="tertiary"
			/>
		</div>
	);
};

/**
 * This function returns correct comparison Object based on the element name as well as the reference display name
 * @param {Object} comparisonIdMap
 * @param {String} elementName
 * @param {String} referenceDisplayName
 * @returns {Object}
 */
const getSingleComparison = (
	comparisonIdMap,
	elementName,
	referenceDisplayName
) =>
	get(
		head(
			Object.values(comparisonIdMap).filter(curr => {
				const field = get(curr, 'item.field');
				return (
					field === elementName ||
					field === `${elementName}.${referenceDisplayName}`
				);
			})
		),
		'item'
	);

const getAllComparisons = (map, name) => {
	return Object.values(map).filter(curr => get(curr, 'item.field') === name);
};

const getChoiceTypeAndInputValues = (map, name) => {
	let comparisonMap = {},
		isOperatorSupported = true,
		selectedChoices = [];

	const comps = getAllComparisons(map, name);

	for (let x = 0; comps.length > x; x++) {
		const {
			indices: {
				predicateIndex,
				subPredicateIndex,
				compoundIndex,
				comparisonIndex
			},
			item: {id, value, operator}
		} = comps[x];

		if (
			FILTER_TYPE_FLAGS[CHOICE_FILTER].optionsSupported.indexOf(operator) === -1
		) {
			isOperatorSupported = false;
			comparisonMap = {};
			selectedChoices = [];
			break;
		}

		const newValue = value.toLowerCase();
		comparisonMap[id] = {
			isEmpty: isEmpty(newValue) || newValue === 'null',
			path: `predicates[${predicateIndex}].subpredicates[${subPredicateIndex}].subpredicates[${compoundIndex}].subpredicates[${comparisonIndex}]`
		};
		const valueArr = newValue.length > 0 ? newValue.split(',') : [];
		selectedChoices =
			Object.keys(comparisonMap).length > 1
				? selectedChoices.concat(valueArr)
				: valueArr;
	}

	return {
		comparisonMap,
		selectedChoices,
		type: isOperatorSupported ? CHOICE_FILTER : ADVANCED_FILTER
	};
};

const getTypeAndInputValues = (
	fieldPredicate,
	type,
	operator,
	value,
	dateTimeFormatValue
) => {
	if (
		type === UNSUPPORTED_FILTER ||
		FILTER_TYPE_FLAGS[type].optionsNotSupported.indexOf(operator) !== -1 ||
		fieldPredicate
	)
		return {type: ADVANCED_FILTER};

	return {
		type,
		...getInputValues(type, operator, value, dateTimeFormatValue)
	};
};

const getInputValues = (
	filterType,
	operator,
	value = '',
	dateTimeFormatValue
) => {
	if (isDateOrDateTime(filterType))
		return parseDateTimeString(operator, value, getValues, dateTimeFormatValue);

	return operator === COL_FILTER_TYPE_BETWEEN.operator
		? getValues(value.split(AT_DELIMITER), value)
		: getValues([], value);
};

export const getValues = (betweenValues, soloValue) =>
	isArray(betweenValues) && betweenValues.length > 1
		? {inputValue1: betweenValues[0], inputValue2: betweenValues[1]}
		: {inputValue1: isUndefined(soloValue) ? '' : soloValue, inputValue2: ''};

export const getDateFormatValue = value => value.toUpperCase();

export const getDateTimeFormatValue = value => {
	const dateTimevalue = value.split(' ');
	return dateTimevalue.length > 2
		? `${dateTimevalue[0].toUpperCase()} ${dateTimevalue[1]} ${
				dateTimevalue[2]
		  }`
		: `${dateTimevalue[0].toUpperCase()} ${dateTimevalue[1]}`;
};

export const closeFilterPopOver = (nowTableReturnFocus, dispatch) => {
	dispatch(GRID_CLOSE_POPOVER);
	dispatch(NOW_GRID_CLOSE_POPOVER, {setParentFocus: true});
	nowTableReturnFocus();
};
