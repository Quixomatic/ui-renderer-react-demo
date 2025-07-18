/**
 * Creates a new array or object with the results of calling a provided function on every element in the input array or object.
 *
 * @param {Array|Object} collection - The array or object to iterate over.
 * @param {Function} iteratee - The function to call on each element of the collection.
 * @returns {Array|Object} A new array or object with the mapped results.
 */
export default function map(collection, iteratee) {
	if (!collection) {
		return [];
	}
	if (typeof collection === 'string') {
		collection = Array.from(collection);
	}
	if (!iteratee) {
		return Array.isArray(collection) ? collection : Object.values(collection);
	}
	const result = [];
	if (Array.isArray(collection)) {
		if (typeof iteratee === 'string') {
			for (let i = 0; i < collection.length; i++) {
				if (i in collection) {
					result.push(collection[i][iteratee]);
				}
			}
		} else if (typeof iteratee === 'object') {
			for (let i = 0; i < collection.length; i++) {
				if (i in collection) {
					const defaultValue =
						iteratee.default !== undefined ? iteratee.default : false;
					const valueAtPath = iteratee.path
						.split('.')
						.reduce((obj, key) => obj && obj[key], collection[i]);
					result.push(valueAtPath !== undefined ? valueAtPath : defaultValue);
				}
			}
		} else {
			for (let i = 0; i < collection.length; i++) {
				if (i in collection) {
					result.push(iteratee(collection[i], i, collection));
				}
			}
		}
	} else if (typeof collection === 'object') {
		for (const [key, value] of Object.entries(collection)) {
			if (typeof iteratee === 'function') {
				result.push(iteratee(value, key));
			} else if (typeof iteratee === 'string') {
				result.push(value[iteratee]);
			} else if (typeof iteratee === 'object') {
				const defaultValue =
					iteratee.default !== undefined ? iteratee.default : false;
				const valueAtPath = iteratee.path
					.split('.')
					.reduce((obj, key) => obj && obj[key], value);
				result.push(valueAtPath !== undefined ? valueAtPath : iteratee.default);
			}
		}
	}
	return result;
}
