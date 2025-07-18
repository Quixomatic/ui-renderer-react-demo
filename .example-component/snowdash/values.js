/**
 * Creates an array of the own enumerable property values of object.
 *
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property values.
 */
export default function values(object) {
	if (!object || typeof object != 'object') return [];
	return Object.values(object);
}
