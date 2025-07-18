import '../emptyContentArea/emptyContentArea';
import {addRetainedElement, Logger} from '@devsnc/sn-list-commons';
import {createCustomElement} from '@servicenow/ui-core';
import {actionTypes} from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';
import difference from 'lodash/difference';
import findIndex from 'lodash/findIndex';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import throttle from 'lodash/throttle';

import {dirtyBehavior} from '../../behaviors/dirtyBehavior/dirtyBehavior';
import {
	BUTTON_CLICKED,
	BUTTON_GROUP_ALL_TOGGLE,
	BUTTON_GROUP_TOGGLE,
	CLICK_HANDLER_POPOVER,
	COLUMN_FILTERING,
	GRID_CELL_MAXCHAR,
	GRID_CLOSE_POPOVER,
	GRID_MODEL_UPDATED,
	LIST_LOADER_SIZE_LG,
	LIST_SCROLL_UPDATED,
	MODEL_PATH,
	PREF_GROUP_TOGGLE,
	PREF_GROUP_TOGGLE_ALL,
	PROPERTIES_SET,
	SCROLL_THROTTLE_LIMIT,
	UPDATE_COLPROPS_HEADERROWS
} from '../../constants';
import {clearClickHandler} from '../../utils/clickHandlerHelpers';
import {renderSpinnerContainer} from '../../utils/listLoaderHelper';
import {renderGroupedBody} from '../gridGroupedBody/gridGroupedBody';
import {renderGridHeader} from '../gridHeader/gridHeader';

import {actionHandlers} from './actions/gridActions';
import {findGridScrollContainer} from './grid';
import {
	findOpenRecordIndex,
	onKeyDownColumnResizing,
	onMouseDownColumnResizing,
	onMouseMoveColumnResizingThrottled,
	onMouseUpColumnResizing
} from './gridUtils';
import styles from './treegrid.scss';

const LOG = Logger().createLog('TREEGRID');
const GRID_OVERFLOW_CONTAINER_CLASS = 'sn-list-body-overflow';

const {COMPONENT_DISCONNECTED} = actionTypes;

const headerFocusHandler = () => {};

const view = (state, {dispatch, updateState}) => {
	const {properties} = state;
	const {
		allSelectedOnPage,
		allRecordsSelected,
		ariaTitle,
		columns,
		columnWidths,
		hideCellFilter,
		hideColumnFiltering,
		hideColumnSorting,
		hideColumnResizing,
		hideQuickEdit,
		hideColumnGrouping,
		hideRowSelector,
		hideSelectAll,
		hideEmptyStateImage,
		isRefList,
		listInstanceId,
		gridModel,
		columnsResized,
		loading,
		parsedQueryModel,
		popover,
		quickEditSysId,
		scrollHandlerThrottle,
		selectedRecords,
		table,
		title,
		wordWrap,
		customCellRenderer,
		isGlideQuery,
		nonGlideFilterProps,
		liveListUpdates,
		listType,
		inlineEditingEnabled,
		maxCharLimit,
		highlightContent
	} = properties;
	const isGridEmpty =
		gridModel &&
		isEmpty(get(gridModel, MODEL_PATH.LAYOUT_QUERY.QUERY_ROWS, new Map()));

	const showEmptyState = isGridEmpty && !loading;
	const allSysIdsOnPage = get(
		gridModel,
		MODEL_PATH.LAYOUT_QUERY.ALL_SYS_IDS,
		[]
	);
	const initialWidths = state.initialWidths;
	const openRecordIndex = findOpenRecordIndex(
		gridModel,
		isRefList,
		isGridEmpty
	);

	const headerFeatureFlags = {
		hideRowSelector,
		hideColumnSorting,
		hideQuickEdit,
		hideColumnFiltering,
		hideColumnGrouping,
		hideColumnResizing
	};

	const cellFeatureFlags = {
		hideCellFilter
	};

	const bodyFeatureFlags = {
		hideSelectAll,
		hideRowSelector,
		hideQuickEdit,
		cellFeatureFlags
	};

	let {internalGroupingState} = state;
	const {layoutQuery} = gridModel;

	if (
		!isEqual(internalGroupingState.preferenceData, gridModel.preferenceData)
	) {
		const preferenceData = gridModel.preferenceData || [];
		const groupTogglePref =
			preferenceData.find(pref => pref.name.indexOf('defaultAsOpen') > -1) ||
			{};
		const groupDefault = (groupTogglePref.value || '').toLowerCase() === 'true';

		const groupExceptionPref =
			preferenceData.find(pref => pref.name.indexOf('exceptions') > -1) || {};

		// Use this to keep track of toggled groups, and remove empty groupKey from exceptions.
		const groupExceptionsArray = (groupExceptionPref.value || '').split(',');
		const groupExceptions = new Set(groupExceptionsArray);
		groupExceptions.delete('');

		const newInternalGroupingState = {
			preferenceData,
			groupDefault,
			groupExceptions
		};
		updateState({
			operation: 'set',
			path: 'internalGroupingState',
			value: newInternalGroupingState,
			shouldRender: false
		});
		internalGroupingState = newInternalGroupingState;
	}

	let nowTableRef = null;
	const nowTableReturnFocus = () => {
		if (nowTableRef) {
			setTimeout(() => nowTableRef.focus());
		}
	};

	const tableClassName = columnsResized
		? 'sn-list-table resized'
		: 'sn-list-table';

	return (
		<div
			id="gridcontainer"
			className={'sn-list-body'}
			ref={el => {
				nowTableRef = el;
			}}>
			{loading ? renderSpinnerContainer(LIST_LOADER_SIZE_LG) : null}
			<div
				className={GRID_OVERFLOW_CONTAINER_CLASS}
				onScroll={throttle(() => {
					if (get(popover, 'type') === COLUMN_FILTERING)
						dispatch(GRID_CLOSE_POPOVER);

					const timestamp = Date.now();
					dispatch(LIST_SCROLL_UPDATED, {
						table,
						timestamp
					});
					LOG.log(
						`Dispatched: (LIST_SCROLL_UPDATED, {table:${table}, timestamp:${timestamp}})`
					);
				}, scrollHandlerThrottle)}>
				<table aria-label={ariaTitle} role="grid" className={tableClassName}>
					{renderGridHeader({
						allRecordsSelected,
						recordCount: get(gridModel, MODEL_PATH.LAYOUT_QUERY.COUNT),
						columns,
						columnWidths,
						gridModel,
						focusHandler: headerFocusHandler,
						dispatch,
						allSysIdsOnPage,
						selectedRecords,
						allSelectedOnPage,
						headerFeatureFlags,
						parsedQueryModel,
						initialWidths,
						isGrouped: get(gridModel, 'isGrouped', true),
						defaultGroupToggleState: internalGroupingState.groupDefault,
						nowTableReturnFocus,
						isGlideQuery,
						nonGlideFilterProps,
						headerRows: state.headerRows,
						columnProps: state.columnProps
					})}
					{renderGroupedBody({
						allGroupStateDefault: internalGroupingState.groupDefault,
						allSelectedOnPage,
						bodyFeatureFlags,
						checkedRecords: selectedRecords,
						customCellRenderer,
						dispatch,
						gridModel,
						groupExceptions: internalGroupingState.groupExceptions,
						groupState: layoutQuery,
						inlineEditingEnabled,
						isRefList,
						listInstanceId,
						openRecordIndex,
						quickEditSysId,
						title,
						headerColumns: state.headerColumns,
						wordWrap,
						liveListUpdates,
						maxCharLimit,
						highlightContent
					})}
				</table>
				{showEmptyState ? (
					<sn-record-list-state-empty
						hideEmptyStateImage={hideEmptyStateImage}
						listType={listType}
					/>
				) : null}
			</div>
		</div>
	);
};

/**
 * A component that displays data in a treegrid format. This includes a grid header row containing column titles,
 * sectioned data into groups, and body rows of cells containing data
 *
 * ```
 * <now-treegrid {...gridProps} />
 * ```
 *
 * @seismicElement now-treegrid
 * @summary A component that displays data in a treegrid format. This includes a grid header row containing column titles,
 * sectioned data into groups, and body rows of cells containing data
 */
createCustomElement('now-treegrid', {
	renderer: {
		type: snabbdom,
		view,
		initialState: {
			resizing: false,
			colHeader: undefined,
			columnResizing: {
				initialWidth: 0,
				initialX: 0,
				colID: ''
			},
			initializedColumnWidths: false,
			initialWidths: []
		}
	},
	initialState: {
		internalGroupingState: {
			groups: [],
			groupDefault: undefined,
			encodedQueryString: undefined,
			limit: undefined
		},
		headerRows: [],
		columnProps: new WeakMap(),
		headerColumns: undefined
	},
	behaviors: [dirtyBehavior],
	properties: {
		hideCellFilter: {},
		hideCheckboxHover: {},
		hideColumnFiltering: {},
		hideColumnGrouping: {},
		hideColumnSorting: {},
		hideColumnResizing: {},
		hideLinks: {},
		hideQuickEdit: {},
		hideRowSelector: {},
		hideSelectAll: {},
		hideEmptyStateImage: {},
		inlineEditingEnabled: {default: false},
		/**
		 * Represents the model required to populate the grid with the following properties:
		 * - `allSysIdsOnPage: string[]`
		 * - `columns: Object[]` required
		 * - `count: number` required - The total number of records in the data set.
		 * - `data: Object[]` required
		 * - `encodedQueryString: string` - (e.g. "ORDERBYDESCmanufacturer")
		 * - `errorMessage: Object`
		 * - `preferenceData: Object[]`
		 * - `selectedListId: string`
		 * - `tableConditions: Object[]`
		 * - `tableMetadata: Object` - (e.g. {canCreate: true, canWrite: true, canDelete: true, hasTextIndex: false, isScriptableTable: false})
		 * - `visible: number`
		 * @type {{allSysIdsOnPage: string[], columns: Object[], count: number, data: Object[], encodedQueryString: string, errorMessage: Object, preferenceData: Object[], selectedListId: string, tableConditions: Object[], tableMetadata: Object, visible: number}}
		 */
		gridModel: {
			default: {},
			onChange(newVal, oldVal, {dispatch}) {
				if (oldVal !== newVal) {
					dispatch(GRID_MODEL_UPDATED);
				}
			}
		},
		/**
		 * Function that returns JSX to customize each individual cell in the grid.
		 * @type: {function}
		 */
		customCellRenderer: {
			default: {
				get: () => false
			}
		},
		/**
		 * Indicates whether or not new data is being fetched to populate the grid.
		 * @type {boolean}
		 */
		loading: {default: false},
		liveListUpdates: {default: {}},
		/**
		 * Current list variant requested.
		 *
		 * @type {string}
		 */
		listType: {default: ''},
		/**
		 * Indicates the page number when grouping by a specific column.
		 * @type {number}
		 */
		page: {default: 0},
		/**
		 * Optional setting which indiates how many records to render on each page.
		 * (e.g. 5, 10, 20, 100)
		 * @type {number}
		 */
		limit: {default: 10},
		/**
		 * Gives the ability to set order via a column either ascending or descending.
		 * (e.g. {columnName: "manufacturer", ascending: true})
		 * @type {{columnName: string, ascending: boolean}}}
		 */
		orderBy: {default: {}},
		/**
		 * Represents a unique ID for the instance of the grid rendered.
		 * @type {string}
		 */
		listInstanceId: {default: ''},
		/**
		 * This is the object model representation of a query string, which is used to filter the grid data.
		 * @type {{count: number, fixedQueries: string[], glideQuery: Object, queryString: string}}}
		 */
		parsedQueryModel: {default: {}},
		/**
		 * The name of the table to render inside the grid.
		 * @type {string}
		 */
		table: {default: ''},
		/**
		 * Title of the tabular data being displayed in the grid.
		 * @type {string}
		 */
		listTitle: {default: ''},
		/**
		 * Aria label including 'listTitle' and 'table' used for accessibility and voice-over.
		 * @type {string}
		 */
		ariaTitle: {default: ''},
		/**
		 * Enable long words to be able to break and wrap onto the next line.
		 * @type {boolean}
		 */
		wordWrap: {default: false},
		/**
		 * Setting that determines whether the data populating the grid is from a reference table.
		 * @type {boolean}
		 */
		isRefList: {default: false},
		/**
		 * An array of column objects that describe each column header in the grid.
		 * @type {{ascending: boolean, column: Object, defaultSort: boolean, isGrouped: boolean, isSorted: boolean, key: string, updateSort: Object}[]}
		 */
		columns: {},
		/**
		 * An array of pixel values that sets the widths of the columns to specific values (if value != -1).
		 * Normally set by the userPref that is passed down from list.
		 * @type {int[]}
		 */
		columnWidths: {default: []},
		/**
		 * An object with a timestamp property that tells us if we have to reset the column widths.
		 * @type {timestamp: int}
		 */
		columnWidthsResetRequested: {default: {timestamp: Date.now()}},
		columnsResized: {default: false},
		/**
		 * An array of strings representing the unique ID's of each row that is selected.
		 * @type {string[]}
		 */
		selectedRecords: {default: []},
		/**
		 * Indicates whether all records across all lists have been selected
		 * @type {boolean}
		 */
		allRecordsSelected: {default: false},
		/**
		 * Indicates whether all records in a table have been selected.
		 * @type {boolean}
		 */
		allSelectedOnPage: {
			computed({
				properties: {
					gridModel: {allSysIdsOnPage},
					selectedRecords
				}
			}) {
				return (
					selectedRecords.length > 0 &&
					difference(allSysIdsOnPage, selectedRecords).length === 0
				);
			}
		},
		/**
		 * The throttle value in milliseconds for scrolling the grid.
		 * @type {number}
		 */
		scrollHandlerThrottle: {default: SCROLL_THROTTLE_LIMIT},
		/**
		 * Represets the unique ID of a row that a user wants to quick-edit from the grid.
		 * @type {string}
		 */
		quickEditSysId: {default: ''},
		/**
		 * Represents the modal used to display either the header menu or the cell context menu popoevers.
		 * @type {{context: Object, location: Object, type: string}}}
		 */
		popover: {},
		/**
		 * Private property that uses a date-time string to indicate when to force a re-render of the grid.
		 * @type {string}
		 */
		lastForcedRender: {default: ''},
		/**
		 * * A flag that indicates that the column filtering uses a Glide Query
		 * @type {boolean}
		 */
		isGlideQuery: {default: true},
		/**
		 * represents model that is used for non glide query filtering
		 * @type {isGlideQuery: {boolean}, comparisonIdMap: {Object}}
		 */
		nonGlideFilterProps: {
			default: {
				comparisonIdMap: {},
				comparisonFieldCountMap: {}
			},
			reflect: true
		},
		/**
		 * Max character limit on the text displayed in grid row cells
		 *
		 * @type {number}
		 */
		maxCharLimit: {
			default: GRID_CELL_MAXCHAR
		},
		/**
		 * Highlights the content in grid row cells with given regular expression
		 * for ex. {patterns:['joe', '/bATF/b'], color: '#00FFFF | cyan' }.
		 * @type {object}
		 */
		highlightContent: {
			default: {
				patterns: [],
				color: ''
			}
		}
	},
	actionHandlers: {
		...actionHandlers,
		[BUTTON_CLICKED]: {
			effect: coeffects => {
				const {state, dispatch, action} = coeffects;
				const buttonName = get(action, 'meta.componentName', '').split('-')[0];
				const {
					properties: {gridModel, table}
				} = state;
				const column = get(gridModel, 'tableMetadata.groupedColumn');
				switch (buttonName) {
					case BUTTON_GROUP_TOGGLE:
						dispatch(PREF_GROUP_TOGGLE, {
							table,
							column,
							value: action.payload.value,
							preference: toggleGroup(coeffects)
						});
						break;
					case BUTTON_GROUP_ALL_TOGGLE: {
						const toggleState = toggleAllGroups(coeffects);
						dispatch(PREF_GROUP_TOGGLE_ALL, {
							table,
							column,
							value: toggleState
						});
						break;
					}
				}
			},
			stopPropagation: true
		},
		[COMPONENT_DISCONNECTED]: {
			effect: coeffects => {
				const groupExceptionsSet = get(
					coeffects,
					'state.internalGroupingState.groupExceptions',
					new Set()
				);
				groupExceptionsSet.clear();
				clearClickHandler(CLICK_HANDLER_POPOVER);
			}
		}
	},
	eventHandlers: [
		{
			events: ['mousedown'],
			effect: onMouseDownColumnResizing
		},
		{
			events: ['mouseup', 'mouseleave'],
			effect: onMouseUpColumnResizing
		},
		{
			events: ['mousemove'],
			effect: onMouseMoveColumnResizingThrottled
		},
		{
			events: ['keydown'],
			effect: onKeyDownColumnResizing
		}
	],
	dispatches: {
		/**
		 * Dispatched when the user clicks on either the column filtering or cell
		 * filtering popovers and another popover on the page is currenly open.
		 * @type {{}}
		 */
		[GRID_CLOSE_POPOVER]: {}
	},
	onConnect(host, dispatch) {
		addRetainedElement(
			`${host.listInstanceId}_grid_overflow`,
			findGridScrollContainer(host)
		);
		dispatch(UPDATE_COLPROPS_HEADERROWS);
	},
	styles: styles
});

const toggleGroup = ({state, action, dispatch, updateState}) => {
	const {
		payload: {value}
	} = action;
	const {properties, internalGroupingState} = state;
	const {groupExceptions} = internalGroupingState;

	const newGridModel = {...properties.gridModel};

	if (groupExceptions.has(value)) groupExceptions.delete(value);
	else groupExceptions.add(value);

	// TODO: In P, we need to decide on a single source of truth for our groupBy user preferences
	// For now, the source of truth is our internal state, but we need to decide if we want to keep it this way
	const prefIndex = findIndex(
		newGridModel.preferenceData,
		pref => pref.name.indexOf('exceptions') > -1
	);
	const preference = get(newGridModel, `preferenceData[${prefIndex}]`, {});
	const newPreference = {
		...preference,
		value: Array.from(groupExceptions).join()
	};

	updateState({internalGroupingState, initialWidths: []});

	dispatch(PROPERTIES_SET, {
		lastForcedRender: Date.now()
	});

	return newPreference;
};

const toggleAllGroups = ({state, dispatch, updateState}) => {
	const {internalGroupingState} = state;
	internalGroupingState.groupDefault = !internalGroupingState.groupDefault;
	internalGroupingState.groupExceptions.clear();

	updateState({internalGroupingState, initialWidths: []});

	dispatch(PROPERTIES_SET, {
		lastForcedRender: Date.now()
	});

	return internalGroupingState.groupDefault;
};
