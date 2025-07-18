/**
 * Reduces the array to a single value by repeatedly calling a callback function
 * @param {Array|Object} collection - The array to iterate over
 * @param {Function} iteratee  - the function that will be called on each item
 * @param {*} accumulator  - the initial value of the accumulator. If one is not provided, the first element in the array will be used
 * @returns {*} The final value of the accumulator
 */
export default function reduce(collection, iteratee, accumulator) {
	if (!iteratee || typeof iteratee != 'function') return undefined;
	const isArray = Array.isArray(collection);
	if (typeof collection === 'string') collection = Array.from(collection);
	if (!collection || (!isArray && typeof collection != 'object')) return {};

	const keys = Object.keys(collection);
	const length = keys.length;
	let index = -1;

	if (arguments.length < 3) {
		if (length === 0) return undefined;
		accumulator = collection[keys[++index]];
	}

	while (++index < length) {
		const key = isArray ? index : keys[index];
		accumulator = iteratee(accumulator, collection[key], key, collection);
	}

	return accumulator;
}
