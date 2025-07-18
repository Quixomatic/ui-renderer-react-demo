import {getAndResetRetainedScroll} from '@devsnc/sn-list-commons';
import {actionTypes} from '@servicenow/ui-core';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';

import {dirtyModalInterceptor} from '../../../behaviors/dirtyBehavior/dirtyBehavior';
import {
	CELL_FILTERING,
	CHECKBOX_CHECKED_SET,
	CLICK_HANDLER_POPOVER,
	COLUMN_FILTERING,
	COLUMN_WIDTHS_RESET_REQUESTED_PROP,
	COMPONENT_PROPERTY_CHANGED,
	GRID_ADD_GROUPBY,
	GRID_CHECKBOX_TOGGLED,
	GRID_CLOSE_POPOVER,
	GRID_MODEL_PROP,
	GRID_MODEL_UPDATED,
	GRID_OPEN_POPOVER,
	GRID_REMOVE_GROUPBY,
	GRID_RESET_COL_WIDTHS,
	GRID_SET_COL_WIDTH,
	GRID_SET_INITIAL_COL_WIDTHS,
	GRID_UPDATE_SORT,
	LAST_FORCED_RENDER_PROP,
	LIST_ADD_GROUPBY,
	LIST_REMOVE_GROUPBY,
	LIST_UPDATE_COLUMNS_RESIZED,
	LIST_UPDATE_COLUMN_WIDTH_USER_PREF,
	LIST_UPDATE_SORT,
	LOADING_PROP,
	MODEL_PATH,
	POPOVER_OFFSET,
	PROPERTIES_SET,
	UPDATE_COLPROPS_HEADERROWS
} from '../../../constants';
import {clearClickHandler} from '../../../utils/clickHandlerHelpers';
import {buildListHeader} from '../../gridHeader/gridHeaderHelper';
import {renderEffect} from '../gridUtils';

const {COMPONENT_BOOTSTRAPPED, COMPONENT_RENDERED} = actionTypes;
const closePopoverEffect = ({dispatch}) => {
	clearClickHandler(CLICK_HANDLER_POPOVER);
	dispatch(PROPERTIES_SET, {
		popover: {}
	});
};

const openPopoverEffect = ({dispatch, action, state}) => {
	const {type, context, location} = action.payload;

	if (
		type === COLUMN_FILTERING &&
		get(context, 'elementName', '') ===
			get(state, 'properties.popover.context.elementName')
	)
		return dispatch(GRID_CLOSE_POPOVER);

	if (
		type === CELL_FILTERING &&
		isEqual(context, get(state, 'properties.popover.context'))
	)
		return dispatch(GRID_CLOSE_POPOVER);

	dispatch(PROPERTIES_SET, {
		popover: {
			location: {
				top: location.top + POPOVER_OFFSET,
				left: location.left
			},
			type,
			context
		}
	});
};

const updateSortEffect = ({
	dispatch,
	action: {
		payload: {column, nextDirection}
	}
}) => {
	dispatch(LIST_UPDATE_SORT, {column, nextDirection});
};

const gridModelUpdatedEffect = ({state, dispatch}) => {
	const {listInstanceId} = state.properties;
	dispatch(PROPERTIES_SET, {checkedRowIndex: -1});
	getAndResetRetainedScroll(`${listInstanceId}_grid_overflow`);
};

const checkboxCheckedSetEffect = ({
	state: {properties},
	dispatch,
	action: {payload}
}) => {
	const {
		gridModel: {count},
		gridModel,
		checkedRowIndex,
		hideShiftRecordSelection
	} = properties;
	const rows = get(gridModel, MODEL_PATH.LAYOUT_QUERY.QUERY_ROWS, new Map());
	const allSysIdsOnPage = [...rows.keys()];

	if (dispatch) {
		const {checkedRowIndex: newCheckedRowIndex, shiftKey} = payload;
		let value = get(payload, 'value', '');

		if (shiftKey && checkedRowIndex >= 0) {
			const startIndex = Math.min(newCheckedRowIndex, checkedRowIndex);
			const endIndex = Math.max(newCheckedRowIndex, checkedRowIndex);

			value = allSysIdsOnPage.slice(startIndex, endIndex + 1);
		}

		dispatch(GRID_CHECKBOX_TOGGLED, {
			...payload,
			value,
			allSysIdsOnPage,
			totalRecordCount: count
		});

		if (!hideShiftRecordSelection) {
			dispatch(PROPERTIES_SET, {
				checkedRowIndex: newCheckedRowIndex
			});
		}
	}
};

const addGroupByEffect = ({dispatch, action}) => {
	dispatch(GRID_CLOSE_POPOVER);
	dispatch(LIST_ADD_GROUPBY, {
		field: action.payload.field
	});
};

const removeGroupByEffect = ({dispatch}) => {
	dispatch(GRID_CLOSE_POPOVER);
	dispatch(LIST_REMOVE_GROUPBY);
};

const updateColPropsHeaderRowsEffect = ({state, updateState}) => {
	const {
		properties: {
			hideQuickEdit,
			hideRowSelector,
			gridModel: {
				allColumns,
				isGrouped,
				layoutQuery: {hasSubColumns}
			}
		}
	} = state;

	const hasButtons = isGrouped || !hideQuickEdit || !hideRowSelector;

	if (hasSubColumns) {
		const {headerRows, newColumnProps} = buildListHeader(
			allColumns,
			hasButtons
		);
		let headerColumns = new Map();

		headerRows.forEach(row => {
			row.row.forEach((value, key) => headerColumns.set(key, value));
		});

		updateState({
			...state,
			columnProps: newColumnProps,
			headerRows,
			headerColumns
		});
	}
};

const colResizeEffect = ({
	state: {
		properties: {columnWidths},
		initialWidths
	},
	dispatch,
	action: {
		payload: {newWidth, colIndex}
	},
	updateProperties,
	updateState
}) => {
	const newColWidths = columnWidths.length === 0 ? initialWidths : columnWidths;
	newColWidths[colIndex] = newWidth;

	dispatch(LIST_UPDATE_COLUMN_WIDTH_USER_PREF, {
		columnWidths: newColWidths
	});
	updateProperties({columnWidths: newColWidths});
	updateState({resizing: false});
};

const colInitialWidthEffect = ({updateState, host}) => {
	const headers = host.shadowRoot.querySelectorAll('th.list-column-header');

	if (!headers) return;

	const initialWidths = Array.from(headers).map(header => header.clientWidth);

	updateState({
		initialWidths: initialWidths
	});
};

const resetColumnWidthsEffect = ({host, updateProperties, dispatch}) => {
	host.shadowRoot.querySelector('table').style.tableLayout = 'auto';
	host.shadowRoot.querySelector('table').classList.remove('resized');
	const headers = host.shadowRoot.querySelectorAll('th.list-column-header');
	for (let i = 0; i < headers.length; i++) {
		headers[i].style.width = 'auto';
		headers[i].style.minWidth = 'auto';
	}
	dispatch(GRID_SET_INITIAL_COL_WIDTHS);
	dispatch(LIST_UPDATE_COLUMNS_RESIZED, {
		columnsResized: false,
		columnWidths: []
	});
	updateProperties({columnWidths: []});
};

const handlePropertyChanged = ({
	action: {
		payload: {name, value, previousValue}
	},
	dispatch,
	updateState,
	state: {initialWidths = []}
}) => {
	if (name === COLUMN_WIDTHS_RESET_REQUESTED_PROP) {
		if (value.timestamp === previousValue.timestamp) return;
		dispatch(GRID_RESET_COL_WIDTHS, {});
	}
	if (name === GRID_MODEL_PROP) {
		dispatch(GRID_SET_INITIAL_COL_WIDTHS);
		dispatch(UPDATE_COLPROPS_HEADERROWS);
	}

	if (name === LOADING_PROP && value && initialWidths.length > 0)
		updateState({initialWidths: []});

	if (name === LAST_FORCED_RENDER_PROP) dispatch(GRID_SET_INITIAL_COL_WIDTHS);
};

export const actionHandlers = {
	[GRID_CLOSE_POPOVER]: {
		effect: closePopoverEffect
	},
	[GRID_OPEN_POPOVER]: {
		effect: openPopoverEffect
	},
	[GRID_UPDATE_SORT]: {
		effect: updateSortEffect,
		stopPropagation: true,
		interceptors: [dirtyModalInterceptor]
	},
	[GRID_MODEL_UPDATED]: {
		effect: gridModelUpdatedEffect,
		stopPropagation: true
	},
	[CHECKBOX_CHECKED_SET]: {
		effect: checkboxCheckedSetEffect
	},
	[GRID_ADD_GROUPBY]: {
		effect: addGroupByEffect,
		stopPropagation: true,
		interceptors: [dirtyModalInterceptor]
	},
	[GRID_REMOVE_GROUPBY]: {
		effect: removeGroupByEffect,
		stopPropagation: true,
		interceptors: [dirtyModalInterceptor]
	},
	[UPDATE_COLPROPS_HEADERROWS]: {
		effect: updateColPropsHeaderRowsEffect,
		stopPropagation: true
	},
	[GRID_SET_INITIAL_COL_WIDTHS]: {
		effect: colInitialWidthEffect
	},
	[GRID_SET_COL_WIDTH]: {
		effect: colResizeEffect
	},
	[GRID_RESET_COL_WIDTHS]: {
		effect: resetColumnWidthsEffect
	},
	[COMPONENT_BOOTSTRAPPED]: {
		effect: colInitialWidthEffect
	},
	[COMPONENT_PROPERTY_CHANGED]: {
		effect: handlePropertyChanged
	},
	[COMPONENT_RENDERED]: {
		effect: renderEffect
	}
};
