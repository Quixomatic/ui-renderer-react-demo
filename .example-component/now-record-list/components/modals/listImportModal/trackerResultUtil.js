import cuid from 'cuid';
import FormData from 'form-data';
import get from 'lodash/get';

import {
	ALERT_CONSTANTS,
	IMPORT_MODAL,
	TRACKER_RESULTS
} from '../../../constants';

import {LIST_IMPORT_TYPE} from './listImportService';
export const getRootTrackerMessage = trackerObj => {
	return get(trackerObj, 'message', '');
};

export const getMessageFromChildrenAndRootTracker = trackerObj => {
	//early exit if we are not able to find the root tracker from the sys_execution_tracker table.
	if (trackerObj.state === TRACKER_RESULTS.STATE.TRACKER_NOTFOUND) {
		return IMPORT_MODAL.ROOT_TRACKER_NOTFOUND;
	}
	//Access denied message - when the user dont have read access to sys_execution_tracker table
	if (trackerObj.message === IMPORT_MODAL.ACCESS_DENIED) {
		return trackerObj.message;
	}
	const rootMessage = getRootTrackerMessage(trackerObj);
	if (rootMessage && trackerObj.state === TRACKER_RESULTS.STATE.FAILED) {
		return rootMessage;
	}
	const children = get(trackerObj, 'children', []);
	for (let i = 0; i < children.length; i++) {
		// check only the failed state message, as we are not showing the
		// notifications for success, or other states.
		if (
			children[i].state === TRACKER_RESULTS.STATE.FAILED &&
			children[i].message
		) {
			return children[i].message;
		}
	}
	return '';
};

export const getErrorNotification = message => {
	return {
		id: `now_alert_critical_${cuid()}`,
		status: ALERT_CONSTANTS.STATUS.CRITICAL,
		content: {
			type: 'string',
			value: message
		},
		action: {type: ALERT_CONSTANTS.ACTION.TYPES.DISMISS}
	};
};

export const constructFormData = state => {
	const {
		properties: {table, recordCount, view, query},
		rootId,
		fields,
		uploadFile
	} = state;
	const file = get(uploadFile, 'file', '');
	let form = new FormData();
	form.append('sysparm_target', table);
	form.append('sysparm_process_stage', 'upload');
	form.append('sysparm_query', query);
	form.append('sysparm_rows', recordCount);
	form.append('sysparm_view', view);
	form.append('sysparm_template_type', fields[LIST_IMPORT_TYPE].value);
	form.append('sysparm_parent_tracker_id', rootId);
	form.append('attachFile', file);
	form.append('sysparm_workspace_import', 'workspace');
	return form;
};

export const updateProgressBarValues = (
	updateState,
	progressValue,
	progressPath
) => {
	updateState([
		{
			path: 'uploadFile.progressValue',
			value: progressValue,
			operation: 'set'
		},
		{
			path: 'uploadFile.progressPath',
			value: progressPath,
			operation: 'set'
		}
	]);
};

export const setErrorNotificationAndProgress = (message, updateState) => {
	setErrorNotification(message, updateState);
	updateProgressBarValues(updateState, 1, 'error');
};

export const getTackerPercentComplete = trackerObj => {
	const percentComplete = Number(get(trackerObj, 'percent_complete', 0));
	if (percentComplete === 0) return IMPORT_MODAL.TRACKER_DEFAULT_PERCENT;
	return percentComplete;
};

export const setErrorNotification = (message, updateState) => {
	const errorNotification = getErrorNotification(message);
	updateState({
		path: 'notifications',
		value: [errorNotification],
		operation: 'set'
	});
};

export const constructCompleteImportData = state => {
	const {
		properties: {table, view},
		fields,
		importSetId
	} = state;
	let form = new FormData();
	form.append('sysparm_target', table);
	form.append('sysparm_process_stage', 'transform');
	form.append('sysparm_import_set_id', importSetId);
	form.append('sysparm_view', view);
	form.append('sysparm_template_type', fields[LIST_IMPORT_TYPE].value);
	form.append('sysparm_workspace_import', 'workspace');
	return form;
};
