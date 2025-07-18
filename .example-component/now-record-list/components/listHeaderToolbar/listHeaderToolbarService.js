import cuid from 'cuid';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import {t} from 'sn-translate';

import {
	EDIT_COLS_BASE_URL,
	LIST_MENU_CRUD,
	LIST_RESET_COLUMN_WIDTH_REQUESTED,
	LIST_SAVE_REQUESTED,
	LIST_TYPES,
	LIST_UPDATE_COLUMNS_RESIZED,
	LIST_UPDATE_COLUMN_WIDTH_USER_PREF,
	METRIC_TRACKED,
	MODAL_TYPES,
	MY_LIST,
	OPEN_MODAL,
	PANEL_TYPE_FILTER,
	RECORD_LIST_NOTIFICATION_ADDED,
	REFRESH_LIST_MENU,
	SET_ORIGINAL_CONDITONS,
	UPDATE_PANEL
} from '../../constants';
import {SAVE_LIST_EVENT} from '../../utils/metrics/constants';
import {isEmpty} from '../../utils/utils';
import {trimString} from '../list/listUtils';
import {NotificationService} from '../modals/listExportModal/listExportService';

const renameItem = {
	title: t('Rename'),
	action: props => {
		rename(props);
	}
};

const editItem = {
	title: t('Edit columns'),
	action: props => {
		edit(props);
	}
};

const resetWidthsItem = {
	title: t('Reset widths'),
	action: props => {
		resetWidths(props);
	}
};

const saveItem = {
	title: t('Save'),
	action: props => {
		save(props);
	}
};

const saveAsItem = {
	title: t('Save as'),
	action: props => {
		saveAs(props);
	}
};

const deleteItem = {
	title: t('Delete'),
	action: props => {
		deleteList(props);
	}
};

function rename(props) {
	const {listTitle, dispatch} = props;
	dispatch(OPEN_MODAL, {
		modalProps: {
			type: MODAL_TYPES.RENAME_LIST,
			title: listTitle
		}
	});
}

function edit(props) {
	const {selectedListId: sys_id, dispatch, menuSelection} = props;
	const url = `${EDIT_COLS_BASE_URL}&menu_selection=${menuSelection}&list_id=${sys_id}`;
	dispatch(OPEN_MODAL, {
		modalProps: {
			type: MODAL_TYPES.EDIT,
			url
		}
	});
}

function resetWidths(props) {
	const {dispatch} = props;
	const opts = {columnWidths: []};
	dispatch(LIST_UPDATE_COLUMN_WIDTH_USER_PREF, opts);
	dispatch(LIST_UPDATE_COLUMNS_RESIZED, {
		columnsResized: false,
		columnWidths: []
	});
	dispatch(LIST_RESET_COLUMN_WIDTH_REQUESTED, opts);
}

function save(props) {
	const {
		dispatch,
		listTitle,
		table,
		columns,
		query,
		originalConditions,
		selectedListId,
		isWorkspace
	} = props;
	const opts = {
		timestamp: Date.now(),
		type: 'UPDATE',
		options: {conditions: isEmpty(query) ? '' : query}
	};

	const metadata = cloneDeep(opts);
	delete metadata.options;
	dispatch(METRIC_TRACKED, {eventName: SAVE_LIST_EVENT, metadata});
	if (isWorkspace) {
		dispatch(LIST_MENU_CRUD, opts);
	} else {
		dispatch(LIST_SAVE_REQUESTED, {
			timestamp: Date.now(),
			currentListData: {
				title: listTitle,
				table,
				columns,
				conditions: originalConditions,
				selectedListId
			},
			update: {
				conditions: query
			}
		});
	}
	dispatch(REFRESH_LIST_MENU, {refreshTimestamp: Date.now()});
	dispatch(RECORD_LIST_NOTIFICATION_ADDED, {
		alertList: [
			{
				id: `now_alert_positive_${cuid()}`,
				status: 'positive',
				content: {
					type: 'string',
					value: t('{0} was saved', listTitle)
				},
				action: {type: 'dismiss'}
			}
		]
	});
	dispatch(SET_ORIGINAL_CONDITONS);
	dispatch(UPDATE_PANEL, {
		panelType: PANEL_TYPE_FILTER,
		originalConditions: query
	});
}

function saveAs(props) {
	const {
		columns: columnsProp,
		listTitle,
		dispatch,
		table,
		query,
		listModel
	} = props;
	const conditions = isEmpty(query) ? '' : query;
	const title = trimString(listTitle, 35);

	// If columns is null (which is common in UIB), grab off the list model object which is the source of truth
	let columns = columnsProp;
	if (!columns) {
		const columnsMap = get(listModel, 'allColumns', new Map());
		columns = Array.from(columnsMap.keys()).join(',');
	}

	dispatch(OPEN_MODAL, {
		modalProps: {
			type: MODAL_TYPES.SAVE_AS,
			title,
			columns,
			table,
			conditions
		}
	});
}

export const exportList = props => {
	const {
		dispatch,
		table,
		columns,
		recordCount,
		query,
		view,
		userPreferences,
		workspaceConfigId
	} = props;

	let {
		limitNotifications,
		thresholdNotifications
	} = NotificationService.getNotifications(props);

	if (limitNotifications.length > 0) {
		dispatch(RECORD_LIST_NOTIFICATION_ADDED, {
			alertList: limitNotifications
		});
		return;
	}

	dispatch(OPEN_MODAL, {
		modalProps: {
			type: MODAL_TYPES.EXPORT,
			userPreferences,
			notifications: thresholdNotifications,
			table,
			columns,
			view,
			query,
			recordCount,
			workspaceConfigId
		}
	});
};

function deleteList(props) {
	const {dispatch} = props;
	dispatch(OPEN_MODAL, {
		modalProps: {
			type: MODAL_TYPES.DELETE_LIST
		}
	});
}

export function getOptions({
	menuSelection = '',
	hideColumnResizing,
	isListEditable,
	overrideHasDropdown,
	listType,
	hidePersonalization,
	hideOptionToSaveAs
}) {
	const listTypeDefaultCheck = listType === LIST_TYPES.DEFAULT;

	// Non Default (Simple and Related) lists would only have Edit Columns option wrt hidePersonlization value
	if (!listTypeDefaultCheck) return hidePersonalization ? [] : [editItem];

	if (overrideHasDropdown) return [resetWidthsItem];

	const columnResizeOption = !hideColumnResizing ? [resetWidthsItem] : [];

	if (!menuSelection)
		return hidePersonalization
			? columnResizeOption
			: [editItem, ...columnResizeOption];

	const options = [
		renameItem,
		saveItem,
		deleteItem,
		editItem,
		...columnResizeOption
	];

	if (!hideOptionToSaveAs) options.splice(2, 0, saveAsItem);

	if (menuSelection.indexOf(MY_LIST) !== -1 && isListEditable) return options;

	const finalOptions = hideOptionToSaveAs
		? [...columnResizeOption]
		: [saveAsItem, ...columnResizeOption];

	return hidePersonalization ? finalOptions : [editItem, ...finalOptions];
}

export function isTableSupported(
	menuSelection,
	hideColumnResizing,
	listType,
	hidePersonalization,
	overrideHasDropdown = false
) {
	return (
		getOptions({
			menuSelection,
			hideColumnResizing,
			overrideHasDropdown,
			listType,
			hidePersonalization
		}).length > 0
	);
}

export function getResetWidthsItem() {
	return resetWidthsItem;
}
export function cascadeDelete(props) {
	const {table, selectedRecords, isDBView, dispatch} = props;

	dispatch(OPEN_MODAL, {
		modalProps: {
			type: MODAL_TYPES.CASCADE_DELETE,
			table,
			selectedRecords,
			isDBView
		}
	});
}

export function importList(props) {
	const {dispatch} = props;
	dispatch(OPEN_MODAL, {
		modalProps: {...props, type: MODAL_TYPES.IMPORT}
	});
}
