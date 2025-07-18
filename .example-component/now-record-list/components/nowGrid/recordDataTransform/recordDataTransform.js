import gridCommons from '@servicenow/now-grid-commons';
import {actionTypes} from '@servicenow/ui-core';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import {UPDATE_FOCUS_AND_TABS} from '../../../behaviors/constants';
import {
	GRID_CELL_MAXCHAR,
	INLINE_EDITING_RESET_FOCUSED_CELLS,
	LIST_COUNT_STATUS,
	RESET_GRID_SCROLL,
	SYS_TAGS
} from '../../../constants';
import {areRowSelectorsNeeded} from '../../list/listUtils';
import {
	generateColumnDef,
	generateDataFromModel
} from '../utils/columnDefGenerator';

const {
	dragDropColumnsPlugin: {getReorderedColumnDefsDataPathDefault} = {}
} = gridCommons;

export const PLUGIN_NAME = 'recordData';
export const BEHAVIOR_PATH = ['behaviors', PLUGIN_NAME];
export const OPTIONS_PATH = ['options', PLUGIN_NAME];

const {COMPONENT_PROPERTY_CHANGED, COMPONENT_BOOTSTRAPPED} = actionTypes;
const getColDefsFromBehavior = state =>
	get(state, [...BEHAVIOR_PATH, 'colDefs'], []);
const getDataFromBehavior = state => get(state, [...BEHAVIOR_PATH, 'data'], []);

const getDataPath = () => [...BEHAVIOR_PATH, 'data'];
const getColDefs = state => get(state, ['colDefs'], {});
const getColDefPath = () => [...BEHAVIOR_PATH, 'colDefs'];
const getColDefOptionsPath = () => [...OPTIONS_PATH, 'colDefs'];
const getData = state => get(state, ['data'], false);

const getTable = state => get(state, [...OPTIONS_PATH, 'table'], '');
const getRefTable = state =>
	get(state, [...OPTIONS_PATH, 'listModel', 'layoutQuery', 'table'], '');
const getParsedQueryModel = state =>
	get(state, [...OPTIONS_PATH, 'parsedQueryModel'], {});
const getInstanceId = state => get(state, [...OPTIONS_PATH, 'instanceId'], '');
const getIsRefList = state => get(state, [...OPTIONS_PATH, 'isRefList'], false);

const getLiveListUpdates = state =>
	get(state, [...OPTIONS_PATH, 'liveListUpdates'], {});

const getInlineEditing = state =>
	get(state, [...OPTIONS_PATH, 'inlineEditingEnabled'], false);

const getInlineEditorPrefetchState = state =>
	get(state, [...OPTIONS_PATH, 'inlineEditorPrefetchState'], {});

const getWordWrap = state => get(state, [...OPTIONS_PATH, 'wordWrap'], false);

const getCount = state => get(state, [...OPTIONS_PATH, 'count'], 0);

const getMaxCharLimit = state =>
	get(state, [...OPTIONS_PATH, 'maxCharLimit'], GRID_CELL_MAXCHAR);

const getHighlightContent = state =>
	get(state, [...OPTIONS_PATH, 'highlightContent'], {});

const getUserPreferences = properties =>
	get(properties, [...OPTIONS_PATH, 'userPreferences'], []);

export const selectors = {
	getColDefsFromBehavior,
	getDataFromBehavior,
	getColDefs,
	getColDefPath,
	getColDefOptionsPath,
	getData,
	getTable,
	getRefTable,
	getParsedQueryModel,
	getInstanceId,
	getIsRefList,
	getLiveListUpdates,
	getInlineEditing,
	getInlineEditorPrefetchState,
	getWordWrap,
	getCount,
	getMaxCharLimit,
	getHighlightContent,
	getDataPath,
	getUserPreferences
};

/**
 * Transform to extract required variables into options based on list model
 */
export function instantiatePlugin() {
	return {
		transform(state) {
			const {
				properties: {
					table,
					parsedQueryModel,
					instanceId,
					isRefList,
					inlineEditingEnabled,
					liveListUpdates,
					wordWrap,
					listModel,
					maxCharLimit,
					highlightContent,
					loading,
					listType,
					headingLevel,
					hideEmptyStateImage,
					userPreferences
				},
				bulkFocus,
				behaviors: {
					recordData: {colDefs, data}
				},
				inlineEditorPrefetchState
			} = state;
			const count = get(listModel, 'layoutQuery.count', 0);
			return {
				...state,
				options: {
					...state.options,
					bulkFocus,
					recordData: {
						table,
						parsedQueryModel,
						inlineEditingEnabled,
						inlineEditorPrefetchState,
						instanceId,
						isRefList,
						liveListUpdates,
						wordWrap,
						listModel,
						maxCharLimit,
						highlightContent,
						loading,
						listType,
						headingLevel,
						hideEmptyStateImage,
						colDefs,
						data,
						count,
						userPreferences
					}
				}
			};
		},
		behavior: {
			name: PLUGIN_NAME,
			initialState: {},
			actionHandlers: {
				[COMPONENT_BOOTSTRAPPED]: ({
					properties: {
						listModel,
						listInstanceId,
						hideQuickEdit,
						hideDeclarativeActions,
						hideRowSelector,
						declarativeActions,
						hideUnnecessaryRowSelectors,
						hideCheckboxHover,
						cellOverrides = {}
					},
					updateState,
					dispatch
				}) => {
					if (!isEmpty(listModel)) {
						const shouldHideRowSelectors = !areRowSelectorsNeeded(
							hideRowSelector,
							hideDeclarativeActions,
							hideUnnecessaryRowSelectors,
							declarativeActions
						);

						const colDefs = generateColumnDef({
							listLayout: listModel,
							hideQuickEdit,
							shouldHideRowSelectors,
							hideCheckboxHover
						});
						const data = generateDataFromModel({
							listLayout: listModel,
							listInstanceId,
							cellOverrides
						});

						updateState({
							path: `behaviors.${PLUGIN_NAME}`,
							value: {colDefs, data},
							operation: 'set'
						});
						dispatch(UPDATE_FOCUS_AND_TABS);
						dispatch(RESET_GRID_SCROLL);
					}
				},
				[COMPONENT_PROPERTY_CHANGED]: ({
					properties: {
						listInstanceId,
						hideQuickEdit,
						hideDeclarativeActions,
						hideRowSelector,
						declarativeActions,
						hideUnnecessaryRowSelectors,
						hideCheckboxHover,
						cellOverrides = {},
						listModel,
						inlineEditorPrefetchData,
						listCount
					},
					action: {
						payload: {name, value}
					},
					updateState,
					dispatch
				}) => {
					if (name === 'listCount' && !isEmpty(value)) {
						// to prevent unncessary regneration of the data
						if (
							value.status !== LIST_COUNT_STATUS.SUCCESS ||
							isEmpty(value.groupedRowCounts)
						) {
							return;
						}

						const data = generateDataFromModel({
							listLayout: listModel,
							listInstanceId,
							cellOverrides,
							listCount
						});

						updateState({
							path: `behaviors.${PLUGIN_NAME}.data`,
							value: data,
							operation: 'set'
						});
					}

					if (name === 'listModel' || name === 'cellOverrides') {
						const shouldHideRowSelectors = !areRowSelectorsNeeded(
							hideRowSelector,
							hideDeclarativeActions,
							hideUnnecessaryRowSelectors,
							declarativeActions
						);

						const colDefs = generateColumnDef({
							listLayout: listModel,
							hideQuickEdit,
							shouldHideRowSelectors,
							hideCheckboxHover
						});
						const data = generateDataFromModel({
							listLayout: listModel,
							listInstanceId,
							cellOverrides,
							listCount
						});

						updateState({
							path: `behaviors.${PLUGIN_NAME}`,
							value: {colDefs, data},
							operation: 'set'
						});

						if (name === 'listModel') {
							// Clear reorder columns in column drag drop plugin when list Model changed.
							updateState({
								path: getReorderedColumnDefsDataPathDefault().join('.'),
								value: [],
								operation: 'set',
								shouldRender: false
							});
							dispatch(UPDATE_FOCUS_AND_TABS);
							dispatch(RESET_GRID_SCROLL);
							dispatch(INLINE_EDITING_RESET_FOCUSED_CELLS);
						} else {
							if (inlineEditorPrefetchData?.verifiedColumn === SYS_TAGS) return;
							dispatch(INLINE_EDITING_RESET_FOCUSED_CELLS, {
								keepLastFocus: true
							});
						}
					}
				}
			}
		}
	};
}
