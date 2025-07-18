/**
 * Checks if a value is in a collection. Returns true if the value is found, else false.
 *
 * @param {Array|Object|string} collection - The collection to inspect.
 * @param {*} value - The value to search for.
 * @param {number} [fromIndex=0] - The index to start searching from.
 * @returns {boolean} - Returns true if the value is found, else false.
 */
export default function includes(collection, value, fromIndex = 0) {
	if (typeof collection === 'string') {
		return collection.indexOf(value, fromIndex) !== -1;
	}

	if (Array.isArray(collection)) {
		for (let i = fromIndex; i < collection.length; i++) {
			if (collection[i] === value) {
				return true;
			}
		}
	} else {
		for (const key in collection) {
			if (Object.prototype.hasOwnProperty.call(collection, key)) {
				if (collection[key] === value) {
					return true;
				}
			}
		}
	}

	return false;
}
