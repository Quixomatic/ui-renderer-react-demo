import focusBehavior from '@servicenow/behavior-focus';
import gridCommons from '@servicenow/now-grid-commons';
import {createCustomElement} from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';
import cuid from 'cuid';
import flow from 'lodash/flow';
import {SnTimeAgo} from 'sn-component-timeago';

import {dirtyBehavior} from '../../behaviors/dirtyBehavior/dirtyBehavior';
import {dirtyModalBehavior} from '../../behaviors/dirtyBehavior/dirtyModalBehavior';
import {gridControls} from '../../behaviors/gridControls';
import listCountBehavior from '../../behaviors/listCountBehavior';
import {default as modalBehaviors} from '../../behaviors/modalBehavior';
import {
	EMPTY_BULK_FOCUS,
	GRID_CELL_MAXCHAR,
	LIST_TYPE_SNAPSHOT
} from '../../constants';
import {default as flags} from '../featureFlags/snapshot';
import {
	bootStrapActionHandler,
	listActionHandlers
} from '../list/actions/listActions';
import * as _columnDragDropPlugin from '../nowGrid/columnDragDrop/columnDragDrop';
import * as _featureFlagPlugin from '../nowGrid/featureFlags/featureFlags';
import {
	groupByBehavior,
	groupByPluginSelectors
} from '../nowGrid/groupBy/groupBy';
import * as _recordDataPlugin from '../nowGrid/recordDataTransform/recordDataTransform';
import * as _rowSelectorPlugin from '../nowGrid/rowSelection/rowSelection';
import * as _sortingPlugin from '../nowGrid/sorting/sorting';

import styles from './list.scss';
import {getSelectionCount} from './listModifierUtils';
import {default as view} from './view';
const recordDataPlugin = _recordDataPlugin.instantiatePlugin();
const rowSelectionPlugin = _rowSelectorPlugin.instantiatePlugin();
const featureFlagPlugin = _featureFlagPlugin.instantiatePlugin();

const {rowGroupingPlugin: _rowGroupingPlugin} = gridCommons;
const timeAgoBehaviors = SnTimeAgo.getBehaviors();
const rowGroupingPlugin = _rowGroupingPlugin.instantiatePlugin({
	selectors: groupByPluginSelectors
});

const sortingPlugin = _sortingPlugin.instantiatePlugin();
const columnDragDropPlugin = _columnDragDropPlugin.instantiatePlugin();

const NOW_RECORD_LIST_SNAPSHOT = 'now-record-list-snapshot';

createCustomElement(NOW_RECORD_LIST_SNAPSHOT, {
	renderer: {
		type: snabbdom,
		view
	},
	initialState: {
		useNowGrid: true,
		inlineEditorPrefetchState: {},
		bulkFocus: {
			...EMPTY_BULK_FOCUS
		},
		applyStateTransformations: (state, transforms) => flow(transforms)(state)
	},
	properties: {
		actionConfigId: {default: ''},
		allRecordsSelected: {default: false},
		cellOverrides: {default: {}},
		columns: {default: ''},
		conditions: {default: ''},
		daModel: {default: {}},
		dataUpdatedTime: {},
		declarativeActions: {default: []},
		error: {default: null},
		fixedQuery: {default: {}},
		highlightContent: {default: {patterns: [], color: ''}},
		inlineEditingEnabled: {default: false},
		inlineEditorPrefetchData: {default: {}},
		instanceId: {default: cuid()},
		isRefList: {},
		isWorkspace: {default: false},
		limit: {default: 5},
		listMenuOpen: {default: false},
		listModel: {default: {}},
		listTitle: {default: ''},
		listType: {default: LIST_TYPE_SNAPSHOT},
		loading: {default: true},
		originalConditions: {default: ''},
		maxCharLimit: {default: GRID_CELL_MAXCHAR},
		maxColumns: {default: 5},
		columnWidths: {default: []},
		columnWidthsResetRequested: {default: {timestamp: Date.now()}},
		columnsResized: {default: false},
		menuSelection: {default: ''},
		orderBy: {
			default: {
				columnName: undefined,
				isDescending: undefined
			}
		},
		page: {default: 1},
		panelConfig: {default: {}},
		panelOpened: {default: false},
		parentRecordSysId: {default: ''},
		parentTable: {default: ''},
		parsedQueryModel: {default: {}},
		quickEditSysId: {default: ''},
		recordStatusChanged: {default: {}}, // Potentially update this to a computed component
		relatedListName: {default: ''},
		scrollHandlerThrottle: {default: 1000},
		selectedListId: {default: ''},
		selectedRecords: {default: []},
		exceptedRecords: {default: []},
		selectionCount: {
			computed: state => getSelectionCount(state)
		},
		table: {default: ''},
		tableLabel: {default: ''},
		timeAccessed: {default: Date.now()},
		transitoryLimit: {default: 5},
		transitoryPage: {default: 1},
		updateListMenuQuery: {default: {}}, // This is passed in from a listen to above
		userPreferences: {default: []},
		view: {default: ''},
		wordWrap: {},
		workspaceConfigId: {default: ''},
		isDirty: {default: false},
		shouldExcludeOperators: {default: false},
		landmark: {default: true}
	},
	styles,
	transformState(state) {
		const {applyStateTransformations} = state;
		return applyStateTransformations(state, [
			rowSelectionPlugin.transform,
			featureFlagPlugin.transform,
			recordDataPlugin.transform,
			rowGroupingPlugin.transformState,
			columnDragDropPlugin.transformState
		]);
	},
	actionHandlers: {
		...listActionHandlers,
		...bootStrapActionHandler
	},
	behaviors: [
		flags,
		modalBehaviors,
		dirtyBehavior,
		dirtyModalBehavior,
		focusBehavior,
		gridControls,
		{behavior: recordDataPlugin.behavior},
		{behavior: rowSelectionPlugin.behavior},
		{behavior: sortingPlugin.behavior},
		{
			behavior: columnDragDropPlugin.behavior,
			options: columnDragDropPlugin.options
		},
		{behavior: groupByBehavior},
		{behavior: featureFlagPlugin.behavior},
		{behavior: rowGroupingPlugin.behavior},
		...timeAgoBehaviors,
		listCountBehavior
	]
});

export default NOW_RECORD_LIST_SNAPSHOT;
