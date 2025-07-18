import get from 'lodash/get';
import isNumber from 'lodash/isNumber';
import isUndefined from 'lodash/isUndefined';
import without from 'lodash/without';

import {
	KEY_ARROW_DOWN,
	KEY_ARROW_UP,
	LISTBOX_FOCUS,
	LISTBOX_SELECT,
	LISTBOX_SELECTED_CHANGE,
	LISTBOX_SET_BEHAVIOR_STATE
} from '../constants';

const listboxSetBehaviorStateEffect = ({
	action,
	updateProperties,
	updateState
}) => {
	const stateToSpread = get(action, 'payload.state', {});
	const propertiesToSpread = get(action, 'payload.properties', {});

	updateProperties({...propertiesToSpread});
	updateState({
		path: 'behaviors.listboxKeyControls',
		value: stateToSpread
	});
};

const focusEffect = ({state, dispatch, action}) => {
	const {
		payload: {offset, newFocus}
	} = action;
	const {
		behaviors: {
			listboxKeyControls: {currentFocused}
		},
		properties: {choices}
	} = state;

	const dispatchNewFocusTarget = (target, conditional = true) => {
		if (conditional)
			dispatch(LISTBOX_SET_BEHAVIOR_STATE, {
				state: {
					currentFocused: target
				}
			});
	};

	let newFocused;
	let newChoice;
	let foundNewItem = false;
	switch (offset) {
		case KEY_ARROW_UP:
			newFocused = currentFocused > 0 ? currentFocused - 1 : 0;
			newChoice = choices[newFocused];

			if (newChoice.isDisabled)
				for (let i = newFocused; i >= 0; i--) {
					newFocused = i;
					newChoice = choices[newFocused];
					if (!newChoice.isDisabled) {
						foundNewItem = true;
						break;
					}
				}
			else foundNewItem = true;

			dispatchNewFocusTarget(newFocused, foundNewItem);
			break;
		case KEY_ARROW_DOWN:
			newFocused =
				currentFocused < choices.length - 1
					? currentFocused + 1
					: currentFocused;
			newChoice = choices[newFocused];

			if (newChoice.isDisabled)
				for (let i = newFocused, len = choices.length; i < len; i++) {
					newFocused = i;
					newChoice = choices[newFocused];
					if (!newChoice.isDisabled) {
						foundNewItem = true;
						break;
					}
				}
			else foundNewItem = true;

			dispatchNewFocusTarget(newFocused, foundNewItem);
			break;
		default:
			if (!isUndefined(newFocus)) {
				newChoice = choices[newFocus];

				dispatchNewFocusTarget(newFocus, !newChoice.isDisabled);
			}

			break;
	}
};

const selectEffect = ({state, dispatch, action}) => {
	const {index} = action.payload;
	const {
		behaviors: {
			listboxKeyControls: {currentFocused}
		},
		properties: {choices, selectedChoices}
	} = state;

	const choiceIndex = isNumber(index) ? index : currentFocused;
	const choice = choices[choiceIndex];

	if (!choice) return;

	const selectedIndex = selectedChoices.indexOf(choice.rawValue);
	const newSelected =
		selectedIndex > -1
			? without(selectedChoices, choice.rawValue)
			: [...selectedChoices, choice.rawValue];

	if (currentFocused !== choiceIndex)
		dispatch(LISTBOX_FOCUS, {newFocus: choiceIndex});

	dispatch(LISTBOX_SET_BEHAVIOR_STATE, {
		state: {
			currentFocused: choiceIndex
		},
		properties: {
			selectedChoices: newSelected
		}
	});

	dispatch(LISTBOX_SELECTED_CHANGE, {
		selectedChoices: newSelected,
		deselect: selectedIndex > -1,
		choiceValue: choice.rawValue
	});
};

export default {
	[LISTBOX_SET_BEHAVIOR_STATE]: {
		effect: listboxSetBehaviorStateEffect,
		stopPropagation: true
	},
	[LISTBOX_FOCUS]: {
		effect: focusEffect,
		stopPropagation: true
	},
	[LISTBOX_SELECT]: {
		effect: selectEffect,
		stopPropagation: true
	}
};
