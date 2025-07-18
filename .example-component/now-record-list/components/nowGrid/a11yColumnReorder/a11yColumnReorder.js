import {closestDeep, querySelectorAllDeep} from '@devsnc/library-vtb-commons';
import gridCommons from '@servicenow/now-grid-commons';
import {actionTypes} from '@servicenow/ui-core';
import find from 'lodash/find';
import {t} from 'sn-translate';

import {CURRENT_FOCUS_STATE_PATH} from '../../../behaviors/actions/gridControlActions';
import {KEY, NOW_GRID_TAG} from '../../../behaviors/constants';
import {COLUMN_APPLY_COLOR} from '../../../constants';
import {
	LIGHT_COLOR_CLASS_NAME,
	SELECTED_COLOR_CLASS_NAME,
	getNonDroppableColumns
} from '../columnDragDrop/columnDragDrop';
import {
	getColumnSizesArray,
	getColumnSizesArrayPath
} from '../columnResizing/colResizing';
import {SELECTED_COLUMN_INDICATOR_CLASS} from '../columnSelection/columnSelection';
import {clearSelectedColumns} from '../columnSelection/columnSelection';
import {TABLE_TAG_NAME, TH_TAG_NAME} from '../constants';
import * as _recordDataPlugin from '../recordDataTransform/recordDataTransform';
import {
	getA11yColumnReorderIndexes,
	isElementInViewport,
	scrollIntoView
} from '../utils/a11yColumnReorderUtil';
import {getUpdatedColumnsWidth} from '../utils/columnDragDropUtil';

import {
	getMultiSelectionLiveMessage,
	getOnDropLiveMessage,
	getOnEscapeLiveMessage,
	getOnGrabLiveMessage,
	getOnMoveLiveMessage
} from './a11yAriaLiveMessage';

const {ARIA_LIVE_REGION_UPDATE_REQUESTED} = actionTypes;

const {
	dragDropColumnsPlugin: {
		actions,
		getCloneElement,
		removeColumnPlaceholderStyles,
		updateColumnPlaceholderStyles,
		clearCloneElement,
		getReorderedColumnDefsDataPathDefault
	}
} = gridCommons;

export const PLUGIN_NAME = 'a11yColumnReorder';
export const BEHAVIOR_PATH = ['behaviors', PLUGIN_NAME];
const getBehaviourPath = () => BEHAVIOR_PATH.join('.');
const getColumnId = column => column.field;

const isNondroppableColumn = column =>
	column && getNonDroppableColumns().includes(column.field);

const isRTL = () => document.dir === 'rtl';
export const DIRECTION = {
	RIGHT: 'Right',
	LEFT: 'Left'
};

const resetKeyboardColumnReorder = (closestTable, cloneId, updateState) => {
	removeColumnPlaceholderStyles({closestTable});
	clearCloneElement(`clone_${cloneId}`);
	updateState({
		path: getBehaviourPath(),
		value: {
			startingColumnIndex: -1,
			endingColumnIndex: -1,
			dragInitiated: false,
			destinationColumnIndex: -1
		},
		operation: 'set'
	});
};

let initialDestinationIndex;

export const a11yColumnReorderEffect = ({
	state,
	action,
	updateState,
	dispatch
}) => {
	const {path, event, cancel_reorder} = action.payload;
	const a11yColumnReorderState = getA11yColumnReorderIndexes(state);
	let {
		startingColumnIndex,
		endingColumnIndex,
		destinationColumnIndex,
		dragInitiated
	} = a11yColumnReorderState;

	const selectedElement = find(
		path,
		element => element.tagName === TH_TAG_NAME
	);
	if (destinationColumnIndex === undefined || !selectedElement) return;

	const gridNode = closestDeep(selectedElement, NOW_GRID_TAG);
	if (!gridNode) return;
	const columnHeaders = querySelectorAllDeep(TH_TAG_NAME, gridNode, false);

	if (columnHeaders.length <= 0) return;

	const columnIndex = columnHeaders.findIndex(
		element => element === selectedElement
	);
	const columns = _recordDataPlugin.selectors.getColDefsFromBehavior(state);
	const column = columns[columnIndex];

	let {
		columnMetadata: {
			columnData: {label: cloneLabel}
		}
	} = column;

	const closestTable = closestDeep(selectedElement, TABLE_TAG_NAME);

	if (startingColumnIndex !== endingColumnIndex) {
		const columnsCount = Math.abs(endingColumnIndex - startingColumnIndex) + 1;
		cloneLabel = t('{0} columns', columnsCount);
	}
	const left = Math.min(startingColumnIndex, endingColumnIndex);
	const right = Math.max(startingColumnIndex, endingColumnIndex);

	if (cancel_reorder) {
		resetKeyboardColumnReorder(closestTable, columnIndex, updateState);
		return;
	}
	const isSelectionInitiated = startingColumnIndex > -1;

	const updatePlaceholderStyles = (
		path,
		columnLabel,
		columnIndex,
		destinationColumnIndex,
		placeholderColumnIndex
	) => {
		const cloneElm = getCloneElement({
			path,
			columnLabel,
			cloneId: `clone_${columnIndex}`
		});
		if (destinationColumnIndex === 0) placeholderColumnIndex = 0;

		const placeholderCol = columnHeaders[placeholderColumnIndex];
		const placeholderColBoundingRect = placeholderCol.getBoundingClientRect();
		let placeholderColX = placeholderColBoundingRect.right;
		if (
			(destinationColumnIndex !== 0 && isRTL()) ||
			(destinationColumnIndex === 0 && !isRTL())
		)
			placeholderColX = placeholderColBoundingRect.left;

		cloneElm.style.left = `${placeholderColX -
			selectedElement.clientWidth / 2}px`;
		cloneElm.style.top = `${placeholderColBoundingRect.top}px`;

		const tableHeight = closestTable.clientHeight;
		removeColumnPlaceholderStyles({closestTable});
		updateColumnPlaceholderStyles({
			columnElementToUpdate: placeholderCol,
			hoveredColumnIndex: destinationColumnIndex,
			destinationIndex: destinationColumnIndex,
			tableHeight
		});
	};

	const checkForElementScroll = (scrollCondition, nextDroppableElem) => {
		const isElemInViewport = isElementInViewport(gridNode, nextDroppableElem);
		if (!isElemInViewport && scrollCondition) scrollIntoView(nextDroppableElem);
	};

	const updateDestinationColumn = (
		destinationColumnIndex,
		direction,
		nextDroppableElem,
		scrollCondition
	) => {
		if (nextDroppableElem)
			checkForElementScroll(scrollCondition, nextDroppableElem);
		updatePlaceholderStyles(
			path,
			cloneLabel,
			columnIndex,
			destinationColumnIndex,
			destinationColumnIndex - 1
		);
		updateState({
			path: `${getBehaviourPath()}.destinationColumnIndex`,
			value: destinationColumnIndex,
			operation: 'set'
		});

		const onMoveLiveMsg = getOnMoveLiveMessage({
			columns,
			destinationColumnIndex,
			direction: direction,
			initialDestinationIndex
		});

		dispatch(ARIA_LIVE_REGION_UPDATE_REQUESTED, {
			message: onMoveLiveMsg,
			type: 'assertive'
		});
	};

	const updateSelectedColumns = (
		startingColumnIndex,
		endingColumnIndex,
		nextDroppableElem,
		scrollCondition
	) => {
		if (nextDroppableElem)
			checkForElementScroll(scrollCondition, nextDroppableElem);
		updateState({
			path: getBehaviourPath(),
			value: {
				...a11yColumnReorderState,
				startingColumnIndex: startingColumnIndex,
				endingColumnIndex: endingColumnIndex
			},
			operation: 'set'
		});
		dispatch(COLUMN_APPLY_COLOR, {
			startingColumnIndex,
			endingColumnIndex,
			styleClass: SELECTED_COLOR_CLASS_NAME,
			indicatorColumnStyleClass: SELECTED_COLUMN_INDICATOR_CLASS
		});
		const columnSelectionLiveMsg = getMultiSelectionLiveMessage({
			columns,
			isSelectionInitiated,
			columnIndex,
			endingColumnIndex
		});
		dispatch(ARIA_LIVE_REGION_UPDATE_REQUESTED, {
			message: columnSelectionLiveMsg,
			type: 'assertive'
		});
	};

	const addAriaLiveMessage = message => {
		dispatch(ARIA_LIVE_REGION_UPDATE_REQUESTED, {
			message: message,
			type: 'assertive'
		});
		//remove live messages so that its not read by SR in scan/document mode afterwards
	};

	switch (event.key) {
		case KEY.ARROW_RIGHT:
			if (event.shiftKey) {
				if (dragInitiated || endingColumnIndex >= columnHeaders.length - 1)
					return;
				if (!isSelectionInitiated) {
					startingColumnIndex = columnIndex;
					endingColumnIndex = columnIndex;
				} else {
					endingColumnIndex++;
				}
				if (isNondroppableColumn(columns[endingColumnIndex])) return;
				const scrollCondition = endingColumnIndex < columnHeaders.length;
				const nextDroppableElem = columnHeaders[endingColumnIndex];
				updateSelectedColumns(
					startingColumnIndex,
					endingColumnIndex,
					nextDroppableElem,
					scrollCondition
				);
			} else {
				if (!dragInitiated || destinationColumnIndex >= columnHeaders.length)
					return;

				//Skip selectedColumns when moving by arrow keys
				if (destinationColumnIndex === left) destinationColumnIndex = right + 1;
				else destinationColumnIndex++;

				if (isNondroppableColumn(columns[destinationColumnIndex])) return;
				const scrollCondition = destinationColumnIndex !== columnHeaders.length;
				const nextDroppableElem = columnHeaders[destinationColumnIndex];
				updateDestinationColumn(
					destinationColumnIndex,
					DIRECTION.RIGHT,
					nextDroppableElem,
					scrollCondition
				);
			}
			event.stopPropagation();
			break;
		case KEY.ARROW_LEFT:
			if (event.shiftKey) {
				if (dragInitiated || (isSelectionInitiated && endingColumnIndex <= 0))
					return;
				if (!isSelectionInitiated) {
					startingColumnIndex = columnIndex;
					endingColumnIndex = columnIndex;
				} else {
					endingColumnIndex--;
				}
				if (isNondroppableColumn(columns[endingColumnIndex])) return;
				const scrollCondition = endingColumnIndex !== 0;
				const nextDroppableElem = columnHeaders[endingColumnIndex - 1];
				updateSelectedColumns(
					startingColumnIndex,
					endingColumnIndex,
					nextDroppableElem,
					scrollCondition
				);
			} else {
				if (!dragInitiated || destinationColumnIndex <= 0) return;

				//Skip selectedColumns when moving by arrow keys
				if (destinationColumnIndex === right + 1) destinationColumnIndex = left;
				else destinationColumnIndex--;

				if (isNondroppableColumn(columns[destinationColumnIndex])) return;
				const scrollCondition = destinationColumnIndex !== 0;
				const nextDroppableElem = columnHeaders[destinationColumnIndex - 1];
				updateDestinationColumn(
					destinationColumnIndex,
					DIRECTION.LEFT,
					nextDroppableElem,
					scrollCondition
				);
			}
			event.stopPropagation();
			break;
		case KEY.ENTER:
			if (!dragInitiated) {
				if (!isSelectionInitiated) {
					startingColumnIndex = columnIndex;
					endingColumnIndex = columnIndex;
				}
				initialDestinationIndex = Math.min(
					startingColumnIndex,
					endingColumnIndex
				);
				updateState({
					path: getBehaviourPath(),
					value: {
						startingColumnIndex: startingColumnIndex,
						endingColumnIndex: endingColumnIndex,
						dragInitiated: true,
						destinationColumnIndex: initialDestinationIndex
					},
					operation: 'set'
				});
				dispatch(COLUMN_APPLY_COLOR, {
					startingColumnIndex,
					endingColumnIndex,
					styleClass: LIGHT_COLOR_CLASS_NAME,
					indicatorColumnStyleClass: ''
				});
				const grabLiveMsg = getOnGrabLiveMessage(
					columns,
					startingColumnIndex,
					endingColumnIndex
				);
				dispatch(ARIA_LIVE_REGION_UPDATE_REQUESTED, {
					message: grabLiveMsg,
					type: 'assertive'
				});
			} else {
				clearSelectedColumns(updateState);
				resetKeyboardColumnReorder(closestTable, columnIndex, updateState);
				reorderColumns({
					columnIndex,
					selectedElement,
					startingColumnIndex,
					endingColumnIndex,
					destinationColumnIndex,
					state,
					dispatch,
					updateState
				});
				const dropLiveMsg = getOnDropLiveMessage({
					columns,
					startingColumnIndex,
					endingColumnIndex,
					destinationColumnIndex,
					initialDestinationIndex
				});
				addAriaLiveMessage(dropLiveMsg);
			}
			event.stopPropagation();
			break;
		case KEY.ESCAPE: {
			clearSelectedColumns(updateState);
			resetKeyboardColumnReorder(closestTable, columnIndex, updateState);
			if (dragInitiated) {
				const escapeLiveMessage = getOnEscapeLiveMessage(
					columns,
					startingColumnIndex,
					endingColumnIndex
				);
				addAriaLiveMessage(escapeLiveMessage);
			}
			break;
		}
	}
};

const reorderColumns = ({
	columnIndex,
	selectedElement,
	startingColumnIndex,
	endingColumnIndex,
	destinationColumnIndex,
	state,
	dispatch,
	updateState
}) => {
	const left = Math.min(startingColumnIndex, endingColumnIndex);
	const right = Math.max(startingColumnIndex, endingColumnIndex);

	if (destinationColumnIndex >= left && destinationColumnIndex <= right + 1)
		return;

	const columns = [
		..._recordDataPlugin.selectors.getColDefsFromBehavior(state)
	];

	const oldColumnsIds = columns.map(column => getColumnId(column));

	const selectedColumns = [];
	for (let i = left; i <= right; i++) {
		selectedColumns.push(columns[i]);
	}

	//push selectedColumns at destination and remove selectedColumns from original position
	columns.splice(destinationColumnIndex, 0, ...selectedColumns);

	if (destinationColumnIndex < left)
		columns.splice(left + selectedColumns.length, selectedColumns.length);
	else columns.splice(left, selectedColumns.length);

	const newColumnsId = columns.map(column => getColumnId(column));
	const reorderedColumnsId = selectedColumns.map(column => getColumnId(column));
	const nonDroppableColsCount = columns.filter(column =>
		isNondroppableColumn(column)
	).length;
	columns.forEach((column, colIndex) => {
		if (column.index >= 0) {
			column.index = colIndex - nonDroppableColsCount;
		}
	});
	const columnsWidth = getColumnSizesArray(state);
	const {newColumnsWidth} = getUpdatedColumnsWidth(
		columnsWidth,
		oldColumnsIds,
		newColumnsId
	);
	updateState([
		{
			path: getColumnSizesArrayPath(),
			value: newColumnsWidth,
			operation: 'set'
		},
		{
			path: getReorderedColumnDefsDataPathDefault().join('.'),
			value: [...columns],
			operation: 'set'
		},
		{
			path: 'isRendered',
			value: false,
			operation: 'set',
			shouldRender: false
		}
	]);

	dispatch(actions.COLUMNS_REORDERED, {
		newColumns: newColumnsId,
		oldColumns: oldColumnsIds,
		reorderedColumns: reorderedColumnsId,
		newColumnsWidth
	});
	const selectedColumnField = oldColumnsIds[columnIndex];
	const newFocus = {
		row: 0,
		cell: newColumnsId.indexOf(selectedColumnField),
		node: selectedElement
	};
	updateState([
		{
			operation: 'set',
			path: CURRENT_FOCUS_STATE_PATH,
			value: newFocus,
			shouldRender: false
		},
		{
			path: 'shouldFocusDraggedColumn',
			value: true,
			operation: 'set',
			shouldRender: false
		}
	]);
};
