import compact from 'lodash/compact';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isString from 'lodash/isString';

import {
	DESC,
	GLIDE_DATE_TIME,
	ORDERBY,
	ORDERBYDESC,
	QUERY_DELIMITER
} from '../../constants';

/**
 * return sort modifier object
 * @param  {String} fieldName
 * @param  {Bool} isDescending
 * @return {Object}
 */
export const createSort = (fieldName, isDescending) => {
	return {
		columnName: fieldName,
		isDescending: typeof isDescending === 'undefined' ? false : isDescending
	};
};

/**
 * Default sort direction for columns
 * @param  {String} columnType
 * @return {Bool}
 */
export const getDefaultSortDirection = columnType => {
	/*eslint-disable */
	switch (columnType) {
		case GLIDE_DATE_TIME:
			return false;
			break;
		default:
			return true;
	}
	/*eslint-enable */
};

/**
 * Deserialize encoded table conditions
 * @param {String} conditionsEncodedQuery
 * @returns {Array}
 */
export const deserializeTableConditions = conditions => {
	// Do we need to check for leading ?
	const conditionsArr = [];
	const conditionArray = conditions.split(QUERY_DELIMITER);

	// Get orderby
	conditionArray.forEach(item => {
		const orderBy = item.indexOf(ORDERBY) >= 0;
		if (orderBy) {
			const conditionItem = {};
			// Check for DESC
			const orderSplit = item.split(ORDERBY);
			if (orderSplit[1].indexOf(DESC) >= 0) {
				const descSplit = orderSplit[1];
				conditionItem.columnName = descSplit.split(DESC)[1];
				conditionItem.isDescending = true;
			} else {
				// We don't have a sort direction set a default
				conditionItem.columnName = orderSplit[1];
				conditionItem.isDescending = false;
			}
			conditionsArr.push(conditionItem);
		}
	});

	return conditionsArr;
};

export const stripOrderBy = conditions => {
	if (!isString(conditions) || isEmpty(conditions)) {
		return '';
	}

	/**
	 * Creates a new array without empty values or items that are ORDERBYs
	 */
	return stripConditions(conditions, ORDERBY);
};

/**
 * takes conditions, breaks them apart into an array
 * by QUERY_DELIMITER and filters out what isn't needed
 * @param {String} conditions	'active=true^nameSTARTSWITHted^ORDERBYname'
 * @param {String} filterBy		'ORDERBY'
 * @return {String} 			new string value (ie. 'active=true^nameSTARTSWITHted')
 */
export const stripConditions = (conditions, filterBy) => {
	return compact(conditions.split(QUERY_DELIMITER))
		.filter(part => part.indexOf(filterBy) === -1)
		.join(QUERY_DELIMITER);
};

/**
 * create order by given orderBy and column
 */
export const getOrderBy = (orderBy, column) => {
	const defaultDirection = getDefaultSortDirection(column.__typename);
	const direction =
		!!orderBy && orderBy.columnName === column.elementName
			? !orderBy.isDescending
			: defaultDirection;
	return createSort(column.elementName, direction);
};

/**
 * take object of list modifiers and return an SN querystring
 * @param  {Object} modifiers searchTerm, conditions, orderBy
 * @return {String}           SN query string
 */
export const toQueryString = modifiers => {
	let encodedQuery = [];

	if (modifiers.searchTerm) {
		encodedQuery.push(modifiers.searchTerm);
	}

	if (modifiers.conditions && !isEmpty(modifiers.orderBy)) {
		const cond = stripOrderBy(modifiers.conditions);
		modifiers.conditions = cond;
	}

	if (modifiers.conditions) {
		encodedQuery.push(modifiers.conditions);
	}

	if (!isEmpty(modifiers.orderBy)) {
		const dir = modifiers.orderBy.isDescending ? ORDERBYDESC : ORDERBY;
		encodedQuery.push(dir + modifiers.orderBy.columnName);
	}

	return encodedQuery.join(QUERY_DELIMITER);
};

/**
 * Takes a query condition string and removes leading delimiters
 *
 * @param  {String} condition
 * @return {String}
 */
export const stripLeadingDelimiters = condition => {
	if (condition.startsWith('^NQ')) {
		return condition.substring(3);
	}
	if (condition.startsWith(QUERY_DELIMITER)) {
		return condition.substring(1);
	}
	return condition;
};

/**
 * Computes the number of records selected
 *
 * @param  {Object} state
 * @return {Number}
 */
export const getSelectionCount = state => {
	const {properties = {}, listCount} = state;
	const {
		allRecordsSelected,
		selectedRecords = [],
		exceptedRecords = []
	} = properties;
	const totalRecordCount = get(listCount, 'totalRecordCount', 0);
	return !allRecordsSelected
		? selectedRecords.length
		: totalRecordCount - exceptedRecords.length;
};
