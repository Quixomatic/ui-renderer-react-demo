/**
 * The isEmpty function determines if a given value is empty or not.
 * @param {any} value The value to check
 * @returns {boolean} True if the value is empty, false otherwise
 */
export default function isEmpty(value) {
	if (value == null) return true;
	if (typeof value === 'string' || Array.isArray(value))
		return value.length === 0;
	if (typeof value === 'object') return Object.keys(value).length === 0;

	return false;
}
