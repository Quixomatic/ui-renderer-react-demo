/**
 * Checks if value is classified as a String primitive or object.
 * @param input - Input parameter to determine whether it is a string
 * @returns {boolean} Returns true if the value is of type String, else false.
 */
export default function isString(input) {
	return typeof input === 'string';
}
