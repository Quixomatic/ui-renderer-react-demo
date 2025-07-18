import {Logger} from '@devsnc/sn-list-commons';
import cuid from 'cuid';
import get from 'lodash/get';
import isMatch from 'lodash/isMatch';
import set from 'lodash/set';
import {t} from 'sn-translate';

import {
	ALERT_CONSTANTS,
	CHANGE_MODAL_TYPE,
	CLOSE_MODAL,
	EXPORT_ACTIONS,
	EXPORT_MODAL_BOOTSTRAP,
	EXPORT_MODAL_FIELD_CHANGED,
	EXPORT_STATUSES,
	LIST_EXPORT_EDS_MODAL,
	LIST_EXPORT_USER_PREFERENCES,
	LIST_PROGRESS_EDS_MODAL,
	LIST_UPDATE_EXPORT_USER_PREF,
	RECORD_LIST_NOTIFICATION_ADDED
} from '../../../constants';

import {
	EXPORT_DELIVERY_TYPES,
	EXPORT_FIELD_DELIVERY_TYPE,
	EXPORT_FIELD_EMAIL,
	EXPORT_MODAL_PROGRESS,
	ListExportService,
	defaultPreferencesMap,
	getFieldNameFromPreference
} from './listExportService';

const LOG = Logger().createLog('EXPORT MODAL ACTIONS');

let exportSvc = undefined;

const exportButtonEffect = ({state, dispatch}) => {
	const {
		properties: {table, columns, view, query, recordCount, workspaceConfigId},
		userPrefsState
	} = state;

	const {fileType, orientation, deliveryType, email} = userPrefsState;
	const pollOptions = {
		sysparm_target: table,
		sysparm_export: getExportParam(fileType.value, orientation.value),
		sysparm_rows: recordCount,
		sysparm_fields: columns || '',
		sysparm_view: view,
		sysparm_query: query || '',
		sysparm_workspace_export: 'workspace',
		workspace_id: workspaceConfigId
	};
	const processorUrl = getEmailProcessor(fileType.value, orientation.value);

	const exportOptions = {
		email: email.value,
		dispatch,
		pollOptions,
		processorUrl
	};

	if (!isMatch(defaultPreferencesMap, userPrefsState))
		dispatch(LIST_UPDATE_EXPORT_USER_PREF, {
			preferences: Object.values(userPrefsState)
		});

	exportSvc = ListExportService(exportOptions);

	if (deliveryType.value === EXPORT_DELIVERY_TYPES.DOWNLOAD.value) {
		exportSvc.exportList();
		dispatch(CHANGE_MODAL_TYPE, {modalType: EXPORT_MODAL_PROGRESS});
	} else if (deliveryType.value === EXPORT_DELIVERY_TYPES.EMAIL.value) {
		exportSvc.emailExport();
	} else {
		LOG.log('Export List:: Unsupported delivery type:' + deliveryType.value);
	}
};

const changeModalEffect = ({action, updateState}) => {
	updateState({
		modalType: action.payload.modalType,
		status: EXPORT_STATUSES.LOADING
	});
};

const downloadNotifications = [
	{
		id: `now_alert_info_${cuid()}`,
		status: ALERT_CONSTANTS.STATUS.INFO,
		content: {
			type: 'string',
			value: t('Download is complete')
		},
		action: {type: ALERT_CONSTANTS.ACTION.TYPES.DISMISS}
	}
];

const handleExport = (download, dispatch) => {
	if (exportSvc) {
		if (download) {
			exportSvc.downloadExport();
			dispatch(RECORD_LIST_NOTIFICATION_ADDED, {
				alertList: downloadNotifications
			});
		} else exportSvc.cancelJob();
	}
	exportSvc = null;
	dispatch(CLOSE_MODAL);
};

const closeExportModalEffect = ({dispatch}) => {
	handleExport(false, dispatch);
};

const onBootstrapEffect = ({state, updateState}) => {
	const {
		properties: {userPreferences = [], notifications = []},
		userPrefsState
	} = state;

	const listExportValues = Object.values(LIST_EXPORT_USER_PREFERENCES);

	userPreferences
		.filter(
			currentUserPref => listExportValues.indexOf(currentUserPref.name) !== -1
		)
		.forEach(currentUserPref => {
			const fieldName = getFieldNameFromPreference(
				get(currentUserPref, 'name', '')
			);
			const userPrefValue = get(currentUserPref, 'value', '');
			if (userPrefValue) userPrefsState[fieldName] = currentUserPref;
		});

	if (notifications.length > 0) {
		set(
			userPrefsState,
			`[${EXPORT_FIELD_DELIVERY_TYPE}].value`,
			EXPORT_FIELD_EMAIL
		);
	}

	updateState({
		bootstrapped: true,
		userPrefsState
	});
};

const exportModalFieldChangedEffect = ({action, updateState}) => {
	updateState({status: action.payload.status, message: action.payload.message});
};

const downloadEffect = ({dispatch}) => {
	handleExport(true, dispatch);
};

const exportConfig = {
	excel: {
		sysparm_export: 'unload_excel_xlsx',
		processor_name: '/sys_confirm_excel.do'
	},
	json: {
		sysparm_export: 'unload_json',
		processor_name: '/sys_confirm_json.do'
	},
	csv: {
		sysparm_export: 'unload_csv',
		processor_name: '/sys_confirm_csv.do'
	},
	'pdf-portrait': {
		sysparm_export: 'unload_pdf',
		processor_name: '/sys_confirm_pdf.do'
	},
	'pdf-detailed portrait': {
		sysparm_export: 'unload_pdf+',
		processor_name: '/sys_confirm_pdf+.do'
	},
	'pdf-landscape': {
		sysparm_export: 'unload_pdflandscape',
		processor_name: '/sys_confirm_pdflandscape.do'
	},
	'pdf-detailed landscape': {
		sysparm_export: 'unload_pdf+landscape',
		processor_name: '/sys_confirm_pdf+landscape.do'
	}
};

const getExportConfig = (fileType, orientation) =>
	exportConfig[fileType + (fileType === 'pdf' ? '-' + orientation : '')];

const getExportParam = (fileType, orientation) =>
	getExportConfig(fileType, orientation).sysparm_export;

const getEmailProcessor = (fileType, orientation) =>
	getExportConfig(fileType, orientation).processor_name;

export default {
	[EXPORT_MODAL_BOOTSTRAP]: {
		effect: onBootstrapEffect,
		stopPropagation: true
	},
	[EXPORT_MODAL_FIELD_CHANGED]: {
		effect: exportModalFieldChangedEffect,
		stopPropagation: true
	},
	[CHANGE_MODAL_TYPE]: {
		effect: changeModalEffect,
		stopPropagation: true
	},
	[LIST_EXPORT_EDS_MODAL.ACTIONS.EXPORT]: {
		effect: exportButtonEffect,
		stopPropagation: true
	},
	[LIST_EXPORT_EDS_MODAL.ACTIONS.CANCEL]: {
		effect: closeExportModalEffect,
		stopPropagation: true
	},
	[LIST_EXPORT_EDS_MODAL.ACTIONS.CLOSE]: {
		effect: closeExportModalEffect,
		stopPropagation: true
	},
	[LIST_PROGRESS_EDS_MODAL.ACTIONS.DOWNLOAD]: {
		effect: downloadEffect,
		stopPropagation: true
	},
	[EXPORT_ACTIONS.SUCCESS]: {
		effect: exportModalFieldChangedEffect,
		stopPropagation: true
	},
	[EXPORT_ACTIONS.FAIL]: {
		effect: exportModalFieldChangedEffect,
		stopPropagation: true
	},
	[EXPORT_ACTIONS.CANCEL]: {
		effect: exportModalFieldChangedEffect,
		stopPropagation: true
	}
};
