/**
 * Creates an object composed of the own and inherited enumerable property paths of `object` that are not omitted.
 *
 * @param {Object} object The source object.
 * @param {...(string|string[])} [paths] The property paths to omit.
 * @returns {Object} Returns the new object.
 */
export default function omit(object, ...paths) {
	if (!object) return {};
	if (!paths) return object;
	const result = {};
	const pathsToOmit = paths.flat();

	for (const key in object) {
		if (pathsToOmit.includes(key)) continue;

		result[key] = object[key];
	}

	return result;
}
