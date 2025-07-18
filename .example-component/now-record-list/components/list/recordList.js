import '../nowGrid/overlay/components/loadingOverlay';
import focusBehavior from '@servicenow/behavior-focus';
import tooltipBehavior from '@servicenow/behavior-tooltip';
import truncationBehavior from '@servicenow/behavior-truncation';
import gridCommons from '@servicenow/now-grid-commons';
import {createCustomElement} from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';
import cuid from 'cuid';
import flow from 'lodash/flow';
import get from 'lodash/get';
import {SnTimeAgo} from 'sn-component-timeago';

import {dirtyBehavior} from '../../behaviors/dirtyBehavior/dirtyBehavior';
import {dirtyModalBehavior} from '../../behaviors/dirtyBehavior/dirtyModalBehavior';
import formLoadBehavior from '../../behaviors/formLoadBehavior';
import {gridControls} from '../../behaviors/gridControls';
import listCountBehavior from '../../behaviors/listCountBehavior';
import {default as modalBehaviors} from '../../behaviors/modalBehavior';
import {
	EMPTY_BULK_FOCUS,
	GRID_CELL_MAXCHAR,
	LIST_TYPE_DEFAULT
} from '../../constants';
import {default as flags} from '../featureFlags/default';
import * as _columnDragDropPlugin from '../nowGrid/columnDragDrop/columnDragDrop';
import * as _colResizingPlugin from '../nowGrid/columnResizing/colResizing';
import * as _featureFlagPlugin from '../nowGrid/featureFlags/featureFlags';
import {
	groupByBehavior,
	groupByPluginSelectors
} from '../nowGrid/groupBy/groupBy';
import * as _recordDataPlugin from '../nowGrid/recordDataTransform/recordDataTransform';
import * as _rowSelectorPlugin from '../nowGrid/rowSelection/rowSelection';
import * as _sortingPlugin from '../nowGrid/sorting/sorting';

import {
	bootStrapActionHandler,
	listActionHandlers
} from './actions/listActions';
import {default as panelActionHandlers} from './actions/panelActions';
import styles from './list.scss';
import {getSelectionCount} from './listModifierUtils';
import {default as view} from './view';

const {
	dragDropPlugin: _dragDropPlugin,
	rowGroupingPlugin: _rowGroupingPlugin
} = gridCommons;

const timeAgoBehaviors = SnTimeAgo.getBehaviors();

const transformState = state => {
	const {applyStateTransformations} = state;
	return applyStateTransformations(state, [
		rowSelectionPlugin.transform,
		columnResizingPlugin.transform,
		featureFlagPlugin.transform,
		recordDataPlugin.transform,
		dragDropPlugin.transformState,
		rowGroupingPlugin.transformState,
		columnDragDropPlugin.transformState
	]);
};

const getEnableDragDrop = state => !state.properties.hideDragDrop;
const getDataPath = () => _recordDataPlugin.selectors.getDataPath();
const getRowId = row => get(row, 'rowMetaData.uniqueId', '');
const getSelectedRows = state => state.properties.selectedRecords;
const getCountIfSelected = row => {
	const selectionClass = 'is-checked';
	let selectedRowCount = 0;
	if (row.parentNode && row.classList.contains(selectionClass)) {
		let selectedRows = [...row.parentNode.rows].filter(item =>
			item.classList.contains(selectionClass)
		);
		selectedRowCount = selectedRows.length;
	}
	return selectedRowCount;
};

const recordDataPlugin = _recordDataPlugin.instantiatePlugin();
const rowSelectionPlugin = _rowSelectorPlugin.instantiatePlugin();
const columnResizingPlugin = _colResizingPlugin.instantiatePlugin();
const featureFlagPlugin = _featureFlagPlugin.instantiatePlugin();

const dragDropPlugin = _dragDropPlugin.instantiatePlugin({
	selectors: {
		getEnabled: getEnableDragDrop,
		getDataPath,
		getRowId,
		getSelectedRows,
		getCountIfSelected,
		transformState
	}
});

const sortingPlugin = _sortingPlugin.instantiatePlugin();

const rowGroupingPlugin = _rowGroupingPlugin.instantiatePlugin({
	selectors: groupByPluginSelectors
});

const columnDragDropPlugin = _columnDragDropPlugin.instantiatePlugin();

const NOW_RECORD_LIST = 'now-record-list';

createCustomElement(NOW_RECORD_LIST, {
	renderer: {
		type: snabbdom,
		view,
		transformState
	},
	initialState: {
		useNowGrid: true,
		/**
		The default value(i.e. false) indicates to update focus and tabbables after now-grid component tree rendered.
        Once the required work is done by the renderer effect, the value will be set to true.
		 */
		isRendered: false,
		bulkFocus: {
			...EMPTY_BULK_FOCUS
		},
		inlineEditorPrefetchState: {},
		applyStateTransformations: (state, transforms) => flow(transforms)(state)
	},
	properties: {
		actionConfigId: {default: ''},
		allRecordsSelected: {default: false},
		cellOverrides: {default: {}},
		customCellRenderer: {
			default: {
				get: () => false
			}
		},
		columns: {default: ''},
		conditions: {default: ''},
		daModel: {default: {}},
		dataUpdatedTime: {},
		declarativeActions: {default: []},
		error: {default: null},
		fixedQuery: {default: {}},
		highlightContent: {default: {patterns: [], color: ''}},
		inlineEditingEnabled: {default: false},
		instanceId: {default: cuid()},
		isListEditable: {default: false},
		isRefList: {},
		isWorkspace: {default: false},
		inlineEditorPrefetchData: {default: {}},
		limit: {default: 20},
		listMenuOpen: {default: false},
		listModel: {default: {}},
		listTitle: {default: ''},
		listType: {default: LIST_TYPE_DEFAULT},
		liveLists: {default: false},
		liveListUpdates: {default: {}},
		liveListCount: {default: 0},
		loading: {default: true},
		originalConditions: {default: ''},
		maxCharLimit: {default: GRID_CELL_MAXCHAR},
		maxColumns: {default: 0},
		columnWidths: {default: []},
		columnWidthsResetRequested: {default: {timestamp: Date.now()}},
		columnsResized: {default: false},
		menuSelection: {default: ''},
		modalProps: {},
		orderBy: {
			default: {
				columnName: undefined,
				isDescending: undefined
			}
		},
		opened: {default: false},
		page: {default: 1},
		panelConfig: {default: {}},
		panelOpened: {default: false},
		parentRecordSysId: {default: ''},
		parentTable: {default: ''},
		parsedQueryModel: {default: {}},
		quickEditSysId: {default: ''},
		refreshRequested: {default: {}},
		relatedListName: {default: ''},
		recordStatusChanged: {default: {}}, // Potentially update this to a computed component
		scrollHandlerThrottle: {default: 1000},
		selectedListId: {default: ''},
		selectedRecords: {default: []},
		exceptedRecords: {default: []},
		selectionCount: {
			computed: state => getSelectionCount(state)
		},
		slotComponent: {},
		table: {default: ''},
		tableLabel: {default: ''},
		cascadeDelete: {default: {}},
		timeAccessed: {default: Date.now()},
		transitoryLimit: {default: 20},
		transitoryPage: {default: 1},
		updateListMenuQuery: {default: {}}, // This is passed in from a listen to above
		userPreferences: {default: []},
		userRoles: {default: []},
		useNewConditionBuilder: {default: true},
		view: {default: ''},
		wordWrap: {},
		workspaceConfigId: {default: ''},
		isDirty: {default: false},
		dropZone: {default: 'table-body'},
		additionalDropZones: {default: []},
		shouldExcludeOperators: {default: false},
		landmark: {default: true}
	},
	actionHandlers: {
		...listActionHandlers,
		...panelActionHandlers,
		...bootStrapActionHandler
	},
	styles,
	behaviors: [
		truncationBehavior,
		focusBehavior,
		tooltipBehavior,
		flags,
		modalBehaviors,
		dirtyBehavior,
		dirtyModalBehavior,
		formLoadBehavior,
		gridControls,
		{behavior: recordDataPlugin.behavior},
		{behavior: rowSelectionPlugin.behavior},
		{behavior: columnResizingPlugin.behavior},
		{behavior: sortingPlugin.behavior},
		{behavior: groupByBehavior},
		{behavior: featureFlagPlugin.behavior},
		{
			behavior: dragDropPlugin.behavior,
			options: dragDropPlugin.options
		},
		{
			behavior: columnDragDropPlugin.behavior,
			options: columnDragDropPlugin.options
		},
		{behavior: rowGroupingPlugin.behavior},
		...timeAgoBehaviors,
		listCountBehavior
	]
});

export default NOW_RECORD_LIST;
