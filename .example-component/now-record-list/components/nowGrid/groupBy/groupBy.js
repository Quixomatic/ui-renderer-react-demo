import gridCommons from '@servicenow/now-grid-commons';
import {actionTypes} from '@servicenow/ui-core';
import findIndex from 'lodash/findIndex';
import get from 'lodash/get';
import isNull from 'lodash/isNull';
import split from 'lodash/split';
import xor from 'lodash/xor';

import {UPDATE_TABBABLES} from '../../../behaviors/constants';
import {dirtyModalInterceptor} from '../../../behaviors/dirtyBehavior/dirtyBehavior';
import {
	BUTTON_CLICKED,
	BUTTON_GROUP_ALL_TOGGLE,
	BUTTON_GROUP_TOGGLE,
	GRID_ADD_GROUPBY,
	GRID_CLOSE_POPOVER,
	GRID_REMOVE_GROUPBY,
	LIST_ADD_GROUPBY,
	LIST_REMOVE_GROUPBY,
	METRIC_TRACKED,
	PREF_GROUP_TOGGLE,
	PREF_GROUP_TOGGLE_ALL
} from '../../../constants';
import {
	APPLY_GROUP_BY_EVENT,
	REMOVE_GROUP_BY_EVENT
} from '../../../utils/metrics/constants';
import * as _recordDataPlugin from '../recordDataTransform/recordDataTransform';

const {COMPONENT_PROPERTY_CHANGED} = actionTypes;

const {rowGroupingPlugin} = gridCommons;

export const PLUGIN_NAME = 'gridGroupBy';
export const BEHAVIOR_PATH = ['behaviors', PLUGIN_NAME];
export const OPTIONS_PATH = ['options', PLUGIN_NAME];

export const UPDATE_TABBABLES_DEBOUNCED = 'UPDATE_TABBABLES_DEBOUNCED';

export const groupByPluginSelectors = {
	getEnabled: state =>
		get(state, 'options.recordData.listModel.tableMetadata.isGrouped', false),

	getIsAllGroupsCollapsed: state => {
		const {
			properties: {table},
			groupCollapsedDefault
		} = state;

		// Check for existence, not falsy
		if (groupCollapsedDefault !== undefined) return groupCollapsedDefault;

		const groupByColumn = get(
			state,
			'properties.listModel.tableMetadata.groupedColumn'
		);

		const userPreferences = get(state, 'properties.listModel.preferenceData');
		const preferenceName = `workspace.list.${table}.groupBy.${groupByColumn}.defaultAsOpen`;
		const prefIndex = findIndex(userPreferences, pref => {
			return pref.name === preferenceName;
		});

		if (prefIndex < 0) return true;

		const userPrefValue = get(userPreferences, `${prefIndex}.value`);

		if (isNull(userPrefValue)) return true;

		return userPrefValue === 'true';
	},
	getCollapsedGroupIds: state => {
		const {
			properties: {table},
			collapsedGroupIdsExceptions
		} = state;

		if (collapsedGroupIdsExceptions !== undefined)
			return collapsedGroupIdsExceptions;

		const groupByColumn = get(
			state,
			'properties.listModel.tableMetadata.groupedColumn'
		);

		const userPreferences = get(state, 'properties.listModel.preferenceData');
		const preferenceName = `workspace.list.${table}.groupBy.${groupByColumn}.exceptions`;
		const prefIndex = findIndex(userPreferences, pref => {
			return pref.name === preferenceName;
		});

		if (prefIndex < 0) return [];

		const exceptions = get(userPreferences, `${prefIndex}.value`, '');

		if (!exceptions) return [];

		return split(exceptions, ',');
	},

	updateCollapsedGroupIds: (
		state,
		groupKey,
		collapsedGroupIdsExceptions = []
	) => {
		return xor(collapsedGroupIdsExceptions, [groupKey]);
	},

	getGroupedRowData: state => {
		return _recordDataPlugin.selectors.getDataFromBehavior(state);
	},

	setIsCollapsed: (state, rows, collapsedDefault, collapsedRows) => {
		const collapsedRowSet = new Set(collapsedRows);
		rows.forEach(row => {
			row.isCollapsed = collapsedRowSet.has(row.groupKey)
				? !collapsedDefault
				: collapsedDefault;
		});

		collapsedRowSet.clear();

		return {
			...state,
			options: {
				...state.options,
				collapsedDefault,
				collapsedRows
			}
		};
	}
};

export const groupByBehavior = {
	name: PLUGIN_NAME,
	actionHandlers: {
		[GRID_ADD_GROUPBY]: {
			effect: coeffects => {
				const {action, dispatch} = coeffects;
				const {
					payload: {field}
				} = action;
				dispatch(GRID_CLOSE_POPOVER);

				const metadata = {field};
				dispatch(METRIC_TRACKED, {eventName: APPLY_GROUP_BY_EVENT, metadata});
				dispatch(LIST_ADD_GROUPBY, {
					field
				});
			},
			stopPropagation: true,
			interceptors: [dirtyModalInterceptor]
		},
		[GRID_REMOVE_GROUPBY]: {
			effect: coeffects => {
				const {
					dispatch,
					action: {
						payload: {field}
					}
				} = coeffects;
				dispatch(GRID_CLOSE_POPOVER);
				const metadata = {field};
				dispatch(METRIC_TRACKED, {eventName: REMOVE_GROUP_BY_EVENT, metadata});
				dispatch(LIST_REMOVE_GROUPBY);
			},
			stopPropagation: true,
			interceptors: [dirtyModalInterceptor]
		},
		[BUTTON_CLICKED]: {
			effect: coeffects => {
				const {
					dispatch,
					action,
					action: {
						payload: {groupToggleType}
					}
				} = coeffects;
				switch (groupToggleType) {
					case BUTTON_GROUP_TOGGLE: {
						const groupKey = get(action, 'payload.groupKey');
						dispatch(rowGroupingPlugin.actions.TOGGLE_GROUP_ROW, {
							groupKey
						});
						break;
					}
					case BUTTON_GROUP_ALL_TOGGLE: {
						const groupsCollapsed = get(action, 'payload.groupsCollapsed');
						dispatch(rowGroupingPlugin.actions.TOGGLE_ALL_GROUPS_ROWS, {
							isAllCollapsed: groupsCollapsed
						});
						break;
					}
				}
			},
			stopPropagation: true
		},
		[rowGroupingPlugin.actions.ALL_GROUP_ROW_TOGGLED]: {
			effect: coeffects => {
				const {
					properties: {listModel, table},
					action: {
						payload: {isAllCollapsed}
					},
					dispatch
				} = coeffects;
				const column = get(listModel, 'tableMetadata.groupedColumn');
				dispatch(PREF_GROUP_TOGGLE_ALL, {
					table,
					column,
					value: isAllCollapsed
				});
				dispatch(UPDATE_TABBABLES_DEBOUNCED); //
			},
			stopPropagation: true
		},
		[UPDATE_TABBABLES_DEBOUNCED]: {
			effect: coeffects => {
				coeffects.dispatch(UPDATE_TABBABLES, {skipRefocus: true});
			},
			modifier: {name: 'debounce', delay: 50},
			stopPropagation: true
		},
		[rowGroupingPlugin.actions.GROUP_ROW_TOGGLED]: {
			effect: coeffects => {
				const {
					properties: {listModel, table},
					action: {
						payload: {updatedGroupIds}
					},
					dispatch
				} = coeffects;
				const column = get(listModel, 'tableMetadata.groupedColumn');
				dispatch(PREF_GROUP_TOGGLE, {
					table,
					column,
					preference: {
						name: `workspace.list.${table}.groupBy.${column}.exceptions`,
						value: updatedGroupIds.join(',')
					}
				});
				dispatch(UPDATE_TABBABLES_DEBOUNCED);
			},
			stopPropagation: true
		},
		[COMPONENT_PROPERTY_CHANGED]: {
			effect: coeffects => {
				const {
					action: {
						payload: {name}
					},
					updateState
				} = coeffects;

				if (name === 'listModel') {
					updateState([
						{
							path: 'groupCollapsedDefault',
							value: undefined,
							operation: 'set'
						},
						{
							path: 'collapsedGroupIdsExceptions',
							value: undefined,
							operation: 'set'
						}
					]);
				}
			}
		}
	}
};
