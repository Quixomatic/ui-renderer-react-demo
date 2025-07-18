import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import {t} from 'sn-translate';

import {
	DEFAULT_MAX_PAGES,
	GROUPED_CHOICE_MAX_PAGES,
	LIST_COUNT_STATUS,
	LIST_TYPES,
	LIST_TYPE_TAGS,
	PANEL_TYPE_FILTER,
	REF_MAX_PAGES
} from '../../constants';

/**
 * Helper method to check atleast one of the DA's have DynamicEvaluation Enabled
 * @param  {Array} actions Declarative Actions List
 * @return {Boolean}  true if Dynamic Eval Enabled
 */
export const isDynamicEvaluationEnabled = actions =>
	actions && actions.length
		? actions.some(a =>
				a.children.some(da => da.action.dynamicEvaluationEnabled)
		  )
		: false;

/**
 * Helper method to check for the existence of the sys_class_name column.
 * If it exists, return its value as the table name.
 * @param  {Object} row
 * @param  {String} tableName
 * @return {String}
 */
export const checkSysClassNameExists = (row, tableName) => {
	return get(row, 'sys_class_name.value', tableName);
};

/**
 * Helper method to generate graphql compatibly pagination string
 * @param  {Number} limit record count limit
 * @param  {Number} page  current page
 * @return {String}       pagination query string
 */
export const getPaginationObject = (limit, page) => {
	if (typeof limit === 'undefined' || typeof page === 'undefined') {
		return null;
	}
	const offset = (page - 1) * limit;
	return {limit, offset};
};

/**
 * Helper method to get the model needed for the pagination component
 * @param  {Object} props limit, page, listModel, isRefList
 * @return {Object}       pagination model plus, if list data is grouped by choice,
 * 												then the grouped choice boolean flags as well
 */
export const getPaginationModel = (
	{transitoryPage, transitoryLimit, listModel, isRefList, maxGroupsPerPage},
	listCount
) => {
	const {tableMetadata = {}, layoutQuery = {}} = listModel;
	const {isGrouped = false} = tableMetadata;
	const {
		groupCount = -1,
		isChoiceAggregate: isGroupedByChoice = false,
		isOmitCount = false,
		omitCountData = {},
		queryRows: rows = new Map()
	} = layoutQuery;

	let {count: recordCount = 0} = layoutQuery;

	const {
		status: listCountStatus = '',
		hasNextPage: listCountHasNextPage = false,
		totalRecordCount = 0
	} = listCount;

	const isListCountFetchingInLoadingOrErrorState = [
		LIST_COUNT_STATUS.ERROR,
		LIST_COUNT_STATUS.FETCHING
	].includes(listCountStatus);

	let hasNextPage = false;
	if (isOmitCount) {
		hasNextPage = omitCountData.hasNextPage;
	} else if (isListCountFetchingInLoadingOrErrorState) {
		hasNextPage = listCountHasNextPage;
	} else {
		recordCount = totalRecordCount;
	}

	const count = isGrouped ? groupCount : recordCount;
	const visibleCount = rows.size;
	const rangeLabel = isGroupedByChoice ? t('{0} groups', count) : undefined;

	// DEF0079979: If omitCount is enabled, we have to increment the count by one
	// so pagination component adds an additional page until the final
	// page is reached.
	const shouldIncrementCount = hasNextPage;
	const nextPageOffset = shouldIncrementCount ? 1 : 0;
	return {
		page: transitoryPage,
		recordCount: count + nextPageOffset,
		listCountStatus,
		visibleCount: visibleCount + nextPageOffset,
		maxPages: getMaxPages(isGroupedByChoice, isRefList),
		...getLimitProps(
			isGrouped,
			transitoryLimit,
			transitoryPage,
			maxGroupsPerPage,
			rows.size
		),
		...getGroupedChoiceFlags(isGroupedByChoice),
		rangeLabel,
		...getLoadingOrOmitCountProps(
			listCountStatus,
			transitoryPage,
			transitoryLimit,
			hasNextPage,
			recordCount,
			isOmitCount
		)
	};
};

const getLoadingOrOmitCountProps = (
	listCountStatus,
	transitoryPage,
	transitoryLimit,
	omitCountNextPage,
	recordCount,
	isOmitCount
) => {
	const isListCountFetchingInLoadingOrErrorState = [
		LIST_COUNT_STATUS.ERROR,
		LIST_COUNT_STATUS.FETCHING
	].includes(listCountStatus);

	let rangeLabel;

	if (!isListCountFetchingInLoadingOrErrorState && !isOmitCount) return {};
	else {
		let currentMaxRecords;
		const pageMinusOne = transitoryPage - 1;
		const pageTimesLimit = transitoryPage * transitoryLimit;

		if (isListCountFetchingInLoadingOrErrorState) {
			currentMaxRecords = pageTimesLimit;
		} else {
			currentMaxRecords = omitCountNextPage ? pageTimesLimit : recordCount;
		}
		const currentMinRecords =
			pageMinusOne == 0 ? 1 : pageMinusOne * transitoryLimit;
		rangeLabel = t('Showing {0}-{1}', currentMinRecords, currentMaxRecords);
	}

	return {
		hideRowCount: isOmitCount,
		hideFirstPage: false,
		hideLastPage: true,
		hidePreviousPage: false,
		hideNextPage: false,
		hideLimitSelector: false,
		rangeLabel
	};
};

const getLimitProps = (
	isGrouped,
	transitoryLimit,
	transitoryPage,
	maxGroupsPerPage,
	size
) => {
	return isGrouped
		? {
				limitOverride: transitoryPage === 1 ? size : maxGroupsPerPage,
				limitLabel: t('rows per group'),
				limit: transitoryLimit
		  }
		: {limitLabel: t('rows per page'), limit: transitoryLimit};
};

const getMaxPages = (isGroupedByChoice, isRefList) => {
	if (isGroupedByChoice) return GROUPED_CHOICE_MAX_PAGES;
	if (isRefList) return REF_MAX_PAGES;
	return DEFAULT_MAX_PAGES;
};

const getGroupedChoiceFlags = isGroupedByChoice => {
	if (isGroupedByChoice)
		return {
			hideRange: true,
			hideFirstPage: true,
			hidePreviousPage: true,
			hidePages: true,
			hideNextPage: true,
			hideLastPage: true
		};
	return {};
};

/**
 * isInputEmpty
 * Validates input is not empty or filled with
 * whitespace characters
 *
 * @param {*} input
 * @returns {Bool}
 */
export const isInputEmpty = input => !input || input.trim().length === 0;

/**
 * trimString
 * Trims input string to length specified
 *
 * @param {*} input	String you want to trim
 * @param {*} lengthToTrimTo
 * @returns {String}
 */
export const trimString = (input, lengthToTrimTo) => {
	if (input && input.length > lengthToTrimTo) {
		return input.substring(0, lengthToTrimTo);
	}
	return input || '';
};

/**
 * Checks whether the panel passed in is the Filter Panel
 * If it is, return it. If not, return empty string.
 *
 * @param panel
 * @returns {String}
 */
export const checkForFilterPanel = panel =>
	panel === PANEL_TYPE_FILTER ? PANEL_TYPE_FILTER : '';

/**
 * Checks whether we should hide the row selectors or not.
 *
 * @param {*} hideRowSelector If this feature flag is enabled, we should hide row selectors (see hideUnnecessaryRowSelectors)
 * @param {*} hideDeclarativeActions If this feature flag is enabled, we should hide row selectors (see hideUnnecessaryRowSelectors)
 * @param {*} hideUnnecessaryRowSelectors Show the row selectors regardless (check the double negative; true = hide, false = show)
 * @param {*} actions Declarative Actions used to determine if we need row selectors
 * @returns {Bool}
 */
export const areRowSelectorsNeeded = (
	hideRowSelector,
	hideDeclarativeActions,
	hideUnnecessaryRowSelectors,
	actions = []
) => {
	if (!hideUnnecessaryRowSelectors) return true;

	if (hideRowSelector || hideDeclarativeActions || !actions.length)
		return false;

	// iterate over all actions to see if any require row selectors
	const found = actions.find(action => {
		return action.children.find(
			da => da.action.recordSelectionRequired === true
		);
	});

	return !isEmpty(found);
};

export const getDynamicListTag = listType => {
	return listType === LIST_TYPES.DEFAULT
		? LIST_TYPE_TAGS.DEFAULT
		: listType === LIST_TYPES.REFERENCE
		? LIST_TYPE_TAGS.REFERENCE
		: listType === LIST_TYPES.RELATED
		? LIST_TYPE_TAGS.RELATED
		: listType === LIST_TYPES.SNAPSHOT
		? LIST_TYPE_TAGS.SNAPSHOT
		: listType === LIST_TYPES.PICKER
		? LIST_TYPE_TAGS.PICKER
		: LIST_TYPE_TAGS.DEFAULT;
};

export const isViewAllNeeded = ({hideViewAll, limit, listCount}) => {
	const hasNextPage = get(listCount, 'hasNextPage', false);
	const totalRecordCount = get(listCount, 'totalRecordCount', 0);

	if (hideViewAll) return false;
	else if (totalRecordCount > limit || hasNextPage) return true;
	else return false;
};

export const shouldDisableSortOnConditionBuilder = listModel => {
	const allColumns = get(listModel, 'allColumns', {});
	const sortableColumnArray = [];
	if (!isEmpty(allColumns)) {
		for (const columnValue of allColumns.values()) {
			const isSortable = get(columnValue, 'columnData.isSortable', true);
			sortableColumnArray.push(isSortable);
		}
		return sortableColumnArray.every(sortable => sortable === false);
	}
	return false;
};
