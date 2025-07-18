/**
 * Converts a string to lower case.
 *
 * @param {*} str - The input to convert.
 * @returns {string} The input string in lower case.
 */
export default function toLower(str) {
	if (!str) return '';
	return str.toString().toLowerCase();
}
