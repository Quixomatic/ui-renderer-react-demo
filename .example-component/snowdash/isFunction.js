/**
 * The isFunction method determines if a given value is a function type or not
 * @param {any} value The value to check if it is a function or not
 * @returns {boolean} True if value is of type function, false otherwise
 */
export default function isFunction(value) {
	return typeof value === 'function';
}
