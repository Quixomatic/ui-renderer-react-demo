import {querySelectorAllDeep} from '@devsnc/library-vtb-commons';
import gridCommons from '@servicenow/now-grid-commons';
import find from 'lodash/find';

import {GRID_BASE_SELECTOR} from '../../../behaviors/constants';
import querySelector from '../../../utils/querySelector';
import {SELECTED_COLOR_CLASS_NAME} from '../columnDragDrop/columnDragDrop';
import {TH_TAG_NAME} from '../constants';
import * as _recordDataPlugin from '../recordDataTransform/recordDataTransform';
import {getColumnDragDropIndexes} from '../utils/columnDragDropUtil';

const {
	dragDropColumnsPlugin: {BEHAVIOR_PATH}
} = gridCommons;

export const SELECTED_COLUMN_INDICATOR_CLASS = 'selected-column-indicator';
export const columnSelectionEffect = ({state, action, updateState, host}) => {
	const {path, shiftKey} = action.payload;
	const selectedElement = find(
		path,
		element => element.tagName === TH_TAG_NAME
	);
	if (!selectedElement) return;

	const gridNode = querySelector(GRID_BASE_SELECTOR, host);
	if (!gridNode) return;
	const columnHeaders = querySelectorAllDeep('th', gridNode, false);

	if (columnHeaders.length <= 0) return;

	const columnIndex = columnHeaders.findIndex(
		element => element === selectedElement
	);

	const coumnDragDropIndexes = getColumnDragDropIndexes(state);
	const {endingPoint, startingPoint} = coumnDragDropIndexes;
	let newEndingPoint = endingPoint;
	let newStartingPoint = startingPoint;

	if (shiftKey) {
		if (newStartingPoint === -1) newStartingPoint = columnIndex;
		newEndingPoint = columnIndex;
	} else {
		newStartingPoint = columnIndex;
		newEndingPoint = columnIndex;
	}

	const columns = getColumns(newStartingPoint, newEndingPoint, state);

	if (columns.length > 0) {
		const indicatorColumnField = columns[0];
		updateState({
			path: `${BEHAVIOR_PATH.join('.')}`,
			value: {
				selectedColumnFields: [...columns],
				indicatorColumnField,
				styleClass: SELECTED_COLOR_CLASS_NAME,
				indicatorColumnStyleClass: SELECTED_COLUMN_INDICATOR_CLASS,
				startingPoint: newStartingPoint,
				endingPoint: newEndingPoint
			},
			operation: 'set'
		});
	}
};

export const columnApplyColorEffect = ({state, action, updateState}) => {
	const {
		styleClass,
		indicatorColumnStyleClass,
		startingColumnIndex,
		endingColumnIndex
	} = action.payload;
	const selectedColumns = getColumns(
		startingColumnIndex,
		endingColumnIndex,
		state
	);
	const indicatorColumnField = selectedColumns[0];

	updateState([
		{
			path: `${BEHAVIOR_PATH.join('.')}`,
			value: {
				selectedColumnFields: [...selectedColumns],
				indicatorColumnField,
				styleClass,
				indicatorColumnStyleClass
			},
			operation: 'set'
		}
	]);
};

export const clearSelectedColumns = updateState => {
	updateState({
		path: `${BEHAVIOR_PATH.join('.')}`,
		value: {
			selectedColumnFields: [],
			indicatorColumnField: '',
			styleClass: '',
			indicatorColumnStyleClass: '',
			startingPoint: -1,
			endingPoint: -1
		},
		operation: 'set',
		shouldRender: false
	});
};

export const getColumns = (startingPoint, endingPoint, state) => {
	if (startingPoint === -1 && endingPoint === -1) return [];
	const left = Math.min(startingPoint, endingPoint);
	const right = Math.max(startingPoint, endingPoint);
	const selectedColums = [];
	for (let i = left; i <= right; i++) {
		const column = _recordDataPlugin.selectors.getColDefsFromBehavior(state)[i];
		if (column) selectedColums.push(column.field);
	}
	return selectedColums;
};
