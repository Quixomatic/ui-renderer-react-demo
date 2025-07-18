import isEmpty from './isEmpty.js';
/**
 * The get function returns the value of the nested property within object, specified by path.
 * If no value is found, an optional default value is returned, or undefined if no default value is given.
 * @param {object} object The object to find a value on specified by path
 * @param {*} path The path from the object to be resolved
 * @param {*} defaultValue Returned if the path cannot be resolved, defaults to undefined if not provided
 * @returns {object} The nested value within object speficied by path, or defaultValue if the path cannot be resolved
 */
export default function get(object, path, defaultValue) {
	if (!path || isEmpty(path)) {
		return defaultValue;
	}
	const keys = Array.isArray(path)
		? path
		: path
				.toString()
				.split(/[[\].]/)
				.filter(Boolean);

	let value = object;
	for (const key of keys) {
		if (value == null) break;

		if (Array.isArray(value) && /^\d+$/.test(key)) {
			const index = parseInt(key, 10);
			value = value[index];
		} else {
			value = value[key];
		}
	}

	return value === undefined ? defaultValue : value;
}
