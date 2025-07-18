/**
 * Checks if `path` is a direct or inherited property of `object`.
 * Checks if `path` key is a direct or inherited property of `object`.
 *
 * @param {Object} object The object to query.
 * @param {string | array} key The path to check.
 * @returns {boolean} Returns `true` if key path exists in object, else `false`.
 */
export default function hasIn(object, key) {
	if (!object) return false;

	if (Array.isArray(key)) {
		let currObj = object;
		for (let i = 0; i < key.length; i++) {
			let k = key[i];
			if (!(k in currObj)) return false;
			currObj = currObj[k];
		}
		return true;
	} else return key in object;
}
