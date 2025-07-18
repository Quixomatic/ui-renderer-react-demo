/**
 * The set function allows you to set the value of a nested property of an object
 * @param {object} object The object with the property to be set
 * @param {*} path The path of the property to set
 * @param {*} value The value to set
 * @return {*} Returns the modified object
 */
export default function set(object, path, value) {
	if (path == null) return object;

	if (typeof path === 'string') {
		path = path
			.split(/\.|\[|\]/g)
			.filter(Boolean)
			.map((part) => {
				return isNaN(part) ? part : Number(part);
			});
	}

	path.reduce((curr, key, index) => {
		if (index === path.length - 1) curr[key] = value;
		else {
			if (typeof key === 'number') {
				if (!Array.isArray(curr)) curr = [];
				if (curr[key] === undefined) curr[key] = {};
			} else {
				if (!curr[key]) curr[key] = {};
			}
			return curr[key];
		}
	}, object);

	return object;
}
