import '@devsnc/sn-field-select';
import '@servicenow/now-modal';
import gridCommons from '@servicenow/now-grid-commons';
import {actionTypes} from '@servicenow/ui-core';
import {createCustomElement} from '@servicenow/ui-core';
import {createHttpEffect} from '@servicenow/ui-effect-http';
import snabbdom from '@servicenow/ui-renderer-snabbdom';
import isEmpty from 'lodash/isEmpty';
import {t} from 'sn-translate';

import {
	CLOSE_MODAL,
	FETCH_IS_PERSONALIZED_SUCCESS,
	FETCH_USER_PREFERENCE_SUCCESS,
	LIST_EDIT_COLUMN_REQUESTED,
	LIST_MENU_CRUD,
	LIST_TIMEAGO_RESET,
	LIST_WITHOUT_COLUMNS_RENDERED,
	LIST_WITH_PREFERENCE_RENDERED,
	METRIC_TRACKED,
	MODAL_ACTIONS,
	MY_LIST,
	WORKSPACE_LIST_COLUMN_ORDER
} from '../../constants';
import {EDIT_COLUMNS_EVENT} from '../../utils/metrics/constants';
import {getUpdatedColumnsWidth} from '../nowGrid/utils/columnDragDropUtil';

import styles from './styles.scss';

const {COMPONENT_BOOTSTRAPPED} = actionTypes;
const {
	dragDropColumnsPlugin: {actions}
} = gridCommons;
const getModalActions = isUserPersonalized => {
	const modalActions = [
		{
			id: 'save',
			variant: 'primary',
			label: t('Ok')
		},
		{
			id: 'cancel',
			variant: 'secondary',
			label: t('Cancel')
		},
		{
			id: 'restore',
			variant: 'tertiary',
			label: t('Restore to column defaults'),
			disabled: !isUserPersonalized
		}
	];
	return modalActions;
};
const isRelationship = relatedListName => relatedListName?.startsWith('REL:');

const MODAL_ACTION_IDS = {
	SAVE: 'save',
	RESTORE: 'restore'
};

const SN_SELECT_FIELD_SELECTED_ITEM_SET = 'SN_SELECT_FIELD#SELECTED_ITEM_SET';
const SN_SELECT_FIELD_ITEMS_REORDERED = 'SN_SELECT_FIELD#ITEMS_REORDERED';

const editModalTitle = t('Edit List');

const columnsNotChanged = (updatedColumns, selectedColumns) => {
	const newColIds = updatedColumns.map(col => col.id);
	const originalColIds = selectedColumns.map(col => col.id);
	return JSON.stringify(originalColIds) === JSON.stringify(newColIds);
};

const saveEditedColumns = (coeffects, restoreFlag = false) => {
	const {dispatch} = coeffects;
	const {
		listTitle,
		table,
		columns,
		originalConditions,
		selectedListId,
		isWorkspace,
		selectedColumns,
		selectedColumnsWidth
	} = coeffects.state.properties;

	let {updatedListColumns: updatedColumns} = coeffects.state;

	if (restoreFlag) updatedColumns = [];

	if (!updatedColumns || columnsNotChanged(updatedColumns, selectedColumns))
		return;

	const updatedColumnsValue = updatedColumns
		.reduce((columnsValue, col) => `${columnsValue}${col.id},`, '')
		.slice(0, -1);
	const opts = {
		timestamp: Date.now(),
		type: 'UPDATE',
		options: {columns: updatedColumnsValue}
	};

	dispatch(METRIC_TRACKED, {
		eventName: EDIT_COLUMNS_EVENT,
		metadata: opts,
		length: updatedColumns.length
	});

	if (isWorkspace) {
		dispatch(LIST_MENU_CRUD, opts);
	} else {
		dispatch(LIST_EDIT_COLUMN_REQUESTED, {
			timestamp: Date.now(),
			originalColumns: selectedColumns,
			currentListData: {
				title: listTitle,
				table,
				columns,
				conditions: originalConditions,
				selectedListId: selectedListId ? selectedListId : undefined
			},
			update: {
				columns: updatedColumnsValue
			}
		});
	}
	const oldColumnsId = selectedColumns.map(col => col.id);
	const newColumnsId = updatedColumns.map(col => col.id);
	const {newColumnsWidth, resetColumnsWidth} = getUpdatedColumnsWidth(
		selectedColumnsWidth,
		oldColumnsId,
		newColumnsId
	);

	dispatch(
		actions.COLUMNS_REORDERED,
		{
			newColumns: newColumnsId,
			oldColumns: oldColumnsId,
			newColumnsWidth,
			resetColumnsWidth
		},
		{shouldRefreshList: true}
	);
	dispatch(LIST_TIMEAGO_RESET, {timestamp: Date.now()});
	dispatch(CLOSE_MODAL);
};

const fetchIsPersonalizedForNonMyLists = createHttpEffect(
	'/api/now/ui/personalize_columns/:tableName',
	{
		method: 'GET',
		pathParams: ['tableName'],
		queryParams: [
			'sysparm_view',
			'sysparm_parent_table',
			'sysparm_relationship_id'
		],
		successActionType: FETCH_IS_PERSONALIZED_SUCCESS
	}
);

const fetchIsPersonalizedForListsWithPreferences = createHttpEffect(
	'/api/now/table/sys_user_preference',
	{
		method: 'GET',
		queryParams: ['sysparm_query'],
		successActionType: FETCH_USER_PREFERENCE_SUCCESS
	}
);

const getListID = state => {
	const {
		listModel: {tinyFields},
		selectedListId
	} = state.properties;
	if (selectedListId) return selectedListId;
	// for simple list and related list
	if (tinyFields.tinyUrl) return tinyFields.tinyUrl;
	return '';
};

const updateIsPersonalizedForConfiguredLists = ({state, dispatch}) => {
	const {
		properties: {userID}
	} = state;
	const listId = getListID(state);
	const preferenceName = `${WORKSPACE_LIST_COLUMN_ORDER}.${listId}`;
	dispatch(LIST_WITH_PREFERENCE_RENDERED, {
		sysparm_query: `name=${preferenceName}^user=${userID}`
	});
};

const footerActionClickedEffect = coeffects => {
	const {
		dispatch,
		action: {
			payload: {action}
		}
	} = coeffects;
	if (action) {
		const {id} = action;
		if (id === MODAL_ACTION_IDS.SAVE) {
			saveEditedColumns(coeffects);
		} else if (id === MODAL_ACTION_IDS.RESTORE) {
			saveEditedColumns(coeffects, true);
		}
	}
	dispatch(CLOSE_MODAL);
};

const getUserID = () => {
	if (window.NOW && window.NOW.user && window.NOW.user.userID)
		return window.NOW.user.userID;
	return '';
};

const view = state => {
	const {table, selectedColumns, hideDotwalk} = state.properties;
	const {isUserPersonalized} = state;
	const allowDotWalking = !hideDotwalk ? true : false;

	return (
		<now-modal
			size="lg"
			header-label={editModalTitle}
			manage-opened
			opened={true}
			footer-actions={getModalActions(isUserPersonalized)}>
			<div className="field-select-modal-msg">
				{t('Select columns and put them in the order you want.')}
			</div>
			<sn-field-select
				name="fieldSelectBasic"
				tableName={table}
				selectedItems={selectedColumns}
				allowDotWalking={allowDotWalking}
			/>
		</now-modal>
	);
};

createCustomElement('sn-record-list-modal-edit', {
	renderer: {
		type: snabbdom,
		view
	},
	properties: {
		url: {},
		listTitle: {default: ''},
		table: {default: ''},
		columns: {default: ''},
		selectedColumns: {default: []},
		selectedColumnsWidth: {default: []},
		hideDotwalk: {default: true},
		query: {default: ''},
		originalConditions: {default: ''},
		selectedListId: {default: ''},
		isWorkspace: {default: false},
		listModel: {default: ''},
		view: {default: ''},
		maxColumns: {default: ''},
		menuSelection: {default: ''},
		parentTable: {default: ''},
		userID: {default: getUserID()},
		relatedListName: {default: ''}
	},
	initialState: {
		updatedListColumns: null,
		isUserPersonalized: true
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
		[SN_SELECT_FIELD_ITEMS_REORDERED]: ({action, updateState}) => {
			updateState({
				path: 'updatedListColumns',
				value: action.payload.value,
				operation: 'set'
			});
		},
		[COMPONENT_BOOTSTRAPPED]: {
			effect({dispatch, state, updateState}) {
				const {
					view,
					menuSelection,
					table,
					columns,
					maxColumns,
					parentTable,
					relatedListName
				} = state.properties;
				//For my lists, columns property is updated for each personalization, giving us no way to know if the columns are personalized
				if (menuSelection.includes(MY_LIST)) {
					updateState({
						path: 'isUserPersonalized',
						value: false,
						operation: 'set'
					});
				}
				//maxColumns value is '0' as string when the user specifies 0 in the list configuration, null if left empty,0 as integer in Base AW
				else if (isEmpty(columns) && (maxColumns == '0' || !maxColumns)) {
					const relationshipId = isRelationship(relatedListName)
						? relatedListName
						: '';
					dispatch(LIST_WITHOUT_COLUMNS_RENDERED, {
						tableName: table,
						sysparm_view: view,
						sysparm_parent_table: parentTable,
						sysparm_relationship_id: relationshipId
					});
				} else {
					updateIsPersonalizedForConfiguredLists({state, dispatch});
				}
			}
		},
		[LIST_WITHOUT_COLUMNS_RENDERED]: fetchIsPersonalizedForNonMyLists,
		[FETCH_IS_PERSONALIZED_SUCCESS]: {
			effect: ({action, updateState}) => {
				updateState({
					path: 'isUserPersonalized',
					value: action.payload.result,
					operation: 'set'
				});
			}
		},
		[FETCH_USER_PREFERENCE_SUCCESS]: {
			effect: ({action, updateState}) => {
				const result = action.payload.result;
				if (!result.length || (result[0] && !result[0].value))
					updateState({
						path: 'isUserPersonalized',
						value: false,
						operation: 'set'
					});
			}
		},
		[LIST_WITH_PREFERENCE_RENDERED]: fetchIsPersonalizedForListsWithPreferences,
		[SN_SELECT_FIELD_SELECTED_ITEM_SET]: ({action, updateState}) => {
			updateState({
				path: 'updatedListColumns',
				value: action.payload.items,
				operation: 'set'
			});
		}
	},
	styles
});
