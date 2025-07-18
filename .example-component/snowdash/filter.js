/**
 * Creates a new array or object with all elements that pass the test implemented by the provided function.
 *
 * @param {Array|Object} collection - The array or object to iterate over.
 * @param {Function} predicate - The function to test each element of the collection.
 * @returns {Array|Object} A new array or object with the filtered results.
 */
export default function filter(collection, predicate) {
	if (!collection || !predicate) return [];
	if (typeof predicate !== 'function') predicate = () => true;
	if (!Array.isArray(collection))
		return Array.prototype.filter.call(Object.values(collection), predicate);

	return Array.prototype.filter.call(collection, predicate);
}
