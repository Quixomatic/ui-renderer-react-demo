/**
 * Iterates over an object's own properties and returns the first key that
 * satisfies a given condition.
 *
 * @param {Object} object - The object to iterate over.
 * @param {Function} predicate - The function invoked per iteration.
 * @returns {string|undefined} Returns the key of the first element that satisfies the predicate,
 *  or undefined if no element satisfies the predicate.
 */
export default function findKey(object, predicate) {
	if (!object) return undefined;
	if (!predicate || typeof predicate != 'function') return undefined;
	for (const key in object)
		if (
			Object.prototype.hasOwnProperty.call(object, key) &&
			predicate(object[key], key, object)
		)
			return key;
}
