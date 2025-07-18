import {actionTypes} from '@servicenow/ui-core';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import {MODEL_PATH} from '../constants';
import {LIST_COUNT_STATUS} from '../constants';

const {COMPONENT_PROPERTY_CHANGED, COMPONENT_BOOTSTRAPPED} = actionTypes;

const BEHAVIOR_NAME = 'listCount';
/**
 * @param listCount the listCount prop that is passed into NRL.
 * @param listCount.totalRecordCount the total record count.
 * @param listCount.status the status of record count (fetching,errror,success)
 * @param {Number} recordCount the recordCount value from listLayout model.
 * @param {Boolean} countFetchCompleted is if the count in the from listLayout model is complete or not
 * @returns {Object} object that matches the listCount structure
 */

export const getListCount = (listCount, recordCount, countFetchCompleted) => {
	if (isEmpty(listCount)) {
		const status = countFetchCompleted
			? LIST_COUNT_STATUS.SUCCESS
			: LIST_COUNT_STATUS.FETCHING;
		return {
			status,
			totalRecordCount: recordCount
		};
	} else if (countFetchCompleted) {
		return {
			status: LIST_COUNT_STATUS.SUCCESS,
			totalRecordCount: recordCount
		};
	}

	return listCount;
};

const handleComponentPropertyChanged = coeffects => {
	const {
		action: {
			payload: {name, value}
		},
		properties: {listCount},
		updateState
	} = coeffects;

	if (name === 'listCount' && !isEmpty(value)) {
		updateState({
			listCount: value
		});
	} else if (name === 'listModel') {
		const recordCount = get(value, MODEL_PATH.LAYOUT_QUERY.COUNT, 0);
		const countFetchCompleted = get(value, 'countFetchCompleted', true);

		const listRecordCount = getListCount(
			listCount,
			recordCount,
			countFetchCompleted
		);
		updateState({
			listCount: listRecordCount
		});
	}
};

const handleComponentBootstrap = coeffects => {
	const {
		properties: {listCount, listModel},
		updateState
	} = coeffects;
	if (!isEmpty(listCount)) {
		updateState({
			listCount
		});
		return;
	}
	const recordCount = get(listModel, MODEL_PATH.LAYOUT_QUERY.COUNT, 0);
	const countFetchCompleted = get(listModel, 'countFetchCompleted', true);

	const listRecordCount = getListCount(
		listCount,
		recordCount,
		countFetchCompleted
	);
	updateState({
		listCount: listRecordCount
	});
};

export default {
	name: BEHAVIOR_NAME,
	initialState: {
		listCount: {}
	},
	properties: {
		listCount: {
			default: {}
		}
	},
	actionHandlers: {
		[COMPONENT_PROPERTY_CHANGED]: {
			effect: handleComponentPropertyChanged
		},
		[COMPONENT_BOOTSTRAPPED]: {
			effect: handleComponentBootstrap
		}
	}
};
