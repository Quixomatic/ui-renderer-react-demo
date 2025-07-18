import gridCommons from '@servicenow/now-grid-commons';
import get from 'lodash/get';
import set from 'lodash/set';

import {
	getColumnSizesArray,
	getColumnSizesArrayPath
} from '../columnResizing/colResizing';
import {
	clearSelectedColumns,
	getColumns
} from '../columnSelection/columnSelection';
import * as _recordDataPlugin from '../recordDataTransform/recordDataTransform';
import {
	getColumnDragDropIndexes,
	getHideColumnReorderFlagValue,
	getUpdatedColumnsWidth
} from '../utils/columnDragDropUtil';

export const LIGHT_COLOR_CLASS_NAME = 'column-selection-guide-light';
export const SELECTED_COLOR_CLASS_NAME = 'column-selection-guide';

const {
	dragDropColumnsPlugin: _dragDropColumnsPlugin,
	dragDropColumnsPlugin: {
		actions,
		onDragEndActionDefault,
		BEHAVIOR_PATH,
		PLUGIN_NAME
	}
} = gridCommons;

const getEnableColumnDragDrop = state => {
	// If the flag is not available in the particular list, hide personalization will be true
	return !getHideColumnReorderFlagValue(state.properties);
};

const getColumnDefsDataPath = () => _recordDataPlugin.selectors.getColDefPath();

const getColumnDefsOptionsPath = () =>
	_recordDataPlugin.selectors.getColDefOptionsPath();

const getColumnId = column => column.field;

const setColumnDefs = (state, colDefs, reorderedColumnDefs) => {
	if (reorderedColumnDefs.length > 0) {
		// Update colDef in options and behaviours.
		set(state, getColumnDefsDataPath(), [...reorderedColumnDefs]);
		set(state, getColumnDefsOptionsPath(), [...reorderedColumnDefs]);
	}
	return state;
};

const getColumnTitle = column => column.columnData.label;

const getSelectedColumns = state => {
	const {startingPoint, endingPoint} = getColumnDragDropIndexes(state);
	return getColumns(startingPoint, endingPoint, state);
};

export const getNonDroppableColumns = () => [
	'quick_edit',
	'row_selector',
	'group_toggle'
];

const onDragStartAction = ({selectedColumnIndex, state, updateState}) => {
	let selectedColumnFields = getSelectedColumns(state);
	const column = _recordDataPlugin.selectors.getColDefsFromBehavior(state)[
		selectedColumnIndex
	];

	// Apply light color for selected columns if the user starts dragging the selected color.
	if (!selectedColumnFields.includes(column.field))
		selectedColumnFields = [column.field];

	const colDragDropState = get(state, BEHAVIOR_PATH);
	updateState({
		path: `${BEHAVIOR_PATH.join('.')}`,
		value: {
			...colDragDropState,
			selectedColumnFields,
			indicatorColumnField: '',
			indicatorColumnStyleClass: '',
			styleClass: LIGHT_COLOR_CLASS_NAME
		},
		operation: 'set'
	});
};

const onDragEndAction = ({
	hoveredColumnIndex,
	destinationIndex,
	tableEl,
	draggableColumnSelector,
	onDragLeaveAction,
	event,
	updateState
}) => {
	clearSelectedColumns(updateState);
	onDragEndActionDefault({
		hoveredColumnIndex,
		destinationIndex,
		tableEl,
		draggableColumnSelector,
		onDragLeaveAction,
		event,
		updateState
	});
};

const onDropAction = ({
	state,
	dispatch,
	updateState,
	oldColumnsId,
	newColumnsId,
	reorderedColumnsId
}) => {
	const columnsWidth = getColumnSizesArray(state);
	const {newColumnsWidth} = getUpdatedColumnsWidth(
		columnsWidth,
		oldColumnsId,
		newColumnsId
	);
	dispatch(actions.COLUMNS_REORDERED, {
		newColumns: newColumnsId,
		oldColumns: oldColumnsId,
		reorderedColumns: reorderedColumnsId,
		newColumnsWidth
	});
	updateState([
		{
			path: getColumnSizesArrayPath(),
			value: newColumnsWidth,
			operation: 'set'
		},
		{
			path: 'isRendered',
			value: false,
			operation: 'set',
			shouldRender: false
		}
	]);
};

export function instantiatePlugin() {
	const dragDropColumnsPlugin = _dragDropColumnsPlugin.instantiatePlugin({
		selectors: {
			getEnabled: getEnableColumnDragDrop,
			getColumnDefsDataPath,
			getColumnId,
			getColumnTitle,
			getSelectedColumns,
			getNonDroppableColumns,
			setColumnDefs
		},
		handlers: {
			onDragStartAction,
			onDragEndAction,
			onDropAction
		}
	});

	return {
		transformState(state) {
			return dragDropColumnsPlugin.transformState({
				...state,
				options: {
					...state.options,
					[PLUGIN_NAME]: get(state, BEHAVIOR_PATH, {})
				}
			});
		},
		behavior: dragDropColumnsPlugin.behavior,
		options: dragDropColumnsPlugin.options
	};
}
