/**
 * Iterates over elements of collection and invokes iteratee for each element.
 * The iteratee is invoked with three arguments: (value, index|key, collection).
 * Iteratee functions may exit iteration early by explicitly returning false.
 *
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {*} Returns collection.
 */
export default function forEach(collection, iteratee) {
	if (typeof iteratee !== 'function') iteratee = (v) => v;

	if (Array.isArray(collection)) {
		collection.forEach((element, index, array) =>
			iteratee(element, index, array)
		);
	} else if (collection) {
		Object.keys(collection).forEach((key) =>
			iteratee(collection[key], key, collection)
		);
	}

	return collection;
}
