/**
 * Checks if a value is classified as a Map object.
 *
 * @param {*} value - The value to check.
 * @returns {boolean} Returns true if the value is a Map object, else false.
 */
export default function isMap(value) {
	return Object.prototype.toString.call(value) === '[object Map]';
}
