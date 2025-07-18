import '@devsnc/sn-record-input';
import '@servicenow/now-modal';
import {actionTypes, createCustomElement} from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';
import get from 'lodash/get';
import {t} from 'sn-translate';

import {
	CLOSE_MODAL,
	LIST_MENU_CRUD,
	LIST_SAVE_AS_REQUESTED,
	MODAL_ACTIONS,
	REFRESH_LIST_MENU
} from '../../constants';
import {trimString} from '../list/listUtils';

const {COMPONENT_BOOTSTRAPPED} = actionTypes;
const saveAsModalTitle = t('Save as');
const cancelTitle = t('Cancel');
const confirmTitle = t('Save');
const label = t('Title');

const view = (state, {updateState}) => {
	const {currentFieldValue} = state;

	const footerActions = [
		{
			label: confirmTitle,
			variant: 'primary',
			...(currentFieldValue.length === 0 ? {disabled: 'true'} : {})
		},
		{label: cancelTitle, variant: 'secondary'}
	];

	return (
		<now-modal
			size="sm"
			header-label={saveAsModalTitle}
			footer-actions={footerActions}
			manage-opened
			opened={true}>
			<sn-record-input
				value={currentFieldValue}
				name={'title'}
				mandatory={true}
				label={label}
				maxlength={40}
				onValueChange={e => {
					if (e && e.value.length <= 40) {
						updateState({
							path: 'currentFieldValue',
							value: e.value,
							operation: 'set'
						});
					}
					e.event.stopPropagation();
				}}
			/>
		</now-modal>
	);
};

const footerActionClickedEffect = coeffects => {
	const {dispatch, state, properties} = coeffects;
	const {currentFieldValue: title} = state;
	const {
		listTitle,
		columns,
		table,
		selectedListId,
		originalConditions,
		conditions = '',
		isWorkspace
	} = properties;
	const footerActionLabel = get(coeffects, 'action.payload.footerAction.label');

	if (footerActionLabel === confirmTitle) {
		const opts = {
			timestamp: Date.now(),
			type: 'CREATE',
			options: {
				title,
				table,
				columns,
				conditions
			}
		};

		if (isWorkspace) {
			dispatch(LIST_MENU_CRUD, opts);
		} else {
			dispatch(LIST_SAVE_AS_REQUESTED, {
				timestamp: Date.now(),
				currentListData: {
					title: listTitle,
					table,
					columns,
					conditions: originalConditions,
					selectedListId
				},
				update: {
					title,
					table,
					columns,
					conditions
				}
			});
		}
	}
	dispatch(REFRESH_LIST_MENU, {refreshTimestamp: Date.now()});
	dispatch(CLOSE_MODAL);
};

const bootstrappedEffect = coeffects => {
	const {title} = coeffects.state.properties;
	// Set the initial copy value
	coeffects.updateState({
		path: 'currentFieldValue',
		value: `${trimString(title, 35)}_Copy`,
		operation: 'set'
	});
};

createCustomElement('sn-record-list-modal-save-as', {
	renderer: {
		type: snabbdom,
		view
	},
	initialState: {
		currentFieldValue: ''
	},
	properties: {
		title: {default: ''},
		listTitle: {default: ''},
		table: {default: ''},
		columns: {default: ''},
		query: {default: ''},
		conditions: {default: ''},
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
		},
		[COMPONENT_BOOTSTRAPPED]: {
			effect: bootstrappedEffect,
			stopPropagation: true
		}
	}
});
