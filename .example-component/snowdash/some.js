/**
 * Checks if predicate returns truthy for any element of collection. Iteration is stopped once predicate returns truthy.
 * The predicate is invoked with three arguments: (value, index|key, collection)
 * @param {Array|Object} collection The collection to iterate over.
 * @param {function} predicate The function invoked per iteration.
 */
export default function some(collection, predicate) {
	if (predicate === undefined) return collection.length > 0;
	else if (typeof predicate !== 'function') return false;
	else if (Array.isArray(collection)) {
		for (let i = 0; i < collection.length; i++) {
			if (predicate(collection[i], i, collection)) {
				return true;
			}
		}
	} else if (collection !== null && typeof collection === 'object') {
		for (const [key, value] of Object.entries(collection)) {
			if (predicate(value, key, collection)) {
				return true;
			}
		}
	} else if (typeof collection === 'string') {
		for (let i = 0; i < collection.length; i++) {
			if (predicate(collection.charAt(i), i, collection)) {
				return true;
			}
		}
	}
	return false;
}
