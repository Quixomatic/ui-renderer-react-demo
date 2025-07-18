/**
 * Gets the first element of an array or the first key-value pair of an object.
 *
 * @param {Array} collection - The collection to get the first element from.
 * @returns {*} - Returns the first element of the collection or undefined if the collection is empty.
 */
export default function first(collection) {
	if (!Array.isArray(collection)) return undefined;
	return collection[0];
}
