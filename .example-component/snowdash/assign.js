/**
 * Assigns the own enumerable properties of source objects to the destination object
 *
 * @param {Object} object - The destination object
 * @param {...Object} sources - The source objects to assign
 * @returns {Object} - The modified destination object
 */
export default function assign(object, ...sources) {
	if (!object) object = {};
	sources
		.filter((source) => source !== null && typeof source === 'object')
		.forEach((source) => {
			Object.keys(source).forEach((key) => {
				object[key] = source[key];
			});
		});

	return object;
}
