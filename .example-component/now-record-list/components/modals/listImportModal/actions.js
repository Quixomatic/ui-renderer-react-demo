import cuid from 'cuid';
import get from 'lodash/get';

import {
	ALERT_CONSTANTS,
	ALERT_LIST,
	CLOSE_MODAL,
	EXPORT_ACTIONS,
	IMPORT_FOOTER_BUTTON,
	IMPORT_MODAL,
	IMPORT_MODAL_ACTIONS,
	LIST_PROGRESS_EDS_MODAL,
	MODAL_ACTIONS,
	NOW_MODAL,
	STEPPER_PROGRESS_STATES,
	SYSPARAM_INSERT_IMPORT,
	SYSPARAM_UPDATE_IMPORT,
	TRACKER_NAME
} from '../../../constants';
import {ListExportService} from '../listExportModal/listExportService';

import {
	LIST_IMPORT_CREATE_EXCEL,
	LIST_IMPORT_INCLUDE_FIELDS
} from './listImportService';
import {
	browseButtonEffect,
	updateRadioOptions,
	updateStepperProgress,
	updateStepperToInitialIfDone
} from './listImportUtils';
import {
	constructCompleteImportData,
	constructFormData,
	getMessageFromChildrenAndRootTracker,
	getTackerPercentComplete,
	setErrorNotification,
	setErrorNotificationAndProgress,
	updateProgressBarValues
} from './trackerResultUtil';

let importSvc = undefined;

export const radioButtonValueChange = coeffects => {
	const {
		action: {
			payload: {value}
		},
		state: {insertUpdateRadioOptions},
		updateState
	} = coeffects;

	updateState({
		path: 'fields.LIST_IMPORT_TYPE.value',
		value,
		operation: 'set'
	});

	// we can update the radioOptions
	updateState({
		path: 'insertUpdateRadioOptions',
		value: updateRadioOptions(insertUpdateRadioOptions, value),
		operation: 'set'
	});
};

export const checkBoxValueChange = coeffects => {
	const {
		action: {
			payload: {value, name}
		},
		updateState
	} = coeffects;

	if (
		name === LIST_IMPORT_CREATE_EXCEL ||
		name === LIST_IMPORT_INCLUDE_FIELDS
	) {
		updateState({
			path: `fields.${name}.value`,
			value,
			operation: 'set'
		});
	}
};

export const updateStateProgressStepper = (updateState, stepperItems, step) => {
	const updatedItems = updateStepperProgress(
		stepperItems,
		step,
		STEPPER_PROGRESS_STATES.done
	);
	updateState([
		{
			path: 'stepperItems',
			value: updatedItems,
			operation: 'set'
		},
		{path: 'currentStep', value: step + 1, operation: 'set'}
	]);
};

export const dropDownValueChange = coeffects => {
	const {updateState} = coeffects;
	const nsid = get(coeffects, 'action.payload.item.id');
	updateState({
		path: 'fields.LIST_IMPORT_EXCEL_FORMAT.value',
		value: nsid,
		operation: 'set'
	});
};

const exportExcelTemplate = ({updateState, dispatch, state}) => {
	updateState({
		showLoader: true,
		notifications: []
	});
	const {
		properties: {table, query, recordCount, workspaceConfigId, columns},
		fields
	} = state;

	const includeAllFields = fields.LIST_IMPORT_INCLUDE_FIELDS.value;
	const excelFormat = fields.LIST_IMPORT_EXCEL_FORMAT.value;

	const pollOptions = {
		sysparm_target: table,
		sysparm_export: getImportConfigParam(fields),
		sysparm_rows: recordCount,
		sysparm_view: '',
		sysparm_fields: includeAllFields ? 'ALL_FIELDS' : columns,
		sysparm_excel_type: excelFormat,
		sysparm_query: query,
		sysparm_workspace_export: workspaceConfigId
	};
	const options = {
		dispatch,
		pollOptions
	};

	importSvc = ListExportService(options);
	importSvc.exportList();
	importSvc.downloadExport();
};

const getImportConfigParam = fields => {
	const radioButtonSelected = fields.LIST_IMPORT_TYPE.value.toLowerCase();
	return 'update' === radioButtonSelected
		? SYSPARAM_UPDATE_IMPORT
		: SYSPARAM_INSERT_IMPORT;
};

const disableImportExcelLoader = ({updateState}) => {
	updateState({showLoader: false});
};

const handleCustomCancel = coeffects => {
	if (importSvc) {
		importSvc.cancelJob();
		disableImportExcelLoader(coeffects);
	}
};

const dismissAlertLists = ({updateState, action}) => {
	const {payload: value} = action;
	updateState({notifications: value});
};

const handleExportExceptions = ({updateState, action}) => {
	const {
		payload: {message}
	} = action;
	const errorNotification = {
		id: `now_alert_critical_${cuid()}`,
		status: ALERT_CONSTANTS.STATUS.CRITICAL,
		content: {
			type: 'string',
			value: message
		},
		action: {type: ALERT_CONSTANTS.ACTION.TYPES.DISMISS}
	};
	updateState([
		{
			path: 'notifications',
			value: [errorNotification],
			operation: 'concat'
		},
		{
			path: 'showLoader',
			value: false,
			operation: 'set'
		}
	]);
};

export const backButtonEffect = (state, updateState, host) => {
	const {
		currentStep,
		showBrowse,
		notifications,
		uploadFile: {progressValue}
	} = state;
	// as the back button can be pressed from browse window, with out going to next
	// steppers, so it which case we can avoid, resetting
	// case: we upload a error file, and go back select another file, and try
	// uploading it, it will show previuosly set progress value.
	if (progressValue !== IMPORT_MODAL.DEFAULT_PROGRESS_VALUE) {
		updateProgressBarValues(
			updateState,
			IMPORT_MODAL.DEFAULT_PROGRESS_VALUE,
			'positive'
		);
	}
	// if any notifications clear them.
	if (notifications.length > 0) {
		updateState({notifications: []});
	}
	if (!showBrowse) {
		updateState({showBrowse: true, showProgress: false});
		if (currentStep === 3) {
			// this case - to click the back button from preview.
			updateState({currentStep: currentStep - 1});
		}
		const modal = host.shadowRoot.querySelector(NOW_MODAL);
		// resetting the selected file value, to make sure onchange triggers on selecting same file.
		if (modal) {
			const fileInputElem = modal.querySelector('#fileInput_import');
			if (fileInputElem) fileInputElem.value = '';
		}
	} else {
		/* on moving to step - 1 make sure to reset the stepper items 2, else 
		we might get a usecase where we move till preview and go back we see issue with step
		being as done state.
		*/
		updateStepperToInitialIfDone(state, updateState);
		updateState({currentStep: currentStep - 1});
	}
};

export const completeImportButtonEffect = (state, updateState, dispatch) => {
	updateState({
		path: 'previewLoader',
		value: true,
		operation: 'set'
	});
	const formData = constructCompleteImportData(state);

	//call the transform end point.
	dispatch(IMPORT_MODAL_ACTIONS.LIST_IMPORT_COMPLETE_REQUESTED, {
		data: formData
	});
};

export const footerActionClickedEffect = coeffects => {
	const footerActionLabel = get(coeffects, 'action.payload.footerAction.label');
	const {dispatch, state, updateState, host} = coeffects;

	const {currentStep, stepperItems} = state;
	switch (footerActionLabel) {
		case IMPORT_FOOTER_BUTTON.CANCEL.label:
			dispatch(CLOSE_MODAL);
			break;
		case IMPORT_FOOTER_BUTTON.NEXT.label:
			// update the current stepper with complete and move to next stepper.
			updateStateProgressStepper(updateState, stepperItems, currentStep);
			break;
		case IMPORT_FOOTER_BUTTON.BACK.label:
			backButtonEffect(state, updateState, host);
			break;
		case IMPORT_FOOTER_BUTTON.BROWSE.label:
			browseButtonEffect(host);
			break;
		case IMPORT_FOOTER_BUTTON.UPLOAD.label:
			uploadButtonEffect(state, updateState, dispatch);
			break;
		case IMPORT_FOOTER_BUTTON.COMPLETE_IMPORT.label:
			completeImportButtonEffect(state, updateState, dispatch);
			break;
		default:
			break;
	}
};

export const fileUploadEffect = ({
	action: {
		payload: {file}
	},
	updateState
}) => {
	if (file) {
		updateState([
			{
				path: 'uploadFile.file',
				value: file,
				operation: 'set'
			},
			{path: 'showBrowse', value: false, operation: 'set'}
		]);
	}
};
export const customOpenedSetEffect = coeffects => {
	const {
		state: {showLoader}
	} = coeffects;
	if (showLoader) {
		handleCustomCancel(coeffects);
	} else {
		openedSetEffect(coeffects);
	}
};

export const uploadButtonEffect = (state, updateState, dispatch) => {
	const {currentStep} = state;
	/* resetting the uploadSuccess, as in a use-case if we move from error case, 
	in which we show back button, and now we go back and select, a valid file, 
	by this time we need to reset to default - else we will see glimpse of back button */

	updateState([
		{
			path: 'showProgress',
			value: true,
			operation: 'set'
		},
		{
			path: 'currentStep',
			value: currentStep,
			operation: 'set'
		},
		{
			shouldRender: false,
			path: 'uploadFile.uploadSuccess',
			value: true,
			operation: 'set'
		}
	]);

	// get the root id of the parent tracker
	dispatch(IMPORT_MODAL_ACTIONS.LIST_IMPORT_GET_ROOTID, {
		trackerName: TRACKER_NAME.ROOT
	});
};

export const triggerProgressTracker = (
	state,
	dispatch,
	updateState,
	rootId
) => {
	const formData = constructFormData(state);
	updateState({
		path: 'trackerResults.percent',
		value: IMPORT_MODAL.TRACKER_DEFAULT_PERCENT,
		operation: 'set'
	});

	//call getStatus
	dispatch(IMPORT_MODAL_ACTIONS.PROGRESS_STATUS_REQUESTED, {
		sysparm_execution_id: rootId
	});

	dispatch(IMPORT_MODAL_ACTIONS.FILE_UPLOAD_PROCESSOR_TRIGGERED, {
		data: formData
	});
};

export const fileUploaderHandler = (coeffects, message, importSet) => {
	const {updateState} = coeffects;
	let isFileUploadSuccess = false;
	if (message !== IMPORT_MODAL.UPLOAD_SUCCESS) {
		// update notifiction message. update the
		// progress tracker with failure message
		setErrorNotificationAndProgress(message, updateState);
	} else {
		//upload file success.
		isFileUploadSuccess = true;
		if (importSet) {
			updateState({
				shouldRender: false,
				path: 'importSetId',
				value: importSet,
				operation: 'set'
			});
		}
	}
	/* we need to set this, to make sure we dont trigger the recursive calls
	of getStatus() if this is set to false. */

	updateState({
		shouldRender: false,
		path: 'uploadFile.uploadSuccess',
		value: isFileUploadSuccess,
		operation: 'set'
	});
};

export const updateErrorOrSuccessStatus = (coeffects, message) => {
	const {
		updateState,
		state: {stepperItems, currentStep}
	} = coeffects;
	let isFileUploadSuccess = false;
	if (message !== '') {
		setErrorNotificationAndProgress(message, updateState);
	} else {
		//success case
		isFileUploadSuccess = true;
		// Move to the next stepper
		updateStateProgressStepper(updateState, stepperItems, currentStep);
	}
	/* we need to set uploadSuccess - based on this we show back button if
	some errors, if this is set to true */

	updateState({
		shouldRender: false,
		path: 'uploadFile.uploadSuccess',
		value: isFileUploadSuccess,
		operation: 'set'
	});
};

export const progressStatusHandler = (coeffects, trackerObj) => {
	const {
		updateState,
		dispatch,
		state: {
			cancel,
			uploadFile: {uploadSuccess},
			rootId,
			trackerResults: {percent}
		}
	} = coeffects;

	/* If the file upload fails, or cancel is hit we no need to call
	getstatus recursively. */
	if (!uploadSuccess || cancel) {
		return;
	}
	const percentComplete = getTackerPercentComplete(trackerObj);
	updateState({
		path: 'trackerResults.percent',
		value: percentComplete,
		operation: 'set'
	});

	const message = getMessageFromChildrenAndRootTracker(trackerObj);
	updateProgressBarValues(updateState, percentComplete / 100, 'positive');

	if (percent !== IMPORT_MODAL.PERCENT_COMPLETED && message === '') {
		// call the getStatus end point till the process is completed.
		dispatch(IMPORT_MODAL_ACTIONS.PROGRESS_STATUS_REQUESTED, {
			sysparm_execution_id: rootId
		});
	} else {
		/* check the error message, if any, throw the notification,
		else move to the next preview stepper.*/
		updateErrorOrSuccessStatus(coeffects, message);
	}
};

export const openedSetEffect = coeffects => {
	const {dispatch, updateState} = coeffects;
	updateState({cancel: true});
	dispatch(CLOSE_MODAL);
};

export const errorMessagesEffect = (updateState, msg) => {
	updateState({
		errors: msg
	});
};

export const handleImportNotifications = coeffects => {
	const {
		updateState,
		action: {
			payload: {message}
		}
	} = coeffects;
	setErrorNotification(message, updateState);
};

export default {
	[MODAL_ACTIONS.OPENED_SET]: {
		effect: customOpenedSetEffect,
		stopPropagation: true
	},
	[MODAL_ACTIONS.FOOTER_ACTION_CLICKED]: {
		effect: footerActionClickedEffect,
		stopPropagation: true
	},
	[IMPORT_MODAL_ACTIONS.NOW_RADIO_BUTTON_VALUE_CHANGE]: {
		effect: radioButtonValueChange,
		stopPropagation: true
	},
	[IMPORT_MODAL_ACTIONS.NOW_CHECKBOX_VALUE_CHANGE]: {
		effect: checkBoxValueChange,
		stopPropagation: true
	},
	[IMPORT_MODAL_ACTIONS.IMPORT_FILE_UPLOAD]: {
		effect: fileUploadEffect,
		stopPropagation: true
	},
	[IMPORT_MODAL_ACTIONS.NOW_DROPDOWN_VALUE_CHANGED]: {
		effect: dropDownValueChange,
		stopPropagation: true
	},
	[IMPORT_MODAL_ACTIONS.NOW_BUTTON_BARE_CLICKED]: {
		effect: exportExcelTemplate,
		stopPropagation: true
	},
	[LIST_PROGRESS_EDS_MODAL.ACTIONS.DOWNLOAD]: {
		effect: disableImportExcelLoader,
		stopPropagation: true
	},
	[IMPORT_MODAL_ACTIONS.EXPORT_CANCEL_CLICKED]: {
		effect: handleCustomCancel,
		stopPropagation: true
	},
	[ALERT_LIST.ITEMS_SET]: {
		effect: dismissAlertLists,
		stopPropagation: true
	},
	[EXPORT_ACTIONS.FAIL]: {
		effect: handleExportExceptions,
		stopPropagation: true
	},
	[IMPORT_MODAL_ACTIONS.LIST_IMPORT_ADD_ERROR_NOTIFICATION]: {
		effect: handleImportNotifications,
		stopPropagation: true
	}
};
