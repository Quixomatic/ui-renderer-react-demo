/**
 * Checks if value is classified as a Number primitive or object.
 * @param {*} input Input parameter to check.
 * @returns Returns true if value is correctly classified, else false.
 */
export default function isNumber(input) {
	return typeof input === 'number';
}
