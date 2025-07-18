import {Logger} from '@devsnc/sn-list-commons';
import {actionTypes} from '@servicenow/ui-core';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import last from 'lodash/last';

import {KEY} from '../../../behaviors/constants';
import {
	LIST_UPDATE_COLUMN_WIDTH_USER_PREF,
	METRIC_TRACKED
} from '../../../constants';
import {RESIZE_WIDTHS_EVENT} from '../../../utils/metrics/constants';

const {COMPONENT_PROPERTY_CHANGED} = actionTypes;

export const PLUGIN_NAME = 'colResizing';
export const BEHAVIOR_PATH = ['behaviors', PLUGIN_NAME];
export const OPTIONS_PATH = ['options', PLUGIN_NAME];
export const STYLES_TABLE_PATH = ['pluginStyles', 'table'];

export const behaviorUpdatePath = `behaviors.${PLUGIN_NAME}`;

const getTableStyleType = state =>
	get(state, [...BEHAVIOR_PATH, 'tableStyleType'], {});

export const COL_RESIZE = 'COL_RESIZE';
export const COL_RESIZE_INITIAL = 'COL_RESIZE_INITIAL';
export const TOGGLE_COL_RESIZING = 'TOGGLE_COL_RESIZING';
export const COL_RESIZE_MIN_WIDTH = 120;
export const KEY_ARROW_RIGHT = 'ArrowRight';
export const KEY_ARROW_LEFT = 'ArrowLeft';
export const KEY_PAGE_UP = 'PageUp';
export const KEY_PAGE_DOWN = 'PageDown';
export const KEY_ENTER = 'Enter';
export const KEY_ESCAPE = 'Escape';
export const COL_RESIZE_AMOUNT = 5;
export const COL_RESIZE_LARGE_AMOUNT = 50;

export const selectors = {
	getTableStyleType
};

const LOG = Logger().createLog('Now Grid: Column Resizing');

export const getColumnSizesArrayPath = () =>
	`behaviors.${PLUGIN_NAME}.columnSizesArray`;
export const getColumnSizesArray = state =>
	get(state, getColumnSizesArrayPath(), []);
export const keyDownHandler = (
	event,
	props,
	index,
	field,
	headingRef,
	resizeRef,
	dispatch
) => {
	const path = event.composedPath ? event.composedPath() : event.path;
	const element = path[0];
	if (!element.classList.contains('slider-visible')) return;
	dispatch(TOGGLE_COL_RESIZING, {value: true});

	if (event.key === KEY_ENTER) {
		element.classList.add('active');
	} else if (event.key === KEY.TAB || event.key === KEY_ESCAPE) {
		element.classList.remove('active');
	}

	let newWidth = 0;
	const initialWidth = Math.floor(
		get(props, `options.colResizing.columnSizesArray[${index}]`, 0)
	);
	if (!element.classList.contains('active')) return;
	let preventDefault = true;

	switch (event.key) {
		case KEY_ARROW_LEFT:
			newWidth = initialWidth - COL_RESIZE_AMOUNT;
			if (newWidth <= COL_RESIZE_MIN_WIDTH) newWidth = COL_RESIZE_MIN_WIDTH;
			break;
		case KEY_ARROW_RIGHT:
			newWidth = initialWidth + COL_RESIZE_AMOUNT;
			break;
		case KEY_PAGE_UP:
			newWidth = initialWidth + COL_RESIZE_LARGE_AMOUNT;
			break;
		case KEY_PAGE_DOWN:
			newWidth = initialWidth - COL_RESIZE_LARGE_AMOUNT;
			if (newWidth <= COL_RESIZE_MIN_WIDTH) newWidth = COL_RESIZE_MIN_WIDTH;
			break;
		default:
			preventDefault = false;
	}

	if (preventDefault) event.preventDefault();
	else return;

	const cssString = `${newWidth}px`;
	headingRef.current.closest('th').style.width = cssString;
	resizeRef.current.closest('div').ariaValueNow = newWidth;

	dispatch(COL_RESIZE, {
		col: field,
		width: newWidth,
		index
	});
};

const isLastColumn = context => {
	const {column, columns} = context;
	const lastCol = last(columns);

	return column.field === lastCol.field;
};

const updateColumnSize = (width, increment, heading, closestDiv) => {
	let newWidth = width + increment;
	if (newWidth <= COL_RESIZE_MIN_WIDTH) newWidth = COL_RESIZE_MIN_WIDTH;

	const cssString = `${newWidth}px`;

	heading.style.width = cssString;
	closestDiv.ariaValueNow = newWidth;

	return newWidth;
};

const scrollList = (scrollContainer, newWidth, increment) => {
	if (newWidth !== COL_RESIZE_MIN_WIDTH) {
		scrollContainer &&
			scrollContainer.scrollTo(
				scrollContainer.scrollLeft + increment,
				scrollContainer.scrollTop
			);
	}
};

export const mouseDownHandler = (
	evt,
	props,
	index,
	field,
	headingRef,
	colResizeGuideRef,
	resizeRef,
	dispatch,
	context
) => {
	evt.preventDefault();
	dispatch(TOGGLE_COL_RESIZING, {value: true});
	const colInitialX = evt.clientX;
	let newWidth = 0;

	const initialWidth = Math.floor(
		get(props, `options.colResizing.columnSizesArray[${index}]`, 0)
	);

	const defaultIncrement = 5;
	let interval,
		increment = 0;

	const closestDiv = resizeRef.current.closest('div');
	const heading = headingRef.current;
	const scrollContainer = resizeRef.current.closest('div.container.now-grid');

	const lastColumn = isLastColumn(context);
	if (lastColumn) {
		newWidth = initialWidth;
		interval = setInterval(() => {
			newWidth = updateColumnSize(newWidth, increment, heading, closestDiv);
			scrollList(scrollContainer, newWidth, increment);
		}, 25);
	}

	const lastColumnMouseMoveHandler = event => {
		event.preventDefault();
		const delta = event.clientX - colInitialX;
		increment = Math.sign(delta) * defaultIncrement;
	};

	const defaultMouseMoveHandler = event => {
		event.preventDefault();
		const delta = event.clientX - colInitialX;
		newWidth = updateColumnSize(initialWidth, delta, heading, closestDiv);
	};

	const mouseMoveHandler = lastColumn
		? lastColumnMouseMoveHandler
		: defaultMouseMoveHandler;

	const mouseUpHandler = event => {
		event.preventDefault();
		if (interval) clearInterval(interval);

		dispatch(COL_RESIZE, {
			col: field,
			width: newWidth,
			index
		});
		colResizeGuideRef.current.style.height = 0;
		document.removeEventListener('mousemove', mouseMoveHandler);
		document.removeEventListener('mouseup', mouseUpHandler);
	};
	const tableHeight = colResizeGuideRef.current.closest('table').clientHeight;
	colResizeGuideRef.current.style.height = `${tableHeight}px`;
	document.addEventListener('mousemove', mouseMoveHandler);
	document.addEventListener('mouseup', mouseUpHandler);
};

const propertyChangedHandlers = {
	['columnWidths']: (coeffects, value) => {
		const {updateState, state} = coeffects;
		const currentTableLayout = get(
			state,
			`behaviors.${PLUGIN_NAME}.tableStyleType.style.tableLayout`
		);

		const columnSizesArray = get(
			state,
			`behaviors.${PLUGIN_NAME}.columnSizesArray`,
			[]
		);

		// Check for object refs because seismic
		if (isEqual(value, columnSizesArray)) return;

		updateState({
			path: `behaviors.colResizing.columnSizesArray`,
			value: value,
			operation: 'set'
		});

		if (!isEmpty(value) && !isEqual(currentTableLayout, 'fixed')) {
			// Column resizing toggled on. Check current value to prevent unecessary render cycles
			updateState({
				path: `behaviors.${PLUGIN_NAME}.tableStyleType.style`,
				value: {tableLayout: 'fixed'},
				operation: 'set'
			});
		} else if (isEmpty(value) && !isEqual(currentTableLayout, 'auto')) {
			// set column resizing to false and reset table to auto
			updateState({
				path: `behaviors.${PLUGIN_NAME}.tableStyleType.style`,
				value: {tableLayout: 'auto'},
				operation: 'set'
			});
		}
	}
};

const updateWidthsState = ({
	updateState,
	width,
	index,
	state,
	shouldRender
}) => {
	const columnSizesArray = get(
		state,
		`behaviors.${PLUGIN_NAME}.columnSizesArray`,
		[]
	);
	columnSizesArray[index] = width;
	updateState({
		path: `behaviors.${PLUGIN_NAME}.columnSizesArray`,
		value: columnSizesArray,
		operation: 'set',
		shouldRender
	});
	return columnSizesArray;
};

export function instantiatePlugin() {
	return {
		transform(state) {
			return {
				...state,
				pluginStyles: {
					table: selectors.getTableStyleType(state)
				},
				options: {
					...state.options,
					colResizing: get(state, BEHAVIOR_PATH, {})
				}
			};
		},

		behavior: {
			name: PLUGIN_NAME,
			initialState: {
				// Needed for user prefs later
				columnSizesArray: [],
				tableStyleType: {style: {tableLayout: 'auto'}}
			},
			actionHandlers: {
				[COL_RESIZE_INITIAL]: {
					effect: coeffects => {
						const {
							updateState,
							action: {
								payload: {col, index, vnode}
							},
							state
						} = coeffects;

						// we have to get the width here instead of the hook-update because the hooks won't run when the browser
						// calculates what the width of the TH should be when tableLayout is auto
						let width;
						if (typeof window === 'undefined') {
							LOG.error(
								`Window not found. Setting column sizes to min width of ${COL_RESIZE_MIN_WIDTH}px`
							);
							width = COL_RESIZE_MIN_WIDTH;
						} else {
							width = window
								.getComputedStyle(vnode.elm)
								.width.replace('px', '');
						}

						updateWidthsState({
							updateState,
							width,
							index,
							col,
							state,
							shouldRender: false
						});
					}
				},
				[COL_RESIZE]: {
					effect: coeffects => {
						const {
							updateState,
							action: {
								payload: {col, width, index}
							},
							state,
							dispatch
						} = coeffects;

						if (width < COL_RESIZE_MIN_WIDTH) return;
						const columnSizesArray = get(
							state,
							`behaviors.${PLUGIN_NAME}.columnSizesArray`,
							[]
						);

						const oldWidth =
							index < columnSizesArray.length
								? parseFloat(columnSizesArray[index])
								: 0;
						const updatedWidths = updateWidthsState({
							updateState,
							width,
							index,
							col,
							state,
							shouldRender: true
						});
						const metadata = {
							column: col,
							oldWidth,
							newWidth: width
						};

						dispatch(METRIC_TRACKED, {
							eventName: RESIZE_WIDTHS_EVENT,
							metadata
						});

						// Set both at the same time and then dispatch the new state up to connected to update user pref

						dispatch(LIST_UPDATE_COLUMN_WIDTH_USER_PREF, {
							columnWidths: updatedWidths
						});
					}
				},
				[TOGGLE_COL_RESIZING]: {
					effect: coeffects => {
						const {updateState, state} = coeffects;

						const currentTableLayout = get(
							state,
							`behaviors.${PLUGIN_NAME}.tableStyleType.style.tableLayout`
						);

						if (!isEqual(currentTableLayout, 'fixed')) {
							updateState({
								path: `behaviors.${PLUGIN_NAME}.tableStyleType.style`,
								value: {tableLayout: 'fixed'},
								operation: 'set'
							});
						}
					}
				},
				[COMPONENT_PROPERTY_CHANGED]: {
					effect: coeffects => {
						const {
							action: {
								payload: {name, value, previousValue}
							}
						} = coeffects;

						const propChangeFn = get(propertyChangedHandlers, name, () => {});
						propChangeFn(coeffects, value, previousValue);
					}
				}
			}
		}
	};
}
