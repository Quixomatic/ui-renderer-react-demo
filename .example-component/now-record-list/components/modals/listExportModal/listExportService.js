import {Logger} from '@devsnc/sn-list-commons';
import cuid from 'cuid';
import get from 'lodash/get';
import set from 'lodash/set';
import {t} from 'sn-translate';
import {getProperty, preUserData} from 'sn-uxpage-presource';

import {
	CLOSE_MODAL,
	EXPORTING,
	EXPORT_ACTIONS,
	EXPORT_MESSAGES,
	EXPORT_POLL_INTERVAL,
	EXPORT_STATUSES,
	EXPORT_SYSTEM_PROPERTIES,
	LIST_EXPORT_EDS_MODAL,
	LIST_EXPORT_USER_PREFERENCES,
	LIST_PROGRESS_EDS_MODAL,
	RECORD_LIST_NOTIFICATION_ADDED
} from '../../../constants';
import {isInputEmpty} from '../../list/listUtils';

import {validateEmail} from './emailValidationService';
import {hasInvalid} from './fieldsValidation';
import {
	emailProcessorService,
	pollProcessorService
} from './pollProcessorService';

export const EXPORT_MODAL_TYPE_SELECTION = 'EXPORT_MODAL_TYPE_SELECTION';
export const EXPORT_MODAL_PROGRESS = 'EXPORT_MODAL_PROGRESS';
export const EXPORT_MODAL_FIELDS = [];
export const EXPORT_FIELD_FILE_TYPE = 'fileType';
export const EXPORT_FIELD_ORIENTATION = 'orientation';
export const EXPORT_FIELD_DELIVERY_TYPE = 'deliveryType';
export const EXPORT_FIELD_EMAIL = 'email';

const exportModalTypeSelectionTitle = t('Export');

const LOG = Logger().createLog('LIST EXPORT SERVICE');

const DEFAULT_CONFIRM_TITLE = t('OK');
const OK_BUTTON = {
	title: DEFAULT_CONFIRM_TITLE,
	buttonStyle: 'confirm'
};

const downloadUrl = sUrl => {
	top.window.location = sUrl;
};

export const ListExportService = options => {
	const jobIdPromise = defer(),
		sysIdPromise = defer(),
		timerPromise = defer(),
		attachmentUrl = '/sys_attachment.do?sys_id=';
	const {dispatch, email, pollOptions, processorUrl} = options;

	return {
		emailExport: () => {
			emailProcessorService.emailExport(email, processorUrl, pollOptions).then(
				() => {
					let emailNotifications = [
						{
							id: `now_alert_info_${cuid()}`,
							status: 'info',
							content: {
								type: 'string',
								value: t('Your export will be e-mailed to {0}', email)
							},
							action: {type: 'dismiss'}
						}
					];
					if (emailNotifications.length > 0) {
						dispatch(RECORD_LIST_NOTIFICATION_ADDED, {
							alertList: emailNotifications
						});
						dispatch(CLOSE_MODAL);
					}
				},
				() => {
					dispatch(EXPORT_ACTIONS.FAIL, {
						message: EXPORT_MESSAGES.FAIL,
						buttons: [OK_BUTTON],
						status: EXPORT_STATUSES.FAIL
					});
				}
			);
		},
		exportList: () => {
			pollProcessorService.init(pollOptions).then(
				res => {
					const pollJobId = res.data;
					let timerId = 0;
					jobIdPromise.resolve(pollJobId);
					let queuePoll = () => {
						timerId = window.setInterval(poll, EXPORT_POLL_INTERVAL);
					};
					const poll = () => {
						pollProcessorService.poll(pollJobId, 'poll').then(
							res => {
								window.clearInterval(timerId);
								if (res.data.indexOf('complete') === 0) {
									sysIdPromise.resolve(res.data.split(',')[1]);
									dispatch(LIST_PROGRESS_EDS_MODAL.ACTIONS.DOWNLOAD, {
										message: EXPORT_MESSAGES.SUCCESS,
										status: EXPORT_STATUSES.SUCCESS
									});
								} else if (res.data.indexOf('error') === 0)
									dispatch(EXPORT_ACTIONS.FAIL, {
										message: EXPORT_MESSAGES.FAIL,
										buttons: [OK_BUTTON],
										status: EXPORT_STATUSES.FAIL
									});
								else if (res.data.indexOf('cancelled') !== -1)
									dispatch(EXPORT_ACTIONS.CANCEL, {
										message: EXPORT_MESSAGES.CANCEL,
										buttons: [OK_BUTTON],
										status: EXPORT_STATUSES.CANCEL
									});
								else if (res.data.indexOf('initial') !== 0) queuePoll();
							},
							() => {
								window.clearInterval(timerId);

								dispatch(EXPORT_ACTIONS.FAIL, {
									message: EXPORT_MESSAGES.FAIL,
									buttons: [OK_BUTTON],
									status: EXPORT_STATUSES.FAIL
								});
							}
						);
					};
					queuePoll();
					timerPromise.resolve(timerId);
				},
				() => {
					timerPromise.then(timerId => {
						window.clearInterval(timerId);
					});
					dispatch(EXPORT_ACTIONS.FAIL, {
						message: EXPORT_MESSAGES.FAIL,
						buttons: [OK_BUTTON],
						status: EXPORT_STATUSES.FAIL
					});
				}
			);
		},
		cancelJob: () => {
			timerPromise.then(timerId => {
				window.clearInterval(timerId);
			});
			jobIdPromise.then(pollJobId => {
				pollProcessorService.poll(pollJobId, 'cancel').then(
					() => {
						LOG.log('Export Cancelled');
					},
					error => {
						LOG.warn('Export Cancelled: ', error);
					}
				);
			});
		},
		downloadExport: () => {
			sysIdPromise.then(sysId => {
				downloadUrl(attachmentUrl + sysId);
			});
		}
	};
};

export const NotificationService = {
	getNotifications: options => {
		const {recordCount} = options;
		const threshold = parseInt(getProperty(EXPORT_SYSTEM_PROPERTIES.THRESHOLD)),
			limit = parseInt(getProperty(EXPORT_SYSTEM_PROPERTIES.LIMIT)),
			isThreshold = !isNaN(threshold) && recordCount > threshold,
			isLimit = !isNaN(limit) && recordCount > limit;

		let limitNotifications = [],
			thresholdNotifications = [];

		if (isLimit) {
			limitNotifications = [
				{
					id: `now_alert_info_${cuid()}`,
					status: 'info',
					content: {
						type: 'string',
						value: t(
							'The export you requested contains {0} rows which exceeds the system limit. You will only be able to export {1} rows.',
							recordCount,
							limit
						)
					},
					action: {type: 'dismiss'}
				}
			];
		} else if (isThreshold) {
			thresholdNotifications = [
				{
					id: `now_alert_info_${cuid()}`,
					status: 'info',
					content: t(
						'The export you requested contains {0} rows which may take a long time to return. It is recommended that you select Email as the delivery instead of waiting.',
						recordCount
					)
				}
			];
		}
		return {
			limitNotifications,
			thresholdNotifications
		};
	}
};

const defer = () => {
	let res, rej;
	const promise = new Promise((resolve, reject) => {
		res = resolve;
		rej = reject;
	});
	promise.resolve = res;
	promise.reject = rej;
	return promise;
};

//File Type constants
export const EXPORT_FILE_TYPES = {
	EXCEL: {value: 'excel', displayValue: t('Excel')},
	CSV: {value: 'csv', displayValue: t('CSV')},
	JSON: {value: 'json', displayValue: t('JSON')},
	PDF: {value: 'pdf', displayValue: t('PDF')}
};

//Orientation Constants
export const EXPORT_ORIENTATIONS = {
	LANDSCAPE: {value: 'landscape', displayValue: t('Landscape')},
	PORTRAIT: {value: 'portrait', displayValue: t('Portrait')}
};

export const EXPORT_DELIVERY_TYPES = {
	DOWNLOAD: {value: 'download', displayValue: t('Download')},
	EMAIL: {value: 'email', displayValue: t('Email')}
};

const preferenceMapping = {
	[LIST_EXPORT_USER_PREFERENCES.EXPORT_FILE_TYPE]: EXPORT_FIELD_FILE_TYPE,
	[LIST_EXPORT_USER_PREFERENCES.EXPORT_ORIENTATION_TYPE]: EXPORT_FIELD_ORIENTATION,
	[LIST_EXPORT_USER_PREFERENCES.EXPORT_DELIVERY_TYPE]: EXPORT_FIELD_DELIVERY_TYPE,
	[LIST_EXPORT_USER_PREFERENCES.EXPORT_EMAIL]: EXPORT_FIELD_EMAIL
};

export const getFieldNameFromPreference = name => preferenceMapping[name];

export const defaultPreferencesMap = {
	[EXPORT_FIELD_FILE_TYPE]: {
		name: LIST_EXPORT_USER_PREFERENCES.EXPORT_FILE_TYPE,
		value: EXPORT_FILE_TYPES.EXCEL.value
	},
	[EXPORT_FIELD_ORIENTATION]: {
		name: LIST_EXPORT_USER_PREFERENCES.EXPORT_ORIENTATION_TYPE,
		value: EXPORT_ORIENTATIONS.LANDSCAPE.value
	},
	[EXPORT_FIELD_DELIVERY_TYPE]: {
		name: LIST_EXPORT_USER_PREFERENCES.EXPORT_DELIVERY_TYPE,
		value: EXPORT_DELIVERY_TYPES.DOWNLOAD.value
	},
	[EXPORT_FIELD_EMAIL]: {
		name: LIST_EXPORT_USER_PREFERENCES.EXPORT_EMAIL,
		value: ''
	}
};

const updateUserEmail = (value, email) => {
	return isInputEmpty(value) && email ? email : value;
};

export const transformExportFieldsState = state => {
	const {userPrefsState, fields: stateFields, modalType} = state;
	const user = preUserData.initialState || {};

	if (modalType === EXPORT_MODAL_PROGRESS) return {};

	for (let [key, {value}] of Object.entries(userPrefsState)) {
		if (key === EXPORT_FIELD_EMAIL) {
			value = updateUserEmail(value, user.email);
			set(stateFields, `${key}.invalid`, !validateEmail(value));
			set(userPrefsState, `${key}.value`, value);
		}

		set(stateFields, `${key}.value`, value);
	}

	const fieldsArray = Object.values(stateFields);
	const confirmationDisabled = hasInvalid(fieldsArray);

	return {fields: fieldsArray, confirmationDisabled};
};

export const defaultExportFields = {
	[EXPORT_FIELD_FILE_TYPE]: {
		type: LIST_EXPORT_EDS_MODAL.TYPES.CHOICE,
		name: EXPORT_FIELD_FILE_TYPE,
		label: t('File Type'),
		mandatory: false,
		choices: Object.values(EXPORT_FILE_TYPES)
	},
	[EXPORT_FIELD_ORIENTATION]: {
		type: LIST_EXPORT_EDS_MODAL.TYPES.CHOICE,
		name: EXPORT_FIELD_ORIENTATION,
		label: t('Orientation'),
		mandatory: false,
		choices: Object.values(EXPORT_ORIENTATIONS),
		show: fields => {
			const field = fields.find(f => f.name === 'fileType');
			return field.value === EXPORT_FILE_TYPES.PDF.value;
		}
	},
	[EXPORT_FIELD_DELIVERY_TYPE]: {
		type: LIST_EXPORT_EDS_MODAL.TYPES.CHOICE,
		name: EXPORT_FIELD_DELIVERY_TYPE,
		mandatory: false,
		label: t('Delivery Type'),
		choices: Object.values(EXPORT_DELIVERY_TYPES)
	},
	[EXPORT_FIELD_EMAIL]: {
		type: LIST_EXPORT_EDS_MODAL.TYPES.EMAIL,
		name: EXPORT_FIELD_EMAIL,
		mandatory: true,
		label: t('Email'),
		maxlength: 40,
		show: fields => {
			const field = fields.find(f => f.name === 'deliveryType');
			return field.value === EXPORT_DELIVERY_TYPES.EMAIL.value;
		},
		onKeyUp: (event, fields, updateState) => {
			let {name, value} = event.target;
			updateState({
				path: `userPrefsState.${name}.value`,
				value,
				operation: 'set'
			});
		}
	}
};

const createModalButton = (disabled, primary, label, action) => {
	return {
		disabled,
		variant: primary
			? LIST_EXPORT_EDS_MODAL.BUTTONS.PRIMARY
			: LIST_EXPORT_EDS_MODAL.BUTTONS.SECONDARY,
		label,
		clickActionType: action
	};
};

const typeSelectionActionHelper = state => {
	const disabled = get(state, 'confirmationDisabled', false);

	const confirmationFooterButton = createModalButton(
		disabled,
		true,
		LIST_EXPORT_EDS_MODAL.LABELS.EXPORT,
		LIST_EXPORT_EDS_MODAL.ACTIONS.EXPORT
	);

	const cancelFooterButton = createModalButton(
		false,
		false,
		LIST_EXPORT_EDS_MODAL.LABELS.CANCEL,
		LIST_EXPORT_EDS_MODAL.ACTIONS.CANCEL
	);

	return {
		footerActions: [confirmationFooterButton, cancelFooterButton],
		modalTitle: exportModalTypeSelectionTitle
	};
};

const progressActionHelper = state => {
	const status = get(state, 'status');
	const showDownload =
		status === EXPORT_STATUSES.LOADING || status === EXPORT_STATUSES.SUCCESS;

	const cancelFooterButton = createModalButton(
		false,
		false,
		LIST_EXPORT_EDS_MODAL.LABELS.CANCEL,
		LIST_EXPORT_EDS_MODAL.ACTIONS.CANCEL
	);

	return {
		footerActions: showDownload ? [cancelFooterButton] : [],
		modalTitle: EXPORTING
	};
};

const exportModalFooterActionKV = [
	[EXPORT_MODAL_TYPE_SELECTION, typeSelectionActionHelper],
	[EXPORT_MODAL_PROGRESS, progressActionHelper]
];

const exportModalFooterActionMap = new Map(exportModalFooterActionKV);

export const getFooterActionsHelper = type =>
	exportModalFooterActionMap.get(type);
