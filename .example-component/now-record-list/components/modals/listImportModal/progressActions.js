import {createGraphQLEffect} from '@servicenow/ui-effect-graphql';
import get from 'lodash/get';

import {
	CLOSE_MODAL,
	IMPORT_MODAL,
	IMPORT_MODAL_ACTIONS,
	IMPORT_MODAL_MESSAGES,
	LIST_REFRESH_REQUESTED_INTERNAL
} from '../../../constants';

import {
	errorMessagesEffect,
	fileUploaderHandler,
	progressStatusHandler,
	triggerProgressTracker
} from './actions';
import {
	createCompleteImportEffect,
	createFileUploaderEffect,
	getProgressStatusEffect
} from './effects';
import {listImportQuery} from './schemas';

export const listImportGetRootIdSuccessEffect = coeffects => {
	const {updateState, action, dispatch} = coeffects;
	const rootId = get(
		action,
		'payload.data.GlideListImport_Query.rootTrackerId',
		''
	);
	if (rootId) {
		updateState({
			shouldRender: false,
			path: 'rootId',
			value: rootId,
			operation: 'set'
		});
		dispatch(IMPORT_MODAL_ACTIONS.PROGRESS_TRACKER_TRIGGERED, {rootId});
	} else {
		listImportGetRootIdFailureEffect(coeffects);
	}
};
export const listImportGetRootIdFailureEffect = coeffects => {
	const {updateState} = coeffects;
	errorMessagesEffect(updateState, IMPORT_MODAL_MESSAGES.ROOT_ID_FAILURE_MSG);
};

export const progressStatusSuccessEffect = coeffects => {
	const {
		action: {
			payload: {result}
		}
	} = coeffects;
	const trackerObj = JSON.parse(result);
	if (trackerObj) {
		progressStatusHandler(coeffects, trackerObj);
	} else {
		progressStatusFailedEffect(coeffects);
	}
};

export const progressStatusFailedEffect = coeffects => {
	const {updateState} = coeffects;
	errorMessagesEffect(
		updateState,
		IMPORT_MODAL_MESSAGES.PROGRESS_STATUS_FAILURE_MSG
	);
};

export const fileUploaderSuccessEffect = coeffects => {
	const {
		action: {
			payload: {message, importSet}
		}
	} = coeffects;
	if (message) {
		fileUploaderHandler(coeffects, message, importSet);
	} else {
		fileUploaderFailedEffect(coeffects);
	}
};

export const fileUploaderFailedEffect = coeffects => {
	const {updateState} = coeffects;
	errorMessagesEffect(
		updateState,
		IMPORT_MODAL_MESSAGES.FILE_UPLOAD_FAILURE_MSG
	);
};

export const triggerProgressTrackerEffect = coeffects => {
	const {
		action: {
			payload: {rootId}
		},
		state,
		dispatch,
		updateState
	} = coeffects;
	triggerProgressTracker(state, dispatch, updateState, rootId);
};

export const completeImportSuccessEffect = coeffects => {
	const {
		dispatch,
		action: {
			payload: {message}
		}
	} = coeffects;

	//if any exceptions throw the error notification.
	if (message !== IMPORT_MODAL.UPLOAD_SUCCESS) {
		dispatch(IMPORT_MODAL_ACTIONS.LIST_IMPORT_ADD_ERROR_NOTIFICATION, {
			message
		});
	} else {
		// close the modal and refresh list
		dispatch(CLOSE_MODAL);
		dispatch(LIST_REFRESH_REQUESTED_INTERNAL, {timestamp: Date.now()});
	}
};

export default {
	[IMPORT_MODAL_ACTIONS.LIST_IMPORT_GET_ROOTID]: createGraphQLEffect(
		listImportQuery,
		{
			variableList: ['trackerName'],
			successActionType: IMPORT_MODAL_ACTIONS.LIST_IMPORT_GET_ROOTID_SUCCESS,
			errorActionType: IMPORT_MODAL_ACTIONS.LIST_IMPORT_GET_ROOTID_FAILURE
		}
	),
	[IMPORT_MODAL_ACTIONS.LIST_IMPORT_GET_ROOTID_SUCCESS]: {
		effect: listImportGetRootIdSuccessEffect,
		stopPropagation: true
	},
	[IMPORT_MODAL_ACTIONS.LIST_IMPORT_GET_ROOTID_FAILURE]: {
		effect: listImportGetRootIdFailureEffect,
		stopPropagation: true
	},
	[IMPORT_MODAL_ACTIONS.PROGRESS_STATUS_REQUESTED]: getProgressStatusEffect,
	[IMPORT_MODAL_ACTIONS.PROGRESS_STATUS_SUCCEEDED]: {
		effect: progressStatusSuccessEffect,
		stopPropagation: true
	},
	[IMPORT_MODAL_ACTIONS.PROGRESS_STATUS_FAILED]: {
		effect: progressStatusFailedEffect,
		stopPropagation: true
	},
	[IMPORT_MODAL_ACTIONS.FILE_UPLOAD_PROCESSOR_TRIGGERED]: createFileUploaderEffect,
	[IMPORT_MODAL_ACTIONS.FILE_UPLOAD_PROCESSOR_SUCCEEDED]: {
		effect: fileUploaderSuccessEffect,
		stopPropagation: true
	},
	[IMPORT_MODAL_ACTIONS.FILE_UPLOAD_PROCESSOR_FAILED]: {
		effect: fileUploaderFailedEffect,
		stopPropagation: true
	},
	[IMPORT_MODAL_ACTIONS.PROGRESS_TRACKER_TRIGGERED]: {
		effect: triggerProgressTrackerEffect,
		stopPropagation: true
	},
	[IMPORT_MODAL_ACTIONS.LIST_IMPORT_COMPLETE_REQUESTED]: createCompleteImportEffect,
	[IMPORT_MODAL_ACTIONS.LIST_IMPORT_COMPLETE_SUCCEEDED]: {
		effect: completeImportSuccessEffect,
		stopPropagation: true
	},
	[IMPORT_MODAL_ACTIONS.LIST_IMPORT_COMPLETE_FAILED]: {
		effect: completeImportSuccessEffect,
		stopPropagation: true
	}
};
