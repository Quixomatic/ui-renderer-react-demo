import {actionTypes} from '@servicenow/ui-core';
import {createGraphQLEffect} from '@servicenow/ui-effect-graphql';
import filter from 'lodash/filter';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isUndefined from 'lodash/isUndefined';

import {
	ADD_COMPLEX_FILTER_COMPARISON,
	BARE_BUTTON_CLICKED,
	BUTTON_CLICKED,
	DELETE_COMPLEX_FILTER_COMPARISON,
	METRIC_TRACKED,
	MUTATE_COMPLEX_FILTER_COMPARISON,
	NOW_BUTTON_ICONIC_CLICKED,
	TEXT_LINK_CLICKED,
	UPDATE_FOCUS_TRAP
} from '../../../constants';
import {
	APPLY_COLUMN_FILTER_EVENT,
	REMOVE_COLUMN_FILTER_EVENT
} from '../../../utils/metrics/constants';
import {LISTBOX_SELECTED_CHANGE} from '../../listbox/constants';
import {
	CHOICE_FILTER_CLEAR_INPUT_VALUE,
	CHOICE_FILTER_GRAPHQL_EFFECT,
	CHOICE_FILTER_GRAPHQL_EFFECT_RESULT,
	CHOICE_FILTER_RESET,
	CHOICE_FILTER_SELECT_ALL_BUTTON,
	CHOICE_FILTER_SELECT_NONE_BUTTON,
	CHOICE_FILTER_SET_STATE,
	COL_FILTER_INPUT_UPDATED,
	COL_FILTER_SUBMIT_QUERY,
	FILTER_APPLY_BUTTON,
	FILTER_CLEAR_BUTTON,
	FILTER_CLOSE_BUTTON,
	FILTER_SELECT_ALL_BUTTON,
	FILTER_SELECT_NONE_BUTTON
} from '../constants';
import {closeFilterPopOver} from '../helpers';

import {
	cacheChoices,
	enableAllChoiceValues,
	getCachedChoices,
	getChoicesFromPayload,
	getErrorsFromPayload,
	getOperator
} from './choiceHelpers';

const {COMPONENT_CONNECTED, COMPONENT_BOOTSTRAPPED} = actionTypes;

// TODO: revist this. Should be inside connected instead when we rearchitecture.
export const choiceColumnQuery = `query($table: String!, $column: String!) {
	GlideChoiceColumn_Query {
		  choices: getChoiceFields(table: $table, column: $column) {
		rawValue,
		displayValue,
		isDisabled
	  }
	}
  }`;

/*
GRAPHQL EFFECTS
*/
const choiceFilterGragphQLEffect = createGraphQLEffect(choiceColumnQuery, {
	variableList: ['table', 'column'],
	successActionType: CHOICE_FILTER_GRAPHQL_EFFECT_RESULT,
	errorActionType: CHOICE_FILTER_GRAPHQL_EFFECT_RESULT
});

/*
EFFECTS
*/
const choiceFilterFetchChoicesEffect = ({state, dispatch}) => {
	const {table, field, selectedChoices} = state.properties;

	const initialChoices = getCachedChoices(table, field);
	const isCached = !isUndefined(initialChoices);

	if (isCached) {
		const defaultSelected = initialChoices.map(choice => choice.rawValue);
		const selChoices = isEmpty(selectedChoices)
			? [...defaultSelected]
			: [...selectedChoices];
		dispatch(CHOICE_FILTER_SET_STATE, {
			properties: {loading: false, selectedChoices: selChoices},
			state: {
				initialChoices,
				defaultSelected,
				originalSelected: [...selChoices].sort().join()
			}
		});
	} else dispatch(CHOICE_FILTER_GRAPHQL_EFFECT, {table, column: field});
};

const choiceFilterResetEffect = ({state, dispatch}) => {
	dispatch(CHOICE_FILTER_SET_STATE, {
		state: {
			initialChoices: [],
			filteredChoices: [],
			inputValue: '',
			errors: [],
			properties: {
				loading: true
			}
		}
	});
	choiceFilterFetchChoicesEffect({state, dispatch});
};

const choiceFilterSetOriginalEffect = ({state, dispatch}) => {
	const {
		properties: {comparisonMap, table, field}
	} = state;
	const initialChoices = getCachedChoices(table, field);

	if (isEmpty(comparisonMap) && !isEmpty(initialChoices)) {
		dispatch(CHOICE_FILTER_SET_STATE, {
			state: {
				initialChoices: enableAllChoiceValues(initialChoices)
			}
		});
	}
};

const choiceFilterGraphQLResultEffect = ({
	state,
	action,
	updateState,
	updateProperties
}) => {
	const {table, field, selectedChoices} = state.properties;
	const {payload} = action;

	const errors = getErrorsFromPayload(payload);
	const hasErrors = !isEmpty(errors);
	const initialChoices = getChoicesFromPayload(payload);

	if (!hasErrors && initialChoices) cacheChoices(table, field, initialChoices);
	const defaultSelected = initialChoices.map(choice => choice.rawValue);
	const selChoices = isEmpty(selectedChoices)
		? [...defaultSelected]
		: [...selectedChoices];

	const stateToSet = hasErrors
		? {errors}
		: {
				initialChoices,
				defaultSelected,
				originalSelected: [...selChoices].sort().join()
		  };

	updateProperties({loading: false, selectedChoices: selChoices});
	updateState({...stateToSet});
};

const choiceFilterSelectOptionEffect = ({
	action: {
		payload: {selectedChoices, prevChoices}
	},
	dispatch
}) => {
	dispatch(CHOICE_FILTER_SET_STATE, {
		properties: {selectedChoices, prevChoices}
	});
	dispatch(UPDATE_FOCUS_TRAP);
};

const choiceFilterSetStateEffect = ({
	action,
	updateState,
	updateProperties
}) => {
	const stateToSpread = get(action, 'payload.state', {});
	const propertiesToSpread = get(action, 'payload.properties', {});

	updateProperties({...propertiesToSpread});
	updateState({...stateToSpread});
};

const choiceFilteringEffect = ({
	action: {
		payload: {inputValue}
	},
	dispatch,
	state: {initialChoices}
}) => {
	const filteredChoices = initialChoices.filter(choice =>
		choice.displayValue.toLowerCase().includes(inputValue.toLowerCase())
	);
	dispatch(CHOICE_FILTER_SET_STATE, {
		state: {filteredChoices, inputValue}
	});
};

const choiceFilteringSelectAllEffect = ({
	dispatch,
	state: {
		properties: {inputValue, selectedChoices},
		initialChoices,
		filteredChoices
	}
}) => {
	const availableChoices =
		!inputValue || inputValue.length === 0 ? initialChoices : filteredChoices;
	const rawAvailableChoices = availableChoices.map(choice => choice.rawValue);
	dispatch(CHOICE_FILTER_SET_STATE, {
		properties: {
			selectedChoices: [
				...new Set([...rawAvailableChoices, ...selectedChoices])
			]
		}
	});
	dispatch(UPDATE_FOCUS_TRAP);
};

const choiceFilteringSelectNoneEffect = ({
	dispatch,
	state: {
		properties: {inputValue, selectedChoices},
		initialChoices,
		filteredChoices
	}
}) => {
	const availableChoices =
		!inputValue || inputValue.length === 0 ? initialChoices : filteredChoices;
	const rawAvailableChoices = availableChoices.map(choice => choice.rawValue);

	dispatch(CHOICE_FILTER_SET_STATE, {
		state: {
			initialChoices: enableAllChoiceValues(initialChoices)
		},
		properties: {
			selectedChoices: filter(
				selectedChoices,
				choice => !rawAvailableChoices.includes(choice)
			)
		}
	});
	dispatch(UPDATE_FOCUS_TRAP);
};

export default {
	[COMPONENT_BOOTSTRAPPED]: {
		effect: choiceFilterFetchChoicesEffect,
		stopPropagation: true
	},
	[COMPONENT_CONNECTED]: {
		effect: choiceFilterSetOriginalEffect,
		stopPropagation: true
	},
	[CHOICE_FILTER_RESET]: {
		effect: choiceFilterResetEffect,
		stopPropagation: true
	},
	[CHOICE_FILTER_GRAPHQL_EFFECT]: {
		...choiceFilterGragphQLEffect,
		stopPropagation: true
	},
	[CHOICE_FILTER_GRAPHQL_EFFECT_RESULT]: {
		effect: choiceFilterGraphQLResultEffect,
		stopPropagation: true
	},
	[CHOICE_FILTER_SET_STATE]: {
		effect: choiceFilterSetStateEffect,
		stopPropagation: true
	},
	[CHOICE_FILTER_CLEAR_INPUT_VALUE]: {
		effect: ({dispatch}) => {
			dispatch(CHOICE_FILTER_SET_STATE, {properties: {inputValue: ''}});
		},
		stopPropagation: true
	},
	[COL_FILTER_INPUT_UPDATED]: {
		effect: choiceFilteringEffect,
		stopPropagation: true
	},
	[BARE_BUTTON_CLICKED]: {
		effect: coeffects => {
			const {dispatch, action, state} = coeffects;
			const {
				meta: {componentName}
			} = action;
			const {
				field,
				comparisonMap,
				nowTableReturnFocus,
				operator
			} = state.properties;
			if (componentName === FILTER_SELECT_ALL_BUTTON)
				dispatch(CHOICE_FILTER_SELECT_ALL_BUTTON);

			if (componentName === FILTER_SELECT_NONE_BUTTON)
				dispatch(CHOICE_FILTER_SELECT_NONE_BUTTON);

			if (componentName === FILTER_CLEAR_BUTTON) {
				const metadata = {field, operator};
				dispatch(METRIC_TRACKED, {
					eventName: REMOVE_COLUMN_FILTER_EVENT,
					metadata
				});
				dispatch(DELETE_COMPLEX_FILTER_COMPARISON, {field, comparisonMap});
				closeFilterPopOver(nowTableReturnFocus, dispatch);
			}
		},
		stopPropagation: true
	},
	[BUTTON_CLICKED]: {
		effect: ({dispatch, action}) => {
			const {
				meta: {componentName}
			} = action;

			if (componentName === FILTER_APPLY_BUTTON) {
				dispatch(COL_FILTER_SUBMIT_QUERY);
			}
		},
		stopPropagation: true
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
	[COL_FILTER_SUBMIT_QUERY]: {
		effect: coeffects => {
			const {dispatch, state} = coeffects;
			const {
				properties: {
					comparisonMap,
					field,
					selectedChoices,
					operator,
					nowTableReturnFocus
				}
			} = state;

			const metadata = {field, operator};
			dispatch(METRIC_TRACKED, {
				eventName: APPLY_COLUMN_FILTER_EVENT,
				metadata
			});
			if (isEmpty(comparisonMap)) {
				dispatch(ADD_COMPLEX_FILTER_COMPARISON, {
					value: selectedChoices,
					field,
					operator: getOperator(selectedChoices)
				});
			} else {
				dispatch(MUTATE_COMPLEX_FILTER_COMPARISON, {
					value: selectedChoices,
					field,
					operator: getOperator(selectedChoices),
					comparisonMap
				});
			}
			closeFilterPopOver(nowTableReturnFocus, dispatch);
		}
	},
	[CHOICE_FILTER_SELECT_ALL_BUTTON]: {
		effect: choiceFilteringSelectAllEffect,
		stopPropagation: true
	},
	[CHOICE_FILTER_SELECT_NONE_BUTTON]: {
		effect: choiceFilteringSelectNoneEffect,
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
	[LISTBOX_SELECTED_CHANGE]: {
		effect: choiceFilterSelectOptionEffect,
		stopPropagation: true
	}
};
