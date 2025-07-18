/**
 * Creates an array of unique values that are included in the first array, but not in the other
 *
 * @param {Array} array - The array to inspect
 * @param {*} [values] - The arrays of values to exclude
 * @returns {Array} - The new array of filtered values
 */
export default function difference(array, ...values) {
	if (!array) array = [];
	const validValues = [];
	for (const val of values) {
		if (Array.isArray(val)) validValues.push(val);
	}
	const excludedValues = new Set(validValues.flat());
	return array.filter((value) => !excludedValues.has(value));
}
