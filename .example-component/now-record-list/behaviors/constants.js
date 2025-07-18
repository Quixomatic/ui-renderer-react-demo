import {selector as tabbySelector} from '@devsnc/sn-list-commons';

// Actions
export const UPDATE_TABBABLES = 'UPDATE_TABBABLES';
export const UPDATE_FOCUS_AND_TABS = 'UPDATE_FOCUS_AND_TABS';
export const ALLOW_CURRENT_TABBABLE = 'ALLOW_CURRENT_TABBABLE';
export const MOVE_FOCUS = 'MOVE_FOCUS';
export const FOCUS_ENTER_CELL = 'FOCUS_ENTER_CELL';
export const FOCUS_EXIT_CELL = 'FOCUS_EXIT_CELL';
export const FOCUS_RESET = 'FOCUS_RESET';
export const UPDATE_BULK_EDIT = 'UPDATE_BULK_EDIT';
export const UPDATE_BULK_EDIT_CLICK = 'UPDATE_BULK_EDIT_CLICK';
export const BULK_FOCUS_STATE_PATH = 'bulkFocus';

// Keys
export const KEY = {
	ARROW_UP: 'ArrowUp',
	ARROW_RIGHT: 'ArrowRight',
	ARROW_DOWN: 'ArrowDown',
	ARROW_LEFT: 'ArrowLeft',
	UP: 'Up',
	RIGHT: 'Right',
	DOWN: 'Down',
	LEFT: 'Left',
	SPACE: ' ',
	SPACEBAR: 'Spacebar',
	ENTER: 'Enter',
	ESC: 'Esc',
	ESCAPE: 'Escape',
	PAGE_UP: 'PageUp',
	PAGE_DOWN: 'PageDown',
	HOME: 'Home',
	END: 'End',
	TAB: 'Tab'
};

// Selectors
export const ROW_SELECTOR = "tr:not(.is-hidden), [role='row']";
export const CELL_SELECTOR = "td, [role='gridcell'], th, [role='columnheader']";
export const TABINDEX_SELECTOR = `[data-manualtabindex='true'],${tabbySelector}`;

// Misc
export const GRID_CONTROL_BEHAVIOR_NAME = 'gridControls';
export const GRID_RERENDER_PROPERTIES = [
	'gridModel',
	'hideCellFilter',
	'hideColumnFiltering',
	'hideColumnGrouping',
	'hideColumnSorting',
	'hideColumnResizing',
	'hideLinks',
	'hideHighlightedValues',
	'hideQuickEdit',
	'hideRowSelector',
	'hideSelectedAll',
	'customCellRenderer',
	'columns'
];
export const TD_SELECTOR = 'TD';

// Now Grid
export const GRID_BASE_SELECTOR = '>>> now-grid';
export const NOW_GRID_DOM_READY = 'NOW_GRID#DOM_READY';
export const NOW_GRID_TREE_RENDERED = 'NOW_GRID#TREE_RENDERED';
export const NOW_GRID_TAG = 'NOW-GRID';
export const NOW_GRID_BULK_FOCUSED_IDS = 'data-quick-edit-ids';
export const NOW_GRID_SCROLL_CONTAINER_SELECTOR = 'div.container.now-grid';
