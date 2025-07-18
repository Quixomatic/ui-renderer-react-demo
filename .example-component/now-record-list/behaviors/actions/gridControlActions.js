import {
	activateFocusTrap,
	deactivateFocusTrap,
	findActiveElement,
	shadowQuerySelectorAll
} from '@devsnc/sn-list-commons';
import find from 'lodash/find';
import findIndex from 'lodash/findIndex';
import get from 'lodash/get';
import includes from 'lodash/includes';
import intersection from 'lodash/intersection';
import isEmpty from 'lodash/isEmpty';
import last from 'lodash/last';
import range from 'lodash/range';
import xor from 'lodash/xor';

import {groupNumsSequentially} from '../../components/list/actions/utils';
import {clearSelectedColumns} from '../../components/nowGrid/columnSelection/columnSelection';
import {getGrabIcon} from '../../components/nowGrid/utils/columnDragDropUtil';
import {EMPTY_BULK_FOCUS} from '../../constants';
import querySelector from '../../utils/querySelector';
import {
	ALLOW_CURRENT_TABBABLE,
	BULK_FOCUS_STATE_PATH,
	CELL_SELECTOR,
	GRID_BASE_SELECTOR,
	GRID_CONTROL_BEHAVIOR_NAME,
	GRID_RERENDER_PROPERTIES,
	KEY,
	NOW_GRID_BULK_FOCUSED_IDS,
	ROW_SELECTOR,
	TABINDEX_SELECTOR,
	UPDATE_TABBABLES,
	TD_SELECTOR,
	NOW_GRID_SCROLL_CONTAINER_SELECTOR,
	FOCUS_RESET
} from '../constants';

const GRID_STATE_PATH = `behaviors.${GRID_CONTROL_BEHAVIOR_NAME}.grid`;
const TRAPCELL_STATE_PATH = `behaviors.${GRID_CONTROL_BEHAVIOR_NAME}.trapcell`;
const GROUPED_SUFFIX = '-grouped';
export const CURRENT_FOCUS_STATE_PATH = `behaviors.${GRID_CONTROL_BEHAVIOR_NAME}.currentFocus`;
export const SHOULD_FOCUS_SORTED_STATE_PATH = `behaviors.${GRID_CONTROL_BEHAVIOR_NAME}.shouldFocusSortedColumn`;

export const getState = state =>
	get(state, `behaviors.${GRID_CONTROL_BEHAVIOR_NAME}`, {});

export const getCellFromGrid = ({grid, currentFocus}) => {
	const {row, cell} = currentFocus;
	const bulkFocusRowNode = get(grid, `rows[${row}]`, undefined);

	if (!bulkFocusRowNode) return;

	const bulkFocusRowNodeCells = bulkFocusRowNode.cells;
	if (isEmpty(bulkFocusRowNodeCells)) return;

	/* Edge case in for grouped lists. Group lists row has 2 cells with
	 the second cell having a large colspan. If on row 3 col 4 and navigating up,
	 cell 4 does not exist on group row, so we have to make sure we take the last
	 cell on the group row

	 |col1|col2|col3|col4|col5| row 1
	 |    | GROUP ROW         | row 2
	 |col1|col2|col3|col4|col5| row 3
	 |col1|col2|col3|col4|col5| row 4
	 |col1|col2|col3|col4|col5| row 5
	 |    | GROUP ROW         | row 6
	 |col1|col2|col3|col4|col5| row 7
	*/
	return get(bulkFocusRowNodeCells, `[${cell}]`, last(bulkFocusRowNodeCells));
};

/**
 * we need to show tooltip on focus when the data is truncated
 * here we are dispatching focusin event,
 * which is going to be listened by tooltip behaviour to show tooltip
 */
const handleTruncatedTextFocus = node => {
	let truncatedTextNode = node.querySelector('.-truncated');
	if (!truncatedTextNode) {
		const wordWrapTextNode = node.querySelector('.-wordwrap');
		if (wordWrapTextNode && wordWrapTextNode.dataset.truncationtext) {
			truncatedTextNode = wordWrapTextNode;
		}
	}
	if (truncatedTextNode) {
		let focusInEvent = new Event('focusin');
		node.addEventListener('focusout', () => {
			let focusOutEvent = new Event('focusout');
			// to remove tooltip
			truncatedTextNode.dispatchEvent(focusOutEvent);
		});
		// to show tooltip
		truncatedTextNode.dispatchEvent(focusInEvent);
	}
};

const addIndexAndFocus = (node, shouldFocus = true) => {
	if (!node) return;
	node.scrollIntoView({block: 'nearest'});
	node.tabIndex = 0;
	if (shouldFocus) {
		node.focus();
		handleTruncatedTextFocus(node);
	}
};

/**
 * If a cell contains only one tabbable item (excluding the cell actions button),
 * it will be returned. This is applicable for reference link cells on a simple
 * list, where the only tabbable item is the link itself.
 */
export const getCellImmediateFocusNode = cell => {
	if (cell?.tabbables?.length !== 1) return null;

	if (!cell.tabbables[0].dataset.ancillary) {
		return cell.tabbables[0];
	}

	return null;
};

export const shouldCellImmediateFocus = cell => {
	if (!cell || !cell.tabbables) return false;

	// Ancillary tabbables shouldn't take immediate default focus (i.e. dropdown button)
	return cell.tabbables.length === 1 && !cell.tabbables[0].dataset.ancillary;
};

export const updateTabbablesEffect = ({
	action,
	dispatch,
	updateState,
	host
}) => {
	const {
		payload: {skipRefocus}
	} = action;
	const newGrid = {rows: []};
	const gridhost = querySelector(GRID_BASE_SELECTOR, host);
	if (!gridhost) return;

	const rows = shadowQuerySelectorAll(gridhost, ROW_SELECTOR);

	for (let i = 0; i < rows.length; i++) {
		const row = {
			node: rows[i],
			cells: []
		};

		const cells = shadowQuerySelectorAll(rows[i], CELL_SELECTOR);
		for (let j = 0; j < cells.length; j++) {
			const tabbables = shadowQuerySelectorAll(cells[j], TABINDEX_SELECTOR);

			const cell = {
				node: cells[j],
				tabbables
			};

			for (let k = 0; k < tabbables.length; k++) {
				const tabbable = tabbables[k];
				if (skipRefocus && tabbable.tabIndex === 0) continue;
				tabbable.tabIndex = -1;
				tabbable.blur();
				tabbable.setAttribute('data-manualtabindex', true);
			}

			row.cells.push(cell);
		}

		newGrid.rows.push(row);
	}

	updateState({
		operation: 'set',
		path: GRID_STATE_PATH,
		value: newGrid,
		shouldRender: false
	});

	if (skipRefocus) return;
	dispatch(ALLOW_CURRENT_TABBABLE);
};

export const allowCurrentFocusEffect = ({action, state, updateState}) => {
	const {grid, currentFocus, trapcell} = getState(state);
	const {
		payload: {index = 0}
	} = action;
	const focusCell = getCellFromGrid({grid, currentFocus});

	let focusNode;
	if (focusCell && shouldCellImmediateFocus(focusCell))
		focusNode = focusCell.tabbables[0];
	else if (focusCell) focusNode = focusCell.node;

	if (!focusNode) return;

	focusNode.tabIndex = index;
	updateState({
		operation: 'set',
		path: CURRENT_FOCUS_STATE_PATH,
		value: {
			...currentFocus,
			node: focusNode
		}
	});

	// If a cell was trapped when the table refreshed, we should return focus
	// to the trapped cell in the table so focus on the page isn't lost.
	if (trapcell) {
		trapcell.node.classList.remove('active');

		updateState({
			operation: 'set',
			path: TRAPCELL_STATE_PATH,
			value: undefined,
			shouldRender: false
		});

		setNewFocus({
			currentFocus: {},
			newFocus: {
				...currentFocus,
				node: focusNode
			},
			updateState
		});
	}
};

/**
 *	Function used to return valid information used for bulk inline editing
 *
 * @param {object} grid Object containing array of rows and cells within each row used for keyboard navigation
 * @param {number} rowIndex row index of newly focused cell
 * @param {number} cellIndex cell index of newly focused cell
 *
 * @returns {object} Returns newly focused row node, cell node, and whether it is a valid cell or not
 */
export const getBulkFocusInfo = (grid, rowIndex, cellIndex) => {
	const focusedRow = get(grid, `rows[${rowIndex}]`);
	const focusedCell = get(focusedRow, `cells[${cellIndex}]`);
	const rowClassList = get(focusedRow, 'node.classList');
	const cellClassList = get(focusedCell, 'node.classList');

	const isHeaderCell = get(focusedCell, 'node.nodeName') === 'TH';

	const isRowGroupedHeader =
		rowClassList && rowClassList.contains('grouped-header');

	const isGroupToggleCell =
		cellClassList && cellClassList.contains(GROUPED_SUFFIX);

	const isQuickEditCell =
		focusedCell && focusedCell.node.querySelector('.quick-edit-button');

	const isRowSelectorCell =
		focusedCell && focusedCell.node.querySelector('.sn-grid-checkbox');

	const isValidCell =
		!isHeaderCell &&
		!isRowGroupedHeader &&
		!isQuickEditCell &&
		!isRowSelectorCell &&
		!isGroupToggleCell;

	return {
		focusedRow,
		focusedCell,
		isValidCell
	};
};

/**
 *	Function used to clear bulk editing styles.
 *
 * @param {object} nearestTable html node of nearest table
 *
 * @returns {void}
 */
export const removeBulkStyles = nearestTable => {
	nearestTable
		.querySelectorAll(
			'.-sideBorder, .-topAndSideBorder, .-bottomAndSideBorder, .-topBottomAndSideBorder'
		)
		.forEach(node => {
			node.classList.remove('-sideBorder');
			node.classList.remove('-topAndSideBorder');
			node.classList.remove('-bottomAndSideBorder');
			node.classList.remove('-topBottomAndSideBorder');
			node.classList.remove('-selected');
		});
};

/**
 *	Function used to clear and update bulk editing styles.
 *
 * @param {array} newIndicies array of new indicies to select
 * @param {object} grid Object containing array of rows and cells within each row used for keyboard navigation
 * @param {number} newCellIndex newly focused cell index
 *
 * @returns {void}
 */
export const updateBulkStyles = (newIndices, grid, newCellIndex) => {
	// Clear styles on previous focused cells
	const firstNode = get(grid, 'rows[0].cells[0].node');
	if (firstNode) {
		const nearestTable = firstNode.closest('TABLE');
		removeBulkStyles(nearestTable);
	}

	const partitionedRows = groupNumsSequentially(newIndices);

	// Set new styles based on new focused array
	partitionedRows.forEach(group => {
		group.forEach((gridIndex, index, group) => {
			const gridRow = get(
				grid,
				`rows[${gridIndex}].cells[${newCellIndex}].node`
			);
			if (group.length === 1) {
				gridRow.classList.add('-topBottomAndSideBorder');
			} else if (index === 0) {
				gridRow.classList.add('-topAndSideBorder');
			} else if (index === group.length - 1) {
				gridRow.classList.add('-bottomAndSideBorder');
			} else {
				gridRow.classList.add('-sideBorder');
			}

			gridRow.classList.add('-selected');
		});
	});
};

/**
 *	Function used to update single bulk focusing state
 *
 * @param {object} grid Object containing array of rows and cells within each row used for keyboard navigation
 * @param {array} rowIndex new row index of focused cell
 * @param {array} cellIndex new cell index of focused cell
 * @param {function} updateState function to update state
 *
 * @returns {void}
 */
export const updateSingleInlineFocus = (
	grid,
	rowIndex,
	cellIndex,
	updateState
) => {
	let {isValidCell, focusedRow} = getBulkFocusInfo(grid, rowIndex, cellIndex);
	let stateUpdate = {};
	if (isValidCell) {
		const rowSysId = get(focusedRow, 'node.dataset.id');
		stateUpdate = {
			focusedSysIds: [rowSysId],
			focusedIndicies: [rowIndex],
			previousSysId: rowSysId
		};
	}
	if (!focusedRow) return;

	const nearestTable = focusedRow.node.closest('TABLE');
	if (!nearestTable) return;

	nearestTable.setAttribute(
		NOW_GRID_BULK_FOCUSED_IDS,
		get(stateUpdate, 'focusedSysIds', []).join(',')
	);

	updateState({
		path: BULK_FOCUS_STATE_PATH,
		value: stateUpdate,
		operation: 'set',
		shouldRender: false
	});
};

/*
 * This function handles the case where a user is navigating up via keyboard and the row is hidden by the column
 * header. We check to see if the cell we are moving focus to has any part hidden behind the column header. If so
 * then we calculate how much to scroll the container down so that the cell is fully visible.
 */

const scrollTableUpIfNeeded = (newFocus, grid) => {
	const {node: cellNode, cell: cellNum} = newFocus;
	if (!cellNode || cellNode.tagName !== TD_SELECTOR) {
		return;
	}

	const cellRect = cellNode.getBoundingClientRect();
	const colHeaderNode = get(grid, `rows[0].cells[${cellNum}].node`);
	const colHeaderRect = colHeaderNode.getBoundingClientRect();

	const isCellNodeHidden = colHeaderRect.bottom > cellRect.top;

	if (isCellNodeHidden) {
		const scrollContainer = cellNode.closest(
			NOW_GRID_SCROLL_CONTAINER_SELECTOR
		);

		// the amount of pixels that the cell is hidden by the column header
		const scrollAmount = colHeaderRect.bottom - cellRect.top;

		scrollContainer.scrollTop -= scrollAmount;
	}
};

export const moveFocusEffect = ({action, state, updateState}) => {
	const localState = getState(state);
	const {grid, currentFocus} = localState;
	const {
		payload: {key, shiftKey}
	} = action;
	const {
		properties: {popover, inlineEditingEnabled},
		bulkFocus: {focusedSysIds = [], focusedIndicies = [], previousSysId}
	} = state;
	const newFocus = {...currentFocus};

	if (!isEmpty(popover)) return;

	let bulkRows = focusedSysIds;
	let bulkRowIndices = focusedIndicies;
	let rowSysId;
	let focusedRow, isValidCell;

	switch (key) {
		case KEY.UP:
		case KEY.DOWN: {
			/**
			 * Regular Keyboard Navigation
			 */
			const focusIncrement = key === KEY.DOWN ? 1 : -1;
			let newRowFocus = currentFocus.row + focusIncrement;
			if (newRowFocus < 0 || newRowFocus > grid.rows.length - 1) return; // Movement Out of Bounds

			if (key === KEY.UP) {
				scrollTableUpIfNeeded(newFocus, grid);
			}

			/**
			 * Inline editing focus navigation
			 */
			if (inlineEditingEnabled) {
				if (shiftKey) {
					do {
						({focusedRow, isValidCell} = getBulkFocusInfo(
							grid,
							newRowFocus,
							currentFocus.cell
						));

						if (!isValidCell) {
							newRowFocus += focusIncrement;
							if (newRowFocus < 0 || newRowFocus > grid.rows.length - 1) return; // Movement Out of Bounds
						}
					} while (!isValidCell);

					rowSysId = get(focusedRow, 'node.dataset.id');

					if (includes(bulkRows, rowSysId)) {
						bulkRows = xor(bulkRows, [previousSysId]);
						bulkRowIndices = xor(bulkRowIndices, [currentFocus.row]);
					} else {
						bulkRows = xor(bulkRows, [rowSysId]);
						bulkRowIndices = xor(bulkRowIndices, [newRowFocus]);
					}

					if (!focusedRow) return;

					const nearestTable = focusedRow.node.closest('TABLE');
					if (!nearestTable) return;

					nearestTable.setAttribute(
						NOW_GRID_BULK_FOCUSED_IDS,
						bulkRows.join(',')
					);

					updateBulkStyles(bulkRowIndices, grid, newFocus.cell);

					updateState({
						path: BULK_FOCUS_STATE_PATH,
						value: {
							focusedSysIds: bulkRows,
							focusedIndicies: bulkRowIndices,
							previousSysId: rowSysId,
							colIndex: currentFocus.cell
						},
						operation: 'set',
						shouldRender: false
					});
				} else {
					updateSingleInlineFocus(
						grid,
						newRowFocus,
						currentFocus.cell,
						updateState
					);
					updateBulkStyles([], grid, 0);
				}
			}
			newFocus.row = newRowFocus;
			break;
		}
		case KEY.LEFT:
		case KEY.RIGHT: {
			let newCellFocus;
			if (key === KEY.RIGHT) {
				newCellFocus = currentFocus.cell + 1;
				if (newCellFocus > grid.rows[currentFocus.row].cells.length - 1) return;
			} else {
				// Edge case for grouping. If current focus is already out of bounds of the grouped cell,
				// set to last index of current row.
				newCellFocus = currentFocus.cell;
				const cellFocusLength = grid.rows[currentFocus.row].cells.length;
				if (newCellFocus >= cellFocusLength) newCellFocus = cellFocusLength - 1;

				newCellFocus -= 1;
				if (newCellFocus < 0) return;
			}
			newFocus.cell = newCellFocus;
			if (inlineEditingEnabled) {
				updateSingleInlineFocus(
					grid,
					currentFocus.row,
					newCellFocus,
					updateState
				);
				updateBulkStyles([], grid, 0);
			}
			break;
		}
		case KEY.PAGE_UP: {
			newFocus.row = 0;
			if (inlineEditingEnabled) {
				updateSingleInlineFocus(
					grid,
					newFocus.row,
					currentFocus.cell,
					updateState
				);
				updateBulkStyles([], grid, 0);
			}
			break;
		}
		case KEY.PAGE_DOWN: {
			newFocus.row = grid.rows.length - 1;
			if (inlineEditingEnabled) {
				updateSingleInlineFocus(
					grid,
					newFocus.row,
					currentFocus.cell,
					updateState
				);
				updateBulkStyles([], grid, 0);
			}
			break;
		}
		case KEY.HOME: {
			newFocus.cell = 0;
			if (inlineEditingEnabled) {
				updateSingleInlineFocus(
					grid,
					currentFocus.row,
					newFocus.cell,
					updateState
				);
				updateBulkStyles([], grid, 0);
			}
			break;
		}
		case KEY.END: {
			newFocus.cell = grid.rows[currentFocus.row].cells.length - 1;
			if (inlineEditingEnabled) {
				updateSingleInlineFocus(
					grid,
					currentFocus.row,
					newFocus.cell,
					updateState
				);
				updateBulkStyles([], grid, 0);
			}
			break;
		}
		default:
			return;
	}

	const cell = getCellFromGrid({grid, currentFocus: newFocus});
	const quickEditCell = cell.node.querySelector('.quick-edit-button');
	const rowSelectorCell = cell.node.querySelector('.sn-grid-checkbox-native');
	const selectAllSelector = querySelector(
		'now-table-checkbox >>> .sn-grid-checkbox-native',
		cell.node
	);
	const groupedButtonCell =
		cell.node.className === GROUPED_SUFFIX &&
		querySelector('now-button >>> button', cell.node);

	if (key === KEY.UP) {
		scrollTableUpIfNeeded({...newFocus, node: cell.node}, grid);
	}

	if (quickEditCell) {
		newFocus.node = quickEditCell;
	} else if (rowSelectorCell) {
		newFocus.node = rowSelectorCell;
	} else if (groupedButtonCell) {
		newFocus.node = groupedButtonCell;
	} else if (selectAllSelector) {
		newFocus.node = selectAllSelector;
	} else {
		newFocus.node = cell.node;
	}

	if (!currentFocus.node) currentFocus.node = cell.node;
	setNewFocus({currentFocus, newFocus, updateState});
};

export const setNewFocus = ({
	currentFocus,
	newFocus,
	updateState,
	shouldFocus = true
}) => {
	// Remove tabIndex from previous node
	if (currentFocus.node) currentFocus.node.tabIndex = -1;

	updateState({
		operation: 'set',
		path: CURRENT_FOCUS_STATE_PATH,
		value: newFocus,
		shouldRender: false
	});

	addIndexAndFocus(newFocus.node, shouldFocus);
};

export const focusEnterCellEffect = ({dispatch, state, updateState}) => {
	const {grid, currentFocus} = getState(state);
	const cell = getCellFromGrid({grid, currentFocus});

	/**
	 * If no tabbables were found but the user is attempting to focus the cell,
	 * perform a check to see if the tabbables are outdated. If so, allow the
	 * user to trap focus into this cell, and update the tabbables for future
	 * reference.
	 */

	if (!cell.tabbables?.length) {
		const tabbables = shadowQuerySelectorAll(cell.node, TABINDEX_SELECTOR);

		if (tabbables.length === 0) return;

		cell.tabbables = tabbables;

		dispatch(UPDATE_TABBABLES, {skipRefocus: true});
	}

	cell.node.classList.add('active');
	cell.tabbables.forEach(node => (node.tabIndex = 0));

	activateFocusTrap('gridCell', cell.node, {
		firstElement: cell.tabbables[0],
		lastElement: cell.tabbables[cell.tabbables.length - 1]
	});

	// Manual focus inside cell
	cell.tabbables[0].focus();

	updateState({
		operation: 'set',
		path: TRAPCELL_STATE_PATH,
		value: cell,
		shouldRender: false
	});
};

export const focusExitCellEffect = ({state, updateState}) => {
	const {grid, currentFocus} = getState(state);
	const cell = getCellFromGrid({grid, currentFocus});

	if (!cell.tabbables || !cell.tabbables.length) return;

	cell.node.classList.remove('active');
	cell.tabbables.forEach(node => (node.tabIndex = -1));

	deactivateFocusTrap('gridCell');

	// Re-focus to cell
	cell.node.focus();

	updateState({
		operation: 'set',
		path: TRAPCELL_STATE_PATH,
		value: undefined,
		shouldRender: false
	});
};

export const focusResetEffect = ({state, updateState}) => {
	const {trapcell} = getState(state);
	if (!trapcell) return;

	trapcell.node.classList.remove('active');
	trapcell.tabbables.forEach(node => (node.tabIndex = -1));

	deactivateFocusTrap('gridCell');

	updateState({
		operation: 'set',
		path: TRAPCELL_STATE_PATH,
		value: undefined,
		shouldRender: false
	});
};

const handleBulkFocusClick = ({action, state, updateState, newFocus}) => {
	const {
		bulkFocus,
		bulkFocus: {
			initialIndex,
			focusedIndicies: prevFocusedIndicies = [],
			colIndex: prevColIndex
		}
	} = state;

	const {
		payload: {
			event: {metaKey, shiftKey}
		}
	} = action;

	const {row: rowIndex, cell: colIndex} = newFocus;

	const localState = getState(state);
	const {grid} = localState;

	const {isValidCell, focusedRow} = getBulkFocusInfo(grid, rowIndex, colIndex);

	if (!isValidCell) {
		resetBulkFocusEffect({state, updateState});
	}

	let focusedIndicies = [...prevFocusedIndicies];
	const isSameColumn = colIndex === prevColIndex;
	const visited = focusedIndicies.includes(rowIndex) && isSameColumn;

	if (!metaKey && visited) return;

	const stateUpdate = {
		...bulkFocus,
		previousSysId: get(focusedRow, 'node.dataset.id')
	};

	// cmd click
	if (metaKey && isSameColumn) {
		stateUpdate.initialIndex = rowIndex;

		// deselect if selected
		if (visited) {
			focusedIndicies.splice(focusedIndicies.indexOf(rowIndex), 1);
		}
		// otherwise select
		else {
			focusedIndicies.push(rowIndex);
		}
	}
	// shift click
	else if (shiftKey && isSameColumn) {
		const minIndex = Math.min(initialIndex, rowIndex);
		const maxIndex = Math.max(initialIndex, rowIndex);
		focusedIndicies = focusedIndicies.concat(range(minIndex, maxIndex + 1));
	}
	// regular click
	else {
		stateUpdate.initialIndex = rowIndex;
		stateUpdate.colIndex = colIndex;
		focusedIndicies = [rowIndex];
	}

	focusedIndicies = [...new Set(focusedIndicies)];

	const focusedSysIds = [];

	// use set to remove duplicates, then loop to find valid cells to get sysIds
	[...focusedIndicies].forEach(index => {
		const {focusedRow, isValidCell} = getBulkFocusInfo(grid, index, colIndex);
		if (isValidCell) {
			focusedSysIds.push(get(focusedRow, 'node.dataset.id'));
		} else {
			focusedIndicies.splice(focusedIndicies.indexOf(index), 1);
		}
	});

	stateUpdate.focusedIndicies = focusedIndicies;
	stateUpdate.focusedSysIds = focusedSysIds;

	if (!focusedRow) return;

	const nearestTable = focusedRow.node.closest('TABLE');
	if (!nearestTable) return;

	nearestTable.setAttribute(NOW_GRID_BULK_FOCUSED_IDS, focusedSysIds.join(','));

	updateBulkStyles(focusedIndicies, grid, colIndex);

	updateState({
		path: BULK_FOCUS_STATE_PATH,
		value: stateUpdate,
		operation: 'set',
		shouldRender: false
	});
};

export const clickHandlerEffect = ({action, state, updateState, dispatch}) => {
	const {grid, currentFocus} = getState(state);
	const event = get(action, 'payload.event', {});
	const path = event.composedPath ? event.composedPath() : event.path;
	const node = path.find(node => {
		return ['TH', 'TD'].includes(node.nodeName);
	});

	// For multi drag and drop of column we have to reset the slected cloumn style
	// on click of any grid cell.

	if (!getGrabIcon(path)) clearSelectedColumns(updateState);
	if (!node) return;

	const isGroupedButtonCell =
		node.className === GROUPED_SUFFIX &&
		querySelector('now-button >>> button', node);
	const isRowSelectorCell = node.querySelector('.sn-grid-checkbox-native');

	if (
		currentFocus.node === path[0] &&
		(isGroupedButtonCell || isRowSelectorCell)
	)
		return;

	// Only reset the focus trap if the click was outside of the trapped cell
	if (currentFocus && currentFocus.node !== node) {
		dispatch(FOCUS_RESET);
	}

	const rowNode = node.parentElement;
	const row = findIndex(grid.rows, gridRow => gridRow.node === rowNode);
	const cell = [...rowNode.cells].indexOf(node);
	const newFocus = {
		row,
		cell,
		node
	};

	const {
		properties: {inlineEditingEnabled}
	} = state;

	if (inlineEditingEnabled) {
		handleBulkFocusClick({
			action,
			state,
			updateState,
			newFocus
		});
	}

	const shouldFocus = !node.contains(findActiveElement());
	setNewFocus({currentFocus, newFocus, updateState, shouldFocus});
};

/**
 *
 * @param {array} path array of nodes from event.path
 * @param {array} validTags valid tags
 *
 * @returns {boolean} true if path contains one of the tags in valid tags array
 */
export const isValidClick = (path = [], validTags = []) => {
	const nodeNames = path
		.filter(item => item.nodeName)
		.map(item => item.nodeName.toLowerCase());

	return intersection(nodeNames, validTags).length > 0;
};

/**
 *
 * @param {object} host host element of component
 * @param {array} path array of nodes
 *
 * @returns {boolean} true if path contains host
 */
export const containsHost = (host, path) => {
	const element = find(path, elem => host == elem);
	return element != undefined;
};

/**
 * This function takes an array of nodes from event.path and if the path contains
 * seismic hoist element, will construct a new path to find the correct path.
 * This is because how hoisted elements are handled. Seismic hoist elements live on
 * the root level document. Seismic hoisted elements have references to the source element.
 *
 * @param {array} path array of nodes
 *
 * @returns {array} original or modified path
 */
export const getComponentPath = path => {
	let componentPath = [];
	let currentNode,
		hasSeismicHoist = false;

	for (let index = 0; index < path.length && !hasSeismicHoist; index++) {
		currentNode = path[index];
		hasSeismicHoist = get(currentNode, 'nodeName') === 'SEISMIC-HOIST';

		componentPath.push(currentNode);
	}

	if (!hasSeismicHoist) return componentPath;

	while (currentNode) {
		if (currentNode.nodeName === 'SEISMIC-HOIST') {
			currentNode = currentNode.sourceElement;
		} else if (currentNode.assignedSlot) {
			currentNode = currentNode.parentElement;
		} else {
			currentNode = currentNode.getRootNode().host;
		}

		if (currentNode) componentPath.push(currentNode);
	}

	return componentPath;
};

export const clearFocusAndSetTabbableEffect = ({
	dispatch,
	state,
	updateState
}) => {
	const {currentFocus, shouldFocusSortedColumn} = getState(state);
	let newFocus;
	if (shouldFocusSortedColumn) newFocus = currentFocus;
	else {
		newFocus = {
			row: 0,
			cell: 0,
			node: undefined
		};
	}
	/**
	 * Reset current focus, and double check tabbables
	 * since rendered content may have changed
	 *  */
	updateState({
		path: SHOULD_FOCUS_SORTED_STATE_PATH,
		value: false,
		operation: 'set',
		shouldRender: false
	});

	setNewFocus({
		currentFocus,
		newFocus,
		updateState,
		shouldFocus: false
	});
	dispatch(UPDATE_TABBABLES);
};

export const propChangeHandler = coeffects => {
	const {action} = coeffects;
	const {
		payload: {name}
	} = action;
	if (!GRID_RERENDER_PROPERTIES.includes(name)) return;

	clearFocusAndSetTabbableEffect(coeffects);
};

export const resetBulkFocusEffect = ({updateState, state, action}) => {
	const {currentFocus} = get(
		state,
		`behaviors.${GRID_CONTROL_BEHAVIOR_NAME}`,
		{}
	);
	const currentlyFocusedNode = get(currentFocus, 'node');
	const keepLastFocus = get(action, 'payload.keepLastFocus', false);
	let nearestTable;

	if (currentlyFocusedNode) {
		nearestTable = currentlyFocusedNode.closest('TABLE');
	}

	let bulkFocusValue = {...EMPTY_BULK_FOCUS};
	if (currentlyFocusedNode && nearestTable) {
		// remove data-* attributes for bulk focus

		nearestTable.removeAttribute(NOW_GRID_BULK_FOCUSED_IDS);

		removeBulkStyles(nearestTable);
		if (keepLastFocus) {
			const row = currentlyFocusedNode.closest('tr');
			const rowSysId = get(row, 'dataset.id');

			if (rowSysId) {
				nearestTable.setAttribute(NOW_GRID_BULK_FOCUSED_IDS, [rowSysId]);
				bulkFocusValue = {
					colIndex: currentFocus.cell,
					focusedIndicies: [currentFocus.row],
					focusedSysIds: [rowSysId],
					previousSysId: rowSysId,
					initialIndex: currentFocus.row
				};
			}
		}
	}

	updateState({
		operation: 'set',
		path: 'bulkFocus',
		value: bulkFocusValue,
		shouldRender: false
	});
};
