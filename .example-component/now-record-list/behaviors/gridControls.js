import {NOW_GRID_POPOVER_CLOSED} from '@servicenow/now-grid';
import {actionTypes} from '@servicenow/ui-core';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import {INLINE_EDITING_RESET_FOCUSED_CELLS, MODEL_PATH} from '../constants';
import querySelector from '../utils/querySelector';

import {
	allowCurrentFocusEffect,
	clearFocusAndSetTabbableEffect,
	clickHandlerEffect,
	containsHost,
	focusEnterCellEffect,
	focusExitCellEffect,
	focusResetEffect,
	getCellFromGrid,
	getCellImmediateFocusNode,
	getComponentPath,
	getState,
	isValidClick,
	moveFocusEffect,
	propChangeHandler,
	resetBulkFocusEffect,
	updateTabbablesEffect
} from './actions/gridControlActions';
import {
	ALLOW_CURRENT_TABBABLE,
	FOCUS_ENTER_CELL,
	FOCUS_EXIT_CELL,
	FOCUS_RESET,
	GRID_BASE_SELECTOR,
	GRID_CONTROL_BEHAVIOR_NAME,
	KEY,
	MOVE_FOCUS,
	NOW_GRID_TAG,
	NOW_GRID_TREE_RENDERED,
	UPDATE_FOCUS_AND_TABS,
	UPDATE_TABBABLES
} from './constants';

const {COMPONENT_PROPERTY_CHANGED} = actionTypes;

const gridRenderedEffect = ({
	dispatch,
	host,
	state: {isRendered, shouldFocusDraggedColumn},
	state: {
		properties: {listModel}
	},
	updateState
}) => {
	if (!isRendered) {
		const isGridEmpty = isEmpty(
			get(listModel, MODEL_PATH.LAYOUT_QUERY.QUERY_ROWS, new Map())
		);

		const gridNode = querySelector(GRID_BASE_SELECTOR, host);
		let isGridRendered = false;
		if (isGridEmpty) {
			const gridHeadNode = gridNode?.shadowRoot.querySelector('thead');
			isGridRendered = !!gridHeadNode?.children.length;
		} else {
			const gridbodyNode = gridNode?.shadowRoot.querySelector('tbody');
			isGridRendered = !!gridbodyNode?.children.length;
		}
		if (isGridRendered) {
			if (shouldFocusDraggedColumn) {
				dispatch(UPDATE_TABBABLES);
				dispatch(FOCUS_ENTER_CELL);
				updateState({
					path: 'shouldFocusDraggedColumn',
					value: false,
					operation: 'set',
					shouldRender: false
				});
			} else dispatch(UPDATE_FOCUS_AND_TABS);

			updateState({
				shouldRender: false,
				path: 'isRendered',
				value: true,
				operation: 'set'
			});
		}
	}
};

export const popoverClosedEffect = ({action, state}) => {
	const {trapcell} = getState(state);
	const {
		payload: {popoverTargetRef}
	} = action;

	// If focus was previously within the cell when the popover closed,
	// return focus to the cell
	if (trapcell) {
		popoverTargetRef.current.focus();
	}
};

export const gridTags = ['now-grid'];

export const clearBulkFocusClickHandlerEffect = ({
	action,
	state,
	updateState,
	dispatch,
	host
}) => {
	const event = get(action, 'payload.event', {});
	const path = event.composedPath ? event.composedPath() : event.path;
	if (isEmpty(path)) return;

	const componentPath = getComponentPath(path);
	const pathContainsHost = containsHost(host, componentPath);

	if (
		!pathContainsHost ||
		(pathContainsHost && !isValidClick(componentPath, gridTags))
	) {
		dispatch(FOCUS_RESET);

		const focusedIndicies = get(state, 'bulkFocus.focusedIndicies', []);
		if (!focusedIndicies.length) return;

		resetBulkFocusEffect({updateState, state});
	}
};

const keyMap = {
	[KEY.UP]: KEY.UP,
	[KEY.ARROW_UP]: KEY.UP,
	[KEY.DOWN]: KEY.DOWN,
	[KEY.ARROW_DOWN]: KEY.DOWN,
	[KEY.LEFT]: KEY.LEFT,
	[KEY.ARROW_LEFT]: KEY.LEFT,
	[KEY.RIGHT]: KEY.RIGHT,
	[KEY.ARROW_RIGHT]: KEY.RIGHT,
	[KEY.HOME]: KEY.HOME,
	[KEY.END]: KEY.END,
	[KEY.PAGE_UP]: KEY.PAGE_UP,
	[KEY.PAGE_DOWN]: KEY.PAGE_DOWN
};

export const gridControls = {
	name: GRID_CONTROL_BEHAVIOR_NAME,
	initialState: {
		currentFocus: {
			row: 0,
			cell: 0,
			node: undefined
		},
		grid: {rows: []},
		trapcell: undefined,
		shouldFocusSortedColumn: false
	},
	eventHandlers: [
		{
			events: ['keydown'],
			effect({action, dispatch, state}) {
				const event = get(action, 'payload.event', {});
				const path = event.composedPath ? event.composedPath() : event.path;
				const fromGrid = path.some(item => {
					return item.tagName === NOW_GRID_TAG;
				});
				const {trapcell, grid, currentFocus} = getState(state);
				const cell = getCellFromGrid({grid, currentFocus});
				const isGroupedButtonCell =
					currentFocus.node.className === '-grouped' &&
					querySelector('now-button >>> button', currentFocus.node);
				const isRowSelectorCell = currentFocus.node.querySelector(
					'.sn-grid-checkbox-native'
				);

				let preventDefault = true;
				let stopPropagation = true;

				switch (event.key) {
					case KEY.UP:
					case KEY.ARROW_UP:
					case KEY.DOWN:
					case KEY.ARROW_DOWN:
					case KEY.LEFT:
					case KEY.ARROW_LEFT:
					case KEY.RIGHT:
					case KEY.ARROW_RIGHT:
						if (!trapcell && fromGrid)
							dispatch(MOVE_FOCUS, {
								key: keyMap[event.key],
								shiftKey: event.shiftKey
							});
						else preventDefault = false;
						break;
					case KEY.HOME:
					case KEY.END:
					case KEY.PAGE_UP:
					case KEY.PAGE_DOWN:
						if (!trapcell && fromGrid)
							dispatch(MOVE_FOCUS, {key: keyMap[event.key]});
						break;
					case KEY.SPACEBAR:
					case KEY.SPACE:
					case KEY.ENTER:
						if (
							!trapcell &&
							!isGroupedButtonCell &&
							!isRowSelectorCell &&
							cell.node === currentFocus.node &&
							fromGrid &&
							!event.shiftKey
						) {
							// If only one tabbable item is in the cell,
							// click it rather than start a focus trap.
							const immediateFocusNode = getCellImmediateFocusNode(cell);
							if (immediateFocusNode) {
								immediateFocusNode.click();
							} else {
								dispatch(FOCUS_ENTER_CELL);
							}
						} else preventDefault = false;
						break;
					case KEY.ESC:
					case KEY.ESCAPE:
						if (trapcell) dispatch(FOCUS_EXIT_CELL);
						else preventDefault = false;
						break;
					default:
						preventDefault = false;
						stopPropagation = false;
						break;
				}

				if (preventDefault) event.preventDefault();
				if (stopPropagation) event.stopPropagation();
			}
		},
		{
			events: ['click'],
			effect: clickHandlerEffect
		},
		{
			events: ['click'],
			effect: clearBulkFocusClickHandlerEffect,
			target: document
		}
	],
	actionHandlers: {
		[UPDATE_TABBABLES]: {
			effect: updateTabbablesEffect,
			stopPropagation: true
		},
		[ALLOW_CURRENT_TABBABLE]: {
			effect: allowCurrentFocusEffect,
			stopPropagation: true
		},
		[MOVE_FOCUS]: {
			effect: moveFocusEffect,
			stopPropagation: true
		},
		[FOCUS_ENTER_CELL]: {
			effect: focusEnterCellEffect,
			stopPropagation: true
		},
		[FOCUS_EXIT_CELL]: {
			effect: focusExitCellEffect,
			stopPropagation: true
		},
		[FOCUS_RESET]: {
			effect: focusResetEffect,
			stopPropagation: true
		},
		[COMPONENT_PROPERTY_CHANGED]: propChangeHandler,
		[UPDATE_FOCUS_AND_TABS]: {
			effect: clearFocusAndSetTabbableEffect,
			stopPropagation: true
		},
		[NOW_GRID_TREE_RENDERED]: {
			effect: gridRenderedEffect,
			stopPropagation: true
		},
		[NOW_GRID_POPOVER_CLOSED]: {
			effect: popoverClosedEffect
		},
		[INLINE_EDITING_RESET_FOCUSED_CELLS]: {
			effect: resetBulkFocusEffect,
			stopPropagation: true
		}
	}
};
