import difference from 'lodash/difference';
import get from 'lodash/get';
import negate from 'lodash/negate';
import set from 'lodash/set';

import {EQUALS, IN} from '../../../constants';

/**
 * Choice Map will contain a map of choices with the key consiting of
 * table_column format and value consisting of choices array.
 */
const choiceMap = new Map();

const generateKey = (table, column) => `${table}_${column}`;

export const cacheChoices = (table, column, choices) => {
	choiceMap.set(generateKey(table, column), choices);
};

export const getCachedChoices = (table, column) => {
	return choiceMap.get(generateKey(table, column));
};

export const getChoicesFromPayload = payload =>
	get(payload, 'data.GlideChoiceColumn_Query.choices', []);

export const getErrorsFromPayload = payload => get(payload, 'errors');

export const getOperator = selectedChoices => {
	if (selectedChoices.length === 1) {
		if (isValueNull(selectedChoices[0])) {
			return EQUALS;
		}
	}
	return IN;
};

export const setIsDisabledChoices = (
	deselect,
	choiceValue,
	initialChoices,
	selectedChoices
) => {
	if (deselect) {
		if (isValueNull(choiceValue)) {
			return enableAllChoiceValues(initialChoices);
		} else if (selectedChoices.length === 0) {
			// enable null choice value (emtpy)
			return setEmptyChoiceIsDisabled(initialChoices, false);
		}
	} else {
		if (isValueNull(choiceValue)) {
			// disable all choice value options except null (empty)
			return setEmptyChoiceIsDisabled(initialChoices, true, true);
		} else {
			// disable only null choice value (emtpy)
			return setEmptyChoiceIsDisabled(initialChoices, true);
		}
	}
	return initialChoices;
};

const setEmptyChoiceIsDisabled = (
	initialChoices,
	disableFlag,
	negateFlag = false
) =>
	initialChoices.map(choice => {
		const nullValueCheck = negateFlag
			? negate(isValueNull)(choice.rawValue)
			: isValueNull(choice.rawValue);

		if (nullValueCheck) return set(choice, 'isDisabled', disableFlag);
		return choice;
	});

export const enableAllChoiceValues = initialChoices =>
	initialChoices.map(choice => set(choice, 'isDisabled', false));

export const isValueNull = value => value === 'null';

export const isArrayEqual = (src, target) => {
	if (src.length !== target.length) return false;
	return !difference(src, target).length;
};
