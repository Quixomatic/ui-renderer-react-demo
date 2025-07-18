/**
 * Creates a function that negates the result of the given predicate function.
 *
 * @param {Function} predicate The predicate function to negate.
 * @returns {Function} Returns the new negated function.
 */
export default function negate(predicate) {
	return function(...args) {
		return !predicate(...args);
	};
}
