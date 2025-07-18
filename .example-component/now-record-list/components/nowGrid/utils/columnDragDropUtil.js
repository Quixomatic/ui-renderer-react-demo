import gridCommons from '@servicenow/now-grid-commons';
import get from 'lodash/get';

import {getNonDroppableColumns} from '../columnDragDrop/columnDragDrop';
const {
	dragDropColumnsPlugin: {OPTIONS_PATH, BEHAVIOR_PATH}
} = gridCommons;

const GRAB_ICON_CLASSNAME = 'personalization-drag-handler';
const EMPTY_STRING = '';

export const getColumnDragDropClass = ({
	properties,
	hideColumnReorder,
	column
}) => {
	const colDragDrop = get(properties, OPTIONS_PATH, {
		selectedColumnFields: [],
		styleClass: ''
	});

	if (hideColumnReorder) return EMPTY_STRING;

	if (!Array.isArray(colDragDrop.selectedColumnFields)) return EMPTY_STRING;

	if (!colDragDrop.selectedColumnFields.includes(column.field))
		return EMPTY_STRING;

	return colDragDrop.styleClass;
};

export const getSelectedColumnIndicatorStyleClass = ({
	properties,
	hideColumnReorder,
	column
}) => {
	const indicatorColumnProp = get(properties, OPTIONS_PATH, {
		indicatorColumnField: '',
		indicatorColumnStyleClass: ''
	});

	if (hideColumnReorder) return EMPTY_STRING;

	if (indicatorColumnProp.indicatorColumnField !== column.field)
		return EMPTY_STRING;

	return indicatorColumnProp.indicatorColumnStyleClass;
};

export const getColumnDragDropIndexes = state => {
	const colDragDropIndexes = get(state, BEHAVIOR_PATH, {
		startingPoint: -1,
		endingPoint: -1
	});
	return colDragDropIndexes;
};

export const getGrabIcon = path =>
	path.find(element => element.className === GRAB_ICON_CLASSNAME);

export const isRTL = () => document.dir === 'rtl';

export const getHideColumnReorderFlagValue = properties =>
	get(properties, 'hideColumnReorder', true);

const getDroppableColumns = columns =>
	columns.filter(colId => !getNonDroppableColumns().includes(colId));

export const getUpdatedColumnsWidth = (
	columnsWidth,
	oldColumnsId,
	newColumnsId
) => {
	let newColumnsWidth = [];
	const validOldColumns = getDroppableColumns(oldColumnsId);
	const validNewColumns = getDroppableColumns(newColumnsId);
	let resetColumnsWidth = false;
	if (
		columnsWidth &&
		columnsWidth.length > 0 &&
		columnsWidth.length === validOldColumns.length
	) {
		const oldColumnsObj = {};
		validOldColumns.forEach((colId, index) => {
			oldColumnsObj[colId] = columnsWidth[index];
		});
		for (const key in validNewColumns) {
			const newCol = validNewColumns[key];
			const newColWidth = oldColumnsObj[newCol];
			if (newColWidth) {
				newColumnsWidth.push(newColWidth);
			} else {
				//new column not found. reset all column widths
				newColumnsWidth = [];
				break;
			}
		}

		if (
			newColumnsWidth.length === 0 ||
			validNewColumns.length !== validOldColumns.length
		) {
			//new columns added or deleted from List, reset column widths
			resetColumnsWidth = true;
		}
	}
	return {newColumnsWidth, resetColumnsWidth};
};
