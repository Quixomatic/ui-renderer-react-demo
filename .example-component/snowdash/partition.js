/**
 * Creates an array of elements split into two groups, the first of which contains elements predicate returns truthy for,
 * while the second of which contains elements predicate returns falsey for.
 * The predicate is invoked with three arguments: (value, index|key, collection).
 * @param {Array|Object} collection The collection to iterate over.
 * @param {function} predicate The function invoked per iteration.
 * @returns Returns the array of grouped elements.
 */
export default function partition(collection, predicate) {
	if (!predicate || typeof predicate != 'function')
		return partition(collection, (v) => v);
	const isArray = Array.isArray(collection);
	var truthy;
	var falsy;
	if (isArray) {
		truthy = [];
		falsy = [];
		for (const element of collection) {
			if (predicate(element)) {
				truthy.push(element);
			} else {
				falsy.push(element);
			}
		}
	} else if (typeof collection === 'object') {
		truthy = {};
		falsy = {};
		for (const key in collection) {
			if (Object.prototype.hasOwnProperty.call(collection, key)) {
				const value = collection[key];
				if (predicate(value)) {
					truthy[key] = value;
				} else {
					falsy[key] = value;
				}
			}
		}
	} else if (typeof collection === 'string') {
		truthy = '';
		falsy = '';
		for (const char of collection) {
			if (predicate(char)) {
				truthy += char;
			} else {
				falsy += char;
			}
		}
	}
	return [truthy, falsy];
}
