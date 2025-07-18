import '@servicenow/now-modal';
import {createCustomElement} from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';
import get from 'lodash/get';
import {t} from 'sn-translate';

import {
	CLOSE_MODAL,
	LIST_DELETE_REQUESTED,
	LIST_MENU_CRUD,
	METRIC_TRACKED,
	MODAL_ACTIONS
} from '../../constants';
import {DELETE_LIST_EVENT} from '../../utils/metrics/constants';

const modalTitle = t('Delete');
const modalMessage = t(
	'Are you sure you want to delete this list? This cannot be undone.'
);
const cancelTitle = t('Cancel');
const confirmTitle = t('Delete');

const view = () => {
	const footerActions = [
		{label: confirmTitle, variant: 'primary-negative'},
		{label: cancelTitle, variant: 'secondary'}
	];

	return (
		<now-modal
			size="sm"
			content={modalMessage}
			header-label={modalTitle}
			footer-actions={footerActions}
			manage-opened
			opened={true}></now-modal>
	);
};

const footerActionClickedEffect = coeffects => {
	const {dispatch, properties} = coeffects;
	const {
		listTitle,
		table,
		columns,
		originalConditions,
		selectedListId,
		isWorkspace
	} = properties;
	const footerActionLabel = get(coeffects, 'action.payload.footerAction.label');

	if (footerActionLabel === confirmTitle) {
		const opts = {
			timestamp: Date.now(),
			type: 'DESTROY'
		};
		dispatch(METRIC_TRACKED, {eventName: DELETE_LIST_EVENT, metadata: opts});
		if (isWorkspace) {
			dispatch(LIST_MENU_CRUD, opts);
		} else {
			dispatch(LIST_DELETE_REQUESTED, {
				timestamp: Date.now(),
				currentListData: {
					title: listTitle,
					table,
					columns,
					conditions: originalConditions,
					selectedListId
				}
			});
		}
	}

	dispatch(CLOSE_MODAL);
};

createCustomElement('sn-record-list-modal-delete-list', {
	renderer: {
		type: snabbdom,
		view
	},
	properties: {
		listTitle: {default: ''},
		table: {default: ''},
		columns: {default: ''},
		query: {default: ''},
		originalConditions: {default: ''},
		selectedListId: {default: ''},
		isWorkspace: {default: false}
	},
	actionHandlers: {
		[MODAL_ACTIONS.FOOTER_ACTION_CLICKED]: {
			effect: footerActionClickedEffect,
			stopPropagation: true
		},
		[MODAL_ACTIONS.OPENED_SET]: {
			effect: footerActionClickedEffect,
			stopPropagation: true
		}
	}
});
