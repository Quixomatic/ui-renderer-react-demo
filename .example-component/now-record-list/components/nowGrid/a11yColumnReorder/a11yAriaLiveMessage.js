import get from 'lodash/get';
import {t} from 'sn-translate';

import {getNonDroppableColumns} from '../columnDragDrop/columnDragDrop';
import {COLUMN_GRAB_INSTRUCTIONS} from '../constants';

import {DIRECTION} from './a11yColumnReorder';

const getPreviousAndNextColumns = (columns, destinationPos, direction) => {
	let prevCol, nextCol;
	const getNextColumn = (columns, pos) =>
		get(columns[pos], 'columnMetadata.columnData.fullLabel', '');
	if (direction == DIRECTION.RIGHT) {
		if (destinationPos !== columns.length) {
			nextCol = getNextColumn(columns, destinationPos);
		}
		prevCol = getNextColumn(columns, destinationPos - 1);
	} else if (direction == DIRECTION.LEFT) {
		if (
			destinationPos >= 0 &&
			!getNonDroppableColumns().includes(columns[destinationPos].type)
		) {
			prevCol = getNextColumn(columns, destinationPos);
		}
		nextCol = getNextColumn(columns, destinationPos + 1);
	}
	return {
		nextCol,
		prevCol
	};
};

const getPosition = (
	columns,
	initialDestinationIndex,
	destinationColumnIndex
) => {
	const positionOffset = getPositionOffset(columns);
	return destinationColumnIndex <= initialDestinationIndex
		? destinationColumnIndex + 1 - positionOffset
		: destinationColumnIndex - positionOffset;
};

const getNonDroppableColumnHeaders = columns =>
	columns.filter(col => getNonDroppableColumns().includes(col.type));

const getPositionOffset = columns =>
	getNonDroppableColumnHeaders(columns).length;

const getColumnNames = (columns, startIdx, endIdx) => {
	let columnNames = [];
	for (let i = startIdx; i <= endIdx; i++) {
		columnNames.push(columns[i].columnMetadata.columnData.fullLabel);
	}
	return columnNames;
};

export const getTotalColumns = columns =>
	columns.length - getPositionOffset(columns);

export const getOnGrabLiveMessage = (
	columns,
	startingColumnIndex,
	endingColumnIndex
) => {
	let grabbedColumnNames;
	let grabbedColumnsAriaMsg = '';
	let grabbedColumnsPosition = '';
	const positionOffset = getPositionOffset(columns);
	const totalColumns = getTotalColumns(columns);
	if (startingColumnIndex === endingColumnIndex) {
		grabbedColumnsPosition = startingColumnIndex + 1 - positionOffset;
		grabbedColumnNames = getColumnNames(
			columns,
			startingColumnIndex,
			endingColumnIndex
		);
		grabbedColumnsAriaMsg = t(
			'{0} grabbed, {1} of {2}. {3}',
			grabbedColumnNames,
			grabbedColumnsPosition,
			totalColumns,
			COLUMN_GRAB_INSTRUCTIONS
		);
	} else {
		let startIdx, endIdx;
		if (startingColumnIndex > endingColumnIndex) {
			[startIdx, endIdx] = [endingColumnIndex, startingColumnIndex];
		} else {
			[startIdx, endIdx] = [startingColumnIndex, endingColumnIndex];
		}
		grabbedColumnNames = getColumnNames(columns, startIdx, endIdx);
		grabbedColumnsAriaMsg = t(
			'{0} grabbed, {1} to {2} of {3} {4}',
			grabbedColumnNames.join(','),
			startIdx + 1 - positionOffset,
			endIdx + 1 - positionOffset,
			totalColumns,
			COLUMN_GRAB_INSTRUCTIONS
		);
	}
	return grabbedColumnsAriaMsg;
};

export const getOnMoveLiveMessage = ({
	columns,
	destinationColumnIndex,
	direction,
	initialDestinationIndex
}) => {
	let prevAndNextCol;
	const totalColumns = getTotalColumns(columns);
	if (direction === DIRECTION.LEFT)
		prevAndNextCol = getPreviousAndNextColumns(
			columns,
			destinationColumnIndex - 1,
			direction
		);
	else if (direction === DIRECTION.RIGHT)
		prevAndNextCol = getPreviousAndNextColumns(
			columns,
			destinationColumnIndex,
			direction
		);
	const currentPosition = getPosition(
		columns,
		initialDestinationIndex,
		destinationColumnIndex
	);
	let ariaMsg = t(
		'Current position {0} of {1} ',
		currentPosition,
		totalColumns
	);
	if (prevAndNextCol.prevCol)
		ariaMsg += t(',after {0} ', prevAndNextCol.prevCol);
	if (prevAndNextCol.nextCol)
		ariaMsg += t(',before {0}', prevAndNextCol.nextCol);
	return ariaMsg;
};

export const getMultiSelectionLiveMessage = ({
	columns,
	isSelectionInitiated,
	columnIndex,
	endingColumnIndex
}) => {
	let selectionAriaMsg;
	if (!isSelectionInitiated) {
		selectionAriaMsg = t(
			'Grab columns from {0}',
			columnIndex + 1 - getPositionOffset(columns)
		);
	} else {
		selectionAriaMsg = t(
			'Column {0} selected',
			endingColumnIndex + 1 - getPositionOffset(columns)
		);
	}
	return selectionAriaMsg;
};

export const getOnDropLiveMessage = ({
	columns,
	startingColumnIndex,
	endingColumnIndex,
	destinationColumnIndex,
	initialDestinationIndex
}) => {
	let startIdx, endIdx;
	if (startingColumnIndex > endingColumnIndex) {
		[startIdx, endIdx] = [endingColumnIndex, startingColumnIndex];
	} else {
		[startIdx, endIdx] = [startingColumnIndex, endingColumnIndex];
	}
	const grabbedColumnNames = getColumnNames(columns, startIdx, endIdx);
	const currentPosition = getPosition(
		columns,
		initialDestinationIndex,
		destinationColumnIndex
	);
	return t(
		'{0} dropped at position {1}',
		grabbedColumnNames.join(','),
		currentPosition
	);
};

export const getOnEscapeLiveMessage = (
	columns,
	startingColumnIndex,
	endingColumnIndex
) => {
	const leftPosition = Math.min(startingColumnIndex, endingColumnIndex);
	const rightPosition = Math.max(startingColumnIndex, endingColumnIndex);
	const positionOffset = getPositionOffset(columns);
	const totalColumns = getTotalColumns(columns);
	const currentPosition = leftPosition + 1 - positionOffset;
	return t(
		'Drag and drop cancelled, {0} returned to {1} of {2}',
		rightPosition === leftPosition ? 'column' : 'columns',
		currentPosition,
		totalColumns
	);
};
