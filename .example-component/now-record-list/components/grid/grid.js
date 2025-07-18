import {Logger, addRetainedElement} from '@devsnc/sn-list-commons';
import tooltipBehavior from '@servicenow/behavior-tooltip';
import truncationBehavior from '@servicenow/behavior-truncation';
import {createCustomElement} from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';
import difference from 'lodash/difference';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import throttle from 'lodash/throttle';

import '../emptyContentArea/emptyContentArea';
import {dirtyBehavior} from '../../behaviors/dirtyBehavior/dirtyBehavior';
import {gridControls} from '../../behaviors/gridControls';
import {
	CLICK_HANDLER_POPOVER,
	COLUMN_FILTERING,
	GRID_CELL_MAXCHAR,
	GRID_CLOSE_POPOVER,
	GRID_MODEL_UPDATED,
	LIST_LOADER_SIZE_LG,
	LIST_SCROLL_UPDATED,
	MODEL_PATH,
	SCROLL_THROTTLE_LIMIT,
	UPDATE_COLPROPS_HEADERROWS
} from '../../constants';
import {clearClickHandler} from '../../utils/clickHandlerHelpers';
import {renderSpinnerContainer} from '../../utils/listLoaderHelper';
import {renderBody} from '../gridBody/gridBody';
import {renderGridHeader} from '../gridHeader/gridHeader';

import {actionHandlers} from './actions/gridActions';
import {
	findOpenRecordIndex,
	onKeyDownColumnResizing,
	onMouseDownColumnResizing,
	onMouseMoveColumnResizingThrottled,
	onMouseUpColumnResizing
} from './gridUtils';
import styles from './treegrid.scss';

const LOG = Logger().createLog('GRID');
const GRID_OVERFLOW_CONTAINER_CLASS = 'sn-list-body-overflow';
const headerFocusHandler = () => {};

const view = (state, {dispatch}) => {
	const {properties} = state;
	const {
		allSelectedOnPage,
		allRecordsSelected,
		ariaTitle,
		checkedRowIndex,
		columns,
		columnWidths,
		hideCellFilter,
		hideColumnFiltering,
		hideColumnSorting,
		hideQuickEdit,
		hideColumnGrouping,
		hideColumnResizing,
		hideRowSelector,
		hideSelectAll,
		hideLinks,
		hideLiveList,
		hideHighlightedValues,
		hideCheckboxHover,
		hideEmptyStateImage,
		highlightContent,
		inlineEditingEnabled,
		isRefList,
		listInstanceId,
		gridModel,
		columnsResized,
		loading,
		liveListUpdates,
		listType,
		maxCharLimit,
		parsedQueryModel,
		popover,
		quickEditSysId,
		scrollHandlerThrottle,
		selectedRecords,
		exceptedRecords,
		selectionCount,
		table,
		wordWrap,
		customCellRenderer,
		isGlideQuery,
		nonGlideFilterProps
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
	const openRecordIndex = findOpenRecordIndex(
		gridModel,
		isRefList,
		isGridEmpty
	);

	const headerFeatureFlags = {
		hideSelectAll,
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
		hideRowSelector,
		hideQuickEdit,
		hideCellFilter,
		cellFeatureFlags
	};

	const recordCount = get(gridModel, MODEL_PATH.LAYOUT_QUERY.COUNT, 0);
	const hasSelectAllStatusBar =
		allSelectedOnPage &&
		!hideSelectAll &&
		recordCount !== allSysIdsOnPage.length;

	let nowTableRef = null;
	const nowTableReturnFocus = () => {
		if (nowTableRef) {
			setTimeout(() => nowTableRef.focus());
		}
	};
	const initialWidths = state.initialWidths;

	const tableClassName = columnsResized
		? 'sn-list-table resized'
		: 'sn-list-table';

	return (
		<div
			id="gridcontainer"
			tabindex="-1"
			className={'sn-list-body'}
			ref={el => {
				nowTableRef = el;
			}}>
			{loading ? renderSpinnerContainer(LIST_LOADER_SIZE_LG) : null}
			<div
				className={GRID_OVERFLOW_CONTAINER_CLASS}
				on-scroll={throttle(() => {
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
				<table role="grid" className={tableClassName}>
					<caption className="sr-only">{ariaTitle}</caption>
					{renderGridHeader({
						allRecordsSelected,
						recordCount,
						columns,
						focusHandler: headerFocusHandler,
						dispatch,
						allSysIdsOnPage,
						hasSelectAllStatusBar,
						selectedRecords,
						exceptedRecords,
						selectionCount,
						allSelectedOnPage,
						parsedQueryModel,
						headerFeatureFlags,
						isGrouped: false,
						defaultGroupToggleState: false,
						isGridEmpty,
						isGlideQuery,
						nonGlideFilterProps,
						nowTableReturnFocus,
						gridModel,
						columnWidths,
						hideColumnResizing,
						initialWidths,
						headerRows: state.headerRows,
						columnProps: state.columnProps
					})}
					{renderBody({
						allRecordsSelected,
						gridModel,
						wordWrap,
						openRecordIndex,
						inlineEditingEnabled,
						isRefList,
						hasSelectAllStatusBar,
						listInstanceId,
						liveListUpdates,
						maxCharLimit,
						selectedRecords,
						exceptedRecords,
						selectionCount,
						bodyFeatureFlags,
						quickEditSysId,
						dispatch,
						checkedRowIndex,
						hideLinks,
						hideLiveList,
						hideHighlightedValues,
						hideCheckboxHover,
						hideCellFilter,
						highlightContent,
						customCellRenderer,
						headerColumns: state.headerColumns
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

export const findGridScrollContainer = (root = document) => {
	if (root.shadowRoot) root = root.shadowRoot;
	const scrollContainer = root.querySelector(
		`.${GRID_OVERFLOW_CONTAINER_CLASS}`
	);

	return scrollContainer;
};

/**
 * A component that displays data in a grid or table format. This includes a grid header row containing column titles
 * and body rows of cells containing data.
 *
 * ```
 * <now-table {...gridProps} />
 * ```
 *
 * @seismicElement now-table
 * @summary A component that displays data in a grid or table format. This includes a grid header row containing column
 * titles and body rows of cells containing data.
 */
createCustomElement('now-table', {
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
	behaviors: [gridControls, dirtyBehavior, truncationBehavior, tooltipBehavior],
	properties: {
		hideCellFilter: {},
		hideCheckboxHover: {},
		hideColumnFiltering: {},
		hideColumnGrouping: {},
		hideColumnSorting: {},
		hideColumnResizing: {},
		hideLinks: {},
		hideLiveList: {},
		hideHighlightedValues: {},
		hideQuickEdit: {},
		hideRowSelector: {},
		hideSelectAll: {},
		hideEmptyStateImage: {},
		hideShiftRecordSelection: {},
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
		 * Row index of the last checkbox clicked. Used for shift-clicking checkboxes.
		 * @type {number}
		 */
		checkedRowIndex: {default: -1},
		/**
		 * An array of strings representing the unique ID's of each row that is selected while allRecordsSelected is false.
		 * @type {string[]}
		 */
		selectedRecords: {default: []},
		/**
		 * An array of strings representing the unique ID's of each row that is unselected while allRecordsSelected is true.
		 * @type {string[]}
		 */
		exceptedRecords: {default: []},
		/**
		 * Indicates whether all records across all lists have been selected
		 * @type {boolean}
		 */
		allRecordsSelected: {default: false},
		/**
		 * Indicates whether all records on a current page have been selected.
		 * @type {boolean}
		 */
		allSelectedOnPage: {
			computed({
				properties: {allRecordsSelected, gridModel, selectedRecords = []}
			}) {
				const allSysIdsOnPage = get(
					gridModel,
					MODEL_PATH.LAYOUT_QUERY.ALL_SYS_IDS,
					[]
				);
				return (
					allRecordsSelected ||
					(selectedRecords.length > 0 &&
						difference(allSysIdsOnPage, selectedRecords).length === 0)
				);
			}
		},
		/**
		 * The number of records selected.
		 * @type {number}
		 */
		selectionCount: {default: 0},
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
		 * A flag that indicates a user is in the middle of either quick-editing or multi-editing record(s) from the grid.
		 * @type {boolean}
		 */
		isDirty: {default: false},
		/**
		 * A flag that indicates that the column filtering uses a Glide Query
		 * @type {boolean}
		 */
		isGlideQuery: {default: true},
		/**
		 * represents model that is used for non glide query filtering
		 * @type {isGlideQuery: {boolean}, comparisonIdMap: {Object}}
		 */
		nonGlideFilterProps: {
			default: {
				comparisonIdMap: {}
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
	actionHandlers,
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
	onConnect(host, {dispatch}) {
		addRetainedElement(
			`${host.listInstanceId}_grid_overflow`,
			findGridScrollContainer(host)
		);
		dispatch(UPDATE_COLPROPS_HEADERROWS);
	},
	onDisconnect() {
		clearClickHandler(CLICK_HANDLER_POPOVER);
	},
	initialState: {
		headerRows: [],
		columnProps: new WeakMap(),
		headerColumns: undefined
	},
	styles: styles
});
