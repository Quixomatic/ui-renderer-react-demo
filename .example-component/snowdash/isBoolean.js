/**
 * Checks if a value is a boolean.
 *
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a boolean, else `false`.
 */
export default function isBoolean(value) {
	return typeof value === 'boolean';
}
