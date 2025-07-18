import find from 'lodash/find';
import findIndex from 'lodash/findIndex';
import get from 'lodash/get';
import includes from 'lodash/includes';
import isEmpty from 'lodash/isEmpty';
import throttle from 'lodash/throttle';

import {POPOVER_OFFSET} from '../../constants';
import {
	BODY_OVERFLOW_CLASS,
	CELL_FILTERING,
	CELL_FILTERING_HEIGHT,
	CELL_FILTERING_WIDTH,
	COLUMN_FILTERING,
	COLUMN_FILTERING_WIDTH,
	COL_RESIZE_AMOUNT,
	COL_RESIZE_LARGE_AMOUNT,
	COL_RESIZE_MIN_WIDTH,
	DRAG_THROTTLE_AMOUNT,
	GLIDE_CURRENCY,
	GLIDE_FX_CURRENCY,
	GLIDE_JOURNAL,
	GLIDE_JOURNAL_INPUT,
	GLIDE_REFERENCE_TYPE,
	GLIDE_RELATED_TAGS,
	GLIDE_URL,
	GRID_POPOVER_TRIGGER_HEIGHT,
	GRID_POPOVER_TRIGGER_WIDTH,
	GRID_SET_COL_WIDTH,
	KEY_ARROW_LEFT,
	KEY_ARROW_RIGHT,
	KEY_PAGE_DOWN,
	KEY_PAGE_UP,
	LIST_UPDATE_COLUMNS_RESIZED,
	OPEN_RECORD
} from '../../constants';
import {getDefaultSortDirection} from '../list/listModifierUtils';
import {selectors} from '../nowGrid/recordDataTransform/recordDataTransform';
import {userPrefSelectors} from '../nowGrid/utils/userPreferenceUtils';

export const actionHandler = (
	evt,
	referenceRow,
	referenceTable,
	dispatch,
	row
) => {
	if (referenceTable) {
		dispatch(OPEN_RECORD, {
			evt,
			row: referenceRow,
			referenceTable
		});
	} else {
		dispatch(OPEN_RECORD, {
			evt,
			row
		});
	}
};

export const externalDBActionHandler = (
	evt,
	dbViewRow,
	externalTable,
	dispatch
) => {
	dispatch(OPEN_RECORD, {
		evt,
		row: dbViewRow,
		externalTable
	});
};

export function getColumnType(column) {
	const {
		columnData: {isChoice, internalType}
	} = column;

	switch (internalType) {
		case GLIDE_CURRENCY:
		case GLIDE_FX_CURRENCY:
		case 'price':
		case 'decimal':
		case 'float':
		case 'integer':
			if (!isChoice) {
				return 'numeric';
			}
			break;
	}
	return 'default';
}

const isSorted = (columnName, orderBy) => {
	if (!orderBy) return false;

	return columnName === orderBy.columnName;
};

export const getHeaderCellModel = (gridModel, orderBy, setSort) => {
	const columns = get(gridModel, 'allColumns', new Map());

	if (columns.length === 0) return columns;

	const sortOrder = isEmpty(orderBy) ? gridModel.tableConditions : orderBy;
	return columns.map(column => {
		const sortItem =
			find(sortOrder, {columnName: column.elementName}) || orderBy;
		const isColumnSorted = isSorted(column.elementName, sortItem);
		const isDescending = sortItem ? sortItem.isDescending : undefined;
		const defaultSort = getDefaultSortDirection(column.__typename);
		let isGrouped = false;
		if (gridModel.isGrouped && gridModel.groupColumn)
			isGrouped = column.elementName === gridModel.groupColumn;

		return {
			key: column.elementName,
			updateSort: setSort,
			column,
			isSorted: isColumnSorted,
			isDescending,
			defaultSort,
			isGrouped
		};
	});
};

export function getReferenceCellInfo(cell) {
	return {
		row: {
			__typename: cell.__typename.replace(
				'ReferenceFieldType',
				'TableResultsType'
			),
			sys_id: {
				value: cell.value,
				__typename: 'GlideRecord_FieldType_ID'
			}
		},
		table: cell.__typename.substring(31)
	};
}

export function getExternalDBInfo(cell, row, elementSysId) {
	const sysIdValue = elementSysId.uniqueId;

	return {
		row: {
			sys_id: {
				value: sysIdValue,
				__typename: 'GlideRecord_FieldType_ID'
			}
		}
	};
}

export function findOpenRecordIndex(gridModel, isRefList, isGridEmpty) {
	const columns = get(gridModel, 'columns', []);
	const cells = get(gridModel, 'data[0].cells', []);
	if (!isRefList && !isGridEmpty) {
		return findIndex(
			columns,
			o =>
				(o.columnData.internalType === GLIDE_FX_CURRENCY ||
					o.columnData.internalType !== GLIDE_URL) &&
				o.__typename !== GLIDE_REFERENCE_TYPE
		);
	} else if (isRefList && !isGridEmpty) {
		return findIndex(cells, o => o.isReference == 'false');
	}
}

export const getOffset = (el, type) => {
	let _x = 0;
	let _y = 0;
	while (
		el &&
		!isNaN(el.offsetLeft) &&
		!isNaN(el.offsetTop) &&
		!includes([...el.classList], BODY_OVERFLOW_CLASS)
	) {
		_x += el.offsetLeft - el.scrollLeft;
		_y += el.offsetTop - el.scrollTop;
		el = el.offsetParent;
	}

	const isColFilter = type === COLUMN_FILTERING;
	const isCellFilter = type === CELL_FILTERING;
	const filterWidth = isColFilter
		? COLUMN_FILTERING_WIDTH
		: isCellFilter
		? CELL_FILTERING_WIDTH
		: 0;
	const cellFilterBoundsY =
		_y - el.scrollTop + CELL_FILTERING_HEIGHT + GRID_POPOVER_TRIGGER_HEIGHT;

	if (
		(isCellFilter && cellFilterBoundsY > el.clientHeight) ||
		el.scrollHeight < _y + CELL_FILTERING_HEIGHT
	)
		_y = _y - CELL_FILTERING_HEIGHT - GRID_POPOVER_TRIGGER_HEIGHT;

	if (_x - filterWidth < el.scrollLeft || _x < filterWidth)
		_x += filterWidth - GRID_POPOVER_TRIGGER_WIDTH;

	return {top: _y + POPOVER_OFFSET, left: _x};
};

export const shouldHideFilterFromInternalType = internalType => {
	return (
		[
			GLIDE_JOURNAL_INPUT,
			GLIDE_JOURNAL,
			GLIDE_FX_CURRENCY,
			GLIDE_RELATED_TAGS
		].indexOf(internalType) !== -1
	);
};

export const renderEffect = ({
	action: {payload},
	state: {resizing},
	properties
}) => {
	const {host} = payload;
	const {columnWidths} = properties;

	const table = host.shadowRoot.querySelector('table');
	if (!isEmpty(columnWidths) && table.style.tableLayout !== 'fixed') {
		table.style.tableLayout = 'fixed';
	} else if (
		isEmpty(columnWidths) &&
		table.style.tableLayout !== 'auto' &&
		!resizing
	) {
		table.style.tableLayout = 'auto';
	}
};

export const onMouseDownColumnResizing = ({
	action: {
		payload: {event}
	},
	updateState,
	state: {
		initialWidths,
		properties: {columnWidths}
	},
	dispatch
}) => {
	const path = event.composedPath ? event.composedPath() : event.path;
	const element = path[0];
	if (!element.classList.contains('slider-visible')) return;

	const colHeader = element.closest('th');
	if (!colHeader) return;

	const {table, slider, headerRowCells} = getColumnResizingElements(colHeader);

	if (table.style.tableLayout !== 'fixed') {
		table.style.tableLayout = 'fixed';

		for (let i = 0; i < headerRowCells.length; i++)
			headerRowCells[i].style.width = `${initialWidths[i]}px`;
	}

	slider.classList.add('active');
	colHeader.classList.add('active');
	table.classList.add('resizing');

	const columnResizingGuide = element.parentElement.querySelector(
		'div.column-resize-guide'
	);

	if (!columnResizingGuide) return;

	const tableHeight = element.closest('#gridcontainer').clientHeight;
	columnResizingGuide.style.height = `${tableHeight}px`;

	const columnResizing = {
		initialX: event.clientX,
		initialWidth: colHeader.clientWidth,
		colID: colHeader.id
	};

	dispatch(LIST_UPDATE_COLUMNS_RESIZED, {columnsResized: true, columnWidths});
	updateState({
		columnResizing,
		resizing: true,
		colHeader: colHeader
	});
};

export const onMouseMoveColumnResizing = ({
	action: {
		payload: {event}
	},
	state: {resizing, columnResizing, colHeader}
}) => {
	if (!resizing) return;

	const {initialWidth, initialX} = columnResizing;
	const delta = event.clientX - initialX;
	let newWidth = initialWidth + delta;
	if (newWidth <= COL_RESIZE_MIN_WIDTH) newWidth = COL_RESIZE_MIN_WIDTH;

	const cssString = `${newWidth}px`;
	if (!colHeader) return;

	colHeader.style.width = cssString;
	colHeader.style.minWidth = cssString;
	colHeader.setAttribute('aria-valuenow', newWidth);
};

export const onMouseUpColumnResizing = ({
	action: {
		payload: {event}
	},
	state: {resizing, columnResizing, colHeader},
	dispatch,
	properties: {
		hideQuickEdit,
		hideRowSelector,
		gridModel: {
			tableMetadata: {isGrouped}
		}
	}
}) => {
	if (!resizing) return;

	const {initialX, initialWidth} = columnResizing;
	const delta = event.clientX - initialX;
	let newWidth = initialWidth + delta;

	if (newWidth <= COL_RESIZE_MIN_WIDTH) newWidth = COL_RESIZE_MIN_WIDTH;
	const cssString = `${newWidth}px`;
	const {slider, table} = getColumnResizingElements(colHeader);

	slider.classList.remove('active');
	colHeader.classList.remove('active');
	table.classList.remove('resizing');
	colHeader.style.width = cssString;
	colHeader.style.minWidth = cssString;
	colHeader.setAttribute('aria-valuenow', newWidth);

	const columnResizingGuide = colHeader.querySelector(
		'div.column-resize-guide'
	);

	if (!columnResizingGuide) return;
	columnResizingGuide.style.height = 0;

	updateColumnWidths({
		colHeader,
		newWidth,
		dispatch,
		hideQuickEdit,
		hideRowSelector,
		isGrouped
	});
};

export const onMouseMoveColumnResizingThrottled = throttle(
	onMouseMoveColumnResizing,
	DRAG_THROTTLE_AMOUNT
);

export const onKeyDownColumnResizing = ({
	action: {
		payload: {event}
	},
	dispatch,
	updateState,
	state: {initializedColumnWidths, initialWidths},
	properties: {
		hideQuickEdit,
		hideRowSelector,
		columnWidths,
		gridModel: {
			tableMetadata: {isGrouped}
		}
	}
}) => {
	const path = event.composedPath ? event.composedPath() : event.path;
	const element = path[0];
	if (!element.classList.contains('slider-visible')) return;

	const colHeader = element.closest('th');
	if (!colHeader) return;

	dispatch(LIST_UPDATE_COLUMNS_RESIZED, {columnsResized: true, columnWidths});

	const {table, headerRowCells} = getColumnResizingElements(colHeader);
	const initialWidth = colHeader.clientWidth;
	let newWidth;
	let preventDefault = true;

	if (!element.classList.contains('slider-visible')) return;

	switch (event.key) {
		case KEY_ARROW_LEFT:
			table.style.tableLayout = 'fixed';
			newWidth = initialWidth - COL_RESIZE_AMOUNT;
			if (newWidth <= COL_RESIZE_MIN_WIDTH) newWidth = COL_RESIZE_MIN_WIDTH;
			break;
		case KEY_ARROW_RIGHT:
			table.style.tableLayout = 'fixed';
			newWidth = initialWidth + COL_RESIZE_AMOUNT;
			break;
		case KEY_PAGE_UP:
			table.style.tableLayout = 'fixed';
			newWidth = initialWidth + COL_RESIZE_LARGE_AMOUNT;
			break;
		case KEY_PAGE_DOWN:
			table.style.tableLayout = 'fixed';
			newWidth = initialWidth - COL_RESIZE_LARGE_AMOUNT;
			if (newWidth <= COL_RESIZE_MIN_WIDTH) newWidth = COL_RESIZE_MIN_WIDTH;
			break;
		default:
			preventDefault = false;
	}

	if (preventDefault) event.preventDefault();
	else return;

	if (!initializedColumnWidths) {
		for (let i = 0; i < headerRowCells.length; i++)
			headerRowCells[i].style.width = `${initialWidths[i]}px`;

		updateState({
			initializedColumnWidths: true
		});
	}

	const cssString = `${newWidth}px`;

	colHeader.style.width = cssString;
	element.setAttribute('aria-valuenow', newWidth);

	updateColumnWidths({
		colHeader,
		newWidth,
		dispatch,
		hideQuickEdit,
		hideRowSelector,
		isGrouped
	});
};

const updateColumnWidths = ({
	colHeader,
	newWidth,
	dispatch,
	hideQuickEdit,
	hideRowSelector,
	isGrouped
}) => {
	let colCounter = 0;

	if (!colHeader) return;
	if (!hideQuickEdit) colCounter++;
	if (!hideRowSelector) colCounter++;
	if (isGrouped) colCounter++;

	const colIndex = colHeader.cellIndex - colCounter;
	dispatch(GRID_SET_COL_WIDTH, {newWidth, colIndex});
};

const getColumnResizingElements = colHeader => {
	const table = colHeader.closest('table');
	const slider = colHeader.querySelector('div.slider-visible');

	if (!table) return;

	const headerRowCells = table.querySelectorAll('th.list-column-header');
	if (!headerRowCells) return;

	return {table, slider, headerRowCells};
};

export const getShowHiddenControls = properties => {
	const userPreferences = selectors.getUserPreferences(properties);
	return userPrefSelectors.showHiddenControls(userPreferences);
};

export const getHiddenControlsClass = properties => {
	const showHiddenControls = getShowHiddenControls(properties);
	return showHiddenControls === 'true' ? ' always-show' : '';
};
