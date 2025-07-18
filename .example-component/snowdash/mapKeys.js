/**
 *
 * @param {Object} inputObj The object to iterate over.
 * @param {*} iteratee The function call that is invoked per iteration.
 * @returns {Object} Undefined if the input is null or undefined, else a new mapped object with the same values as the object
 * and the keys created by running each of the object's own enumerable string keys through the iteratee.
 */
export default function mapKeys(inputObj, iteratee) {
	if (!iteratee) return mapKeys(inputObj, (v) => v);
	if (typeof iteratee === 'string') {
		return mapKeys(inputObj, (key) => {
			const {[iteratee]: newKey} = key;
			return newKey;
		});
	} else if (inputObj === null || typeof inputObj !== 'object') return {};
	const result = {};
	const hasOwnProperty = Object.prototype.hasOwnProperty;
	for (const key in inputObj) {
		if (hasOwnProperty.call(inputObj, key)) {
			result[iteratee(inputObj[key], key)] = inputObj[key];
		}
	}
	return result;
}
