/**
 * This method is like `uniq` except that it accepts a iteratee which is
 * invoked for each element in array to generate the criterion by which
 * uniqueness is computed. The order of result values is determined by the
 * order they occur in the array. The iteratee is invoked with one argument:
 * (value).
 *
 * @param {Array} array The array to inspect.
 * @param {Function} iteratee The iteratee invoked per element.
 * @returns {Array} Returns the new duplicate free array.
 */
export default function uniqBy(array, iteratee) {
	if (!array || array.length == 0) return [];
	if (typeof iteratee != 'function') return Array.of(array[0]);
	const seen = new Set();
	return array.filter((value) => {
		const computedValue = iteratee(value);
		if (!seen.has(computedValue)) {
			seen.add(computedValue);
			return true;
		}
		return false;
	});
}
