import isEmpty from 'lodash/isEmpty';

import {dirtyModalInterceptor} from '../../../behaviors/dirtyBehavior/dirtyBehavior';
import {
	ADD_FILTER_COMPARISON,
	BARE_BUTTON_CLICKED,
	BUTTON_CLICKED,
	DELETE_FILTER_COMPARISON,
	METRIC_TRACKED,
	MUTATE_FILTER_COMPARISON,
	NOW_BUTTON_ICONIC_CLICKED,
	PROPERTIES_SET,
	TEXT_LINK_CLICKED
} from '../../../constants';
import {
	APPLY_COLUMN_FILTER_EVENT,
	REMOVE_COLUMN_FILTER_EVENT
} from '../../../utils/metrics/constants';
import {
	COL_FILTER_APPLY_BUTTON_CLICKED,
	COL_FILTER_INPUT_UPDATED,
	COL_FILTER_SELECTED,
	COL_FILTER_SUBMIT_QUERY,
	FILTER_APPLY_BUTTON,
	FILTER_CLEAR_BUTTON,
	FILTER_CLOSE_BUTTON
} from '../constants';
import {
	closeFilterPopOver,
	getTypeFilters,
	getValueForDispatch
} from '../helpers';

const buttonClickedEffect = ({dispatch, action, state}) => {
	const {
		meta,
		payload: {isRange, requiresInput, filterIndex}
	} = action;
	const {dateTimeFormat} = state.properties;

	const componentName = meta.componentName || action.payload.componentName;

	if (componentName === FILTER_APPLY_BUTTON) {
		dispatch(COL_FILTER_SUBMIT_QUERY, {
			isRange,
			requiresInput,
			filterIndex,
			dateTimeFormat
		});
	}
};

const bareButtonClickedEffect = coeffects => {
	const {dispatch, action, state} = coeffects;
	const {field, comparisonId, nowTableReturnFocus, operator} = state.properties;
	const componentName =
		action.meta.componentName || action.payload.componentName;
	if (componentName === FILTER_CLEAR_BUTTON) {
		const metadata = {field, operator, comparisonId};
		dispatch(METRIC_TRACKED, {
			eventName: REMOVE_COLUMN_FILTER_EVENT,
			metadata
		});
		dispatch(DELETE_FILTER_COMPARISON, {field, comparisonId});
		closeFilterPopOver(nowTableReturnFocus, dispatch);
	}
};

export default {
	[BUTTON_CLICKED]: {
		effect: buttonClickedEffect,
		stopPropagation: true,
		interceptors: [dirtyModalInterceptor]
	},
	[BARE_BUTTON_CLICKED]: {
		effect: bareButtonClickedEffect,
		stopPropagation: true,
		interceptors: [dirtyModalInterceptor]
	},
	[NOW_BUTTON_ICONIC_CLICKED]: {
		effect: ({dispatch, state, action}) => {
			const {nowTableReturnFocus} = state.properties;

			const componentName =
				action.meta.componentName || action.payload.componentName;

			if (componentName === FILTER_CLOSE_BUTTON) {
				closeFilterPopOver(nowTableReturnFocus, dispatch);
			}
		},
		stopPropagation: true
	},
	[TEXT_LINK_CLICKED]: {
		effect: ({dispatch, action}) => {
			const {
				payload: {actionName, field}
			} = action;

			dispatch(actionName, {field});
		},
		stopPropagation: true
	},
	[COL_FILTER_APPLY_BUTTON_CLICKED]: {
		effect: buttonClickedEffect,
		stopPropagation: true
	},
	[COL_FILTER_INPUT_UPDATED]: {
		effect: ({action: {payload}, dispatch}) => {
			dispatch(PROPERTIES_SET, payload);
		},
		stopPropagation: true
	},
	[COL_FILTER_SELECTED]: {
		effect: ({action: {payload}, dispatch}) => {
			dispatch(PROPERTIES_SET, {operator: payload});
		},
		stopPropagation: true
	},
	[COL_FILTER_SUBMIT_QUERY]: {
		effect: coeffects => {
			const {dispatch, action, state} = coeffects;
			const {
				properties: {
					comparisonId,
					dateTimeFormat,
					inputValue1,
					inputValue2,
					field,
					type,
					nowTableReturnFocus
				}
			} = state;
			const {
				payload: {requiresInput, isRange, filterIndex}
			} = action;
			const COL_TYPE_FILTERS = getTypeFilters(type);
			const operator = COL_TYPE_FILTERS[filterIndex].operator;
			const value = getValueForDispatch({
				type,
				field,
				operator,
				requiresInput,
				isRange,
				inputValue1,
				inputValue2,
				dateTimeFormat
			});

			const metadata = {comparisonId, field, operator};
			dispatch(METRIC_TRACKED, {
				eventName: APPLY_COLUMN_FILTER_EVENT,
				metadata
			});

			if (isEmpty(comparisonId)) {
				dispatch(ADD_FILTER_COMPARISON, {
					value,
					field,
					operator
				});
			} else {
				dispatch(MUTATE_FILTER_COMPARISON, {
					value,
					field,
					operator,
					comparisonId
				});
			}
			closeFilterPopOver(nowTableReturnFocus, dispatch);
		}
	}
};
