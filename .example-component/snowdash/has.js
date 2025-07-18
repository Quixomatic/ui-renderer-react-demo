import isObject from './isObject.js';

/**
 * The has method is used to check whether the path is a direct property of object or not.
 * @param {*} object - The object to check for the property on
 * @param {*} path  - A string or array representing the path
 * @returns {boolean} true if the path is a direct property of object, false otherwise
 */
export default function has(object, path) {
	if (!isObject(object) || !path) return false;

	const pathSegments = Array.isArray(path) ? path : path.split('.');

	for (let i = 0; i < pathSegments.length; i++) {
		const segment = pathSegments[i];
		const openBracketInd = segment.toString().indexOf('[');
		const closeBracketInd = segment.toString().indexOf(']');
		if (openBracketInd > -1) {
			const arr = segment.substring(0, openBracketInd);
			const index = parseInt(
				segment.substring(openBracketInd + 1, closeBracketInd)
			);
			if (!object || !(arr in object)) return false;
			object = object[arr];
			return index < object.length && index >= 0;
		}
		if (!object || !(segment in object)) return false;
		object = object[segment];
	}

	return true;
}
