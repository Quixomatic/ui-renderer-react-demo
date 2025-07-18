import { map, reduce, isString, isArray, isObject } from 'lodash';

/**
 * Convert the values and display values arrays into a single pill array
 * @param {array} values
 * @param {array} displayValues Boolean that indicates wheter or not shift was held.
 * @return {array} array of pill objects
 */
function toPills(values, displayValues) {
	if (isString(values)) {
		values = convertToValueArray(values);
	}

	if (isString(displayValues)) {
		displayValues = convertToValueArray(displayValues);
	}

	if (!Array.isArray(displayValues)) displayValues = values;

	return map(values, (value, index) => ({
		value,
		displayValue: displayValues[index] ? displayValues[index] : ''
	}));
}

/**
 * Convert the pill object array into individual value and displayValue arrays
 * @param {array} array of pill objects
 * @return {object} object containing the two arrays
 */
function toValues(pills) {
	return reduce(
		pills,
		(result, pill) => {
			pill = isObject(pill) ? pill : {};

			result.values.push(pill.value);
			result.displayValues.push(pill.displayValue);

			return result;
		},
		{
			values: [],
			displayValues: []
		}
	);
}

/**
 * Converter function for handling values being passed in as a single or CSV string
 * @param {string} values The pressed key identifier.
 * @return {array} List of values
 */
function convertToValueArray(values) {
	if (isArray(values)) {
		return values;
	}

	if (!isString(values)) {
		return [];
	}

	return values.split(',');
}

/**
 * Get matches count of value on options list based on search type
 * @param {string} value user input value.
 * @param {array} options list of options containing displayValues and values.
 * @param {string} search type of search such as initial or contains.
 * @return {string} matches count
 */

function getMatchesCount(options, search, value = '') {
	const lowerValue = value.toLowerCase();
	const method = search === 'contains' ? 'includes' : 'startsWith';
	return options.reduce((result, item) => {
		const itemValue = item.value ? item.value.toLowerCase() : '';
		const itemDisplayValue = item.displayValue
			? item.displayValue.toLowerCase()
			: '';

		if (itemValue[method](lowerValue) || itemDisplayValue[method](lowerValue)) {
			result.push(item);
		}
		return result;
	}, []).length;
}

export { toPills, toValues, convertToValueArray, getMatchesCount };
