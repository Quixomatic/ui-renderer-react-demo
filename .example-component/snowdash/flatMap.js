/**
 * Creates a flattened array of values by running each element in a collection through a mapping
 * function and flattening the mapped results before returning them.
 *
 * @param {Array|Object} collection - The collection to iterate over.
 * @param {*} iteratee - The function invoked per iteration.
 * @returns {Array} Returns the new flattened array.
 */
export default function flatMap(collection, iteratee) {
	if (!collection) return [];
	if (!iteratee || typeof iteratee != 'function') iteratee = (elm) => elm;
	const result = [];

	for (let i = 0; i < collection.length; i++) {
		const mapped = iteratee(collection[i]);

		if (Array.isArray(mapped)) {
			result.push.apply(result, mapped);
		} else {
			result.push(mapped);
		}
	}

	return result;
}
