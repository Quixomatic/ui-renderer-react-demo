/**
 * Iterates over own enumerable string keyed properties of an object and invokes iteratee for each property.
 * The iteratee is invoked with three arguments: (value, key, object).
 * Iteratee functions may exit iteration early by explicitly returning false.
 *
 * @param {Object} object The object to iterate over.
 * @param {function} iteratee  The function invoked per iteration
 * @returns {Object}: Returns object.
 */
export default function forOwn(object, iteratee) {
	if (object && typeof object === 'object') {
		if (!iteratee) iteratee = (v) => v;
		Object.keys(object).forEach((key) => iteratee(object[key], key, object));
	}

	return object;
}
