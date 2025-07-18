/**
 * This method is like merge except that it accepts customizer which is invoked to produce
 * the merged values of the destination and source properties. If customizer returns undefined,
 * merging is handled by the method instead. The customizer is invoked with five arguments:
 * (objValue, srcValue, key, object, source). This method mutates object.
 *
 * Note: A simplified version of mergeWith without stack to cover the current use case in getConsolidedConfig
 *
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @param {Function} customizer The function to customize assigned values.
 * @returns {Object} Returns object.
 */
export default function mergeWith(object, source, customizer) {
	if (!object) object = {};

	if (!source) return object;

	for (const [key, value] of Object.entries(source)) {
		const result = customizer(object[key], value, key, object, source);

		if (result === undefined) {
			object[key] = mergeUndefinedResult(object[key], value, customizer);
		} else {
			object[key] = result;
		}
	}

	return object;
}

function mergeUndefinedResult(objValue, srcValue, customizer) {
	if (typeof srcValue === 'object' && typeof objValue === 'object') {
		return mergeWith(objValue, srcValue, customizer);
	}

	return srcValue;
}
