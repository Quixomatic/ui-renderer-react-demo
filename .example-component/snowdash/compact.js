/**
 * The compact function removes any fasy values and returns a new array with only non-falsy values
 * @param {*} array The array to be compacted
 * @returns {*} The compacted array with only non-falsy values
 */
export default function compact(array) {
	if (array && Array.isArray(array)) return array.filter(Boolean);

	return [];
}
