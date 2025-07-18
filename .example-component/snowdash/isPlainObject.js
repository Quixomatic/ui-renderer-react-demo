/**
 * Checks if a value is a plain object, i.e. an object created by the Object constructor or with a null prototype
 *
 * @param {Object} value - The value to check
 * @returns {boolean} - True if the value is a plain object, false otherwise
 */
export default function isPlainObject(value) {
	if (typeof value !== 'object' || value === null) return false;

	const proto = Object.getPrototypeOf(value);
	return proto === null || proto === Object.prototype;
}
