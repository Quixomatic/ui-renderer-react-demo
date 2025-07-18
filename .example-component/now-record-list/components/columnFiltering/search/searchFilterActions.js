import {NOW_GRID_CLOSE_POPOVER} from '@servicenow/now-grid';
import isEmpty from 'lodash/isEmpty';

import {
	ADD_FILTER_COMPARISON,
	BUTTON_CLICKED,
	DELETE_FILTER_COMPARISON,
	GRID_CLOSE_POPOVER,
	METRIC_TRACKED,
	MUTATE_FILTER_COMPARISON,
	PROPERTIES_SET
} from '../../../constants';
import {
	APPLY_COLUMN_FILTER_EVENT,
	REMOVE_COLUMN_FILTER_EVENT
} from '../../../utils/metrics/constants';
import {
	COL_FILTER_APPLY_BUTTON_CLICKED,
	COL_FILTER_INPUT_UPDATED,
	COL_FILTER_SEARCH_TEXT,
	FILTER_APPLY_BUTTON,
	FILTER_CLEAR_BUTTON
} from '../constants';

export default {
	[BUTTON_CLICKED]: {
		effect: ({dispatch, action, state}) => {
			const {
				meta: {componentName}
			} = action;
			const {
				field,
				operator,
				comparisonId,
				nowTableReturnFocus
			} = state.properties;

			if (componentName === FILTER_CLEAR_BUTTON) {
				const metadata = {field, operator, comparisonId};
				dispatch(METRIC_TRACKED, {
					eventName: APPLY_COLUMN_FILTER_EVENT,
					metadata
				});

				dispatch(DELETE_FILTER_COMPARISON, {field, comparisonId});
			}

			if (componentName === FILTER_APPLY_BUTTON) {
				const metadata = {field, operator, comparisonId};
				dispatch(METRIC_TRACKED, {
					eventName: REMOVE_COLUMN_FILTER_EVENT,
					metadata
				});

				dispatch(COL_FILTER_SEARCH_TEXT);
			}

			if (
				componentName === FILTER_CLEAR_BUTTON ||
				componentName === FILTER_APPLY_BUTTON
			) {
				dispatch(GRID_CLOSE_POPOVER);
				dispatch(NOW_GRID_CLOSE_POPOVER, {setParentFocus: true});
				nowTableReturnFocus();
			}
		},
		stopPropagation: true
	},
	[COL_FILTER_INPUT_UPDATED]: {
		effect: ({action: {payload}, dispatch}) => {
			dispatch(PROPERTIES_SET, payload);
		},
		stopPropagation: true
	},
	[COL_FILTER_APPLY_BUTTON_CLICKED]: {
		effect: ({action: {payload}, dispatch}) => {
			dispatch(BUTTON_CLICKED, payload);
		},
		stopPropagation: true
	},
	[COL_FILTER_SEARCH_TEXT]: {
		effect: ({dispatch, state}) => {
			const {
				properties: {comparisonId, field, inputValue}
			} = state;

			if (isEmpty(comparisonId)) {
				dispatch(ADD_FILTER_COMPARISON, {field, value: inputValue});
			} else {
				dispatch(MUTATE_FILTER_COMPARISON, {
					field,
					value: inputValue,
					comparisonId
				});
			}
			dispatch(NOW_GRID_CLOSE_POPOVER, {setParentFocus: true});
		}
	}
};
