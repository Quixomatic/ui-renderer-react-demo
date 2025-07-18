/**
 * Iterates over elements of a collection, returning the first element predicate returns truthy for.
 *
 * @param {Array|Object} collection - The collection to iterate over.
 * @param {Function} predicate - The function invoked per iteration.
 * @param {number} [fromIndex=0] - The index to start searching from.
 * @returns {*} - Returns the matched element, else `undefined`.
 */
export default function find(collection, predicate, fromIndex = 0) {
	if (typeof collection === 'string') collection = Array.from(collection);
	if (!collection || typeof collection !== 'object') {
		throw new TypeError('Expected collection to be of type Array or Object');
	}

	const isObject = !Array.isArray(collection) && typeof collection === 'object';
	const entries = Object.entries(collection);
	if (!predicate && Array.isArray(collection)) {
		return collection[0];
	} else if (!predicate) {
		return entries[0][1];
	}

	if (
		!Array.isArray(predicate) &&
		typeof predicate !== 'function' &&
		typeof predicate !== 'object'
	) {
		return undefined;
	}

	const length = entries.length;
	const iteratee =
		typeof predicate === 'function'
			? predicate
			: (obj) => {
					if (Array.isArray(predicate)) {
						const [propName, value] = predicate;
						return obj[propName] === value;
					} else {
						for (const key in predicate) {
							if (obj[key] !== predicate[key]) {
								return false;
							}
						}
						return true;
					}
			  };

	const index =
		fromIndex < 0 ? Math.max(collection.length + fromIndex, 0) : fromIndex;
	for (let i = index; i < length; i++) {
		const key = entries[i][0];
		const value = entries[i][1];
		if (iteratee(value, key, collection)) {
			return isObject ? value : collection[key];
		}
	}
	return undefined;
}
