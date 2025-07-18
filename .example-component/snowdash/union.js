import isEqual from './isEqual.js';

/**
 * Creates an array of unique values, in order, from all given arrays.
 *
 * @param {...Array} arrays - The arrays to inspect.
 * @returns {Array} Returns the new array of combined values.
 */
export default function union(...arrays) {
	if (!arrays) return [];
	const uniqueObjects = arrays.filter(Boolean).reduce((acc, currentArray) => {
		currentArray.forEach((item) => {
			if (!acc.some((accItem) => isEqual(accItem, item))) {
				acc.push(item);
			}
		});
		return acc;
	}, []);
	return uniqueObjects;
}
