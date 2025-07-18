import '@servicenow/now-loader';
import {createCustomElement} from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';

import {
	EXPORT_MESSAGES,
	EXPORT_STATUSES,
	LIST_LOADER_SIZE_LG
} from '../../../constants';

import styles from './listExportModal.scss';

const [defaultSuccessMessage, defaultFailMessage, defaultCancelMessage] = [
	EXPORT_MESSAGES.SUCCESS,
	EXPORT_MESSAGES.FAIL,
	EXPORT_MESSAGES.CANCEL
];

const view = state => {
	const {
		properties: {status, message}
	} = state;

	return (
		<div className="sn-progress" tabIndex="0">
			{status === EXPORT_STATUSES.LOADING ? (
				<now-loader size={LIST_LOADER_SIZE_LG} />
			) : null}
			{status === EXPORT_STATUSES.SUCCESS ? (
				<span>{message || defaultSuccessMessage}</span>
			) : null}
			{status === EXPORT_STATUSES.FAIL ? (
				<span>{message || defaultFailMessage}</span>
			) : null}
			{status === EXPORT_STATUSES.CANCEL ? (
				<span>{message || defaultCancelMessage}</span>
			) : null}
		</div>
	);
};

createCustomElement('sn-record-list-modal-export-progress', {
	renderer: {
		type: snabbdom,
		view
	},
	properties: {
		componentId: {default: 'sn-list-progress-modal'},
		status: {default: EXPORT_STATUSES.LOADING},
		message: {default: ''}
	},
	styles
});
