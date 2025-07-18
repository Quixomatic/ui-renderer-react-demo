/**
 * Performs a deep comparison between two values to determine if they are equivalent.
 *
 * @param {*} value - The value to compare.
 * @param {*} other - The other value to compare.
 * @returns {boolean} Returns true if the values are equivalent, else false.
 */
export default function isEqual(value, other) {
	if (value === other) {
		return true;
	}

	if (typeof value !== typeof other || value === null || other === null) {
		return false;
	}

	if (typeof value !== 'object') {
		return false;
	}

	const valueTag = Object.prototype.toString.call(value);
	const otherTag = Object.prototype.toString.call(other);

	if (valueTag !== otherTag) {
		return false;
	}

	if (valueTag === '[object Array]') {
		const length = value.length;

		if (length !== other.length) {
			return false;
		}

		for (let i = 0; i < length; i++) {
			if (!isEqual(value[i], other[i])) {
				return false;
			}
		}

		return true;
	}

	if (valueTag === '[object Object]') {
		const valueKeys = Object.keys(value);
		const otherKeys = Object.keys(other);

		if (valueKeys.length !== otherKeys.length) {
			return false;
		}

		for (let key of valueKeys) {
			if (
				!Object.prototype.hasOwnProperty.call(other, key) ||
				!isEqual(value[key], other[key])
			) {
				return false;
			}
		}

		return true;
	}

	return false;
}
