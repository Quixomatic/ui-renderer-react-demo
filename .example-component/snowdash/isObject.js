/**
 * Checks if the value is instance of Object
 * @param {*} input The input parameter.
 * @returns {boolean} - Returns true when the value is of type Object, else false.
 */
export default function isObject(input) {
	var type = typeof input;
	return input != null && (type == 'object' || type == 'function');
}
