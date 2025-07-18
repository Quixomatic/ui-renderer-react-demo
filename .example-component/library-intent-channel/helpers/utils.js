export const appendToSessionStorage = (key, value) => {
	const prevValue = sessionStorage.getItem(key);
	let values = [];
	if (prevValue) {
		try {
			values = JSON.parse(prevValue);
		} catch (e) {
			values = [];
		}
	}
	if (!Array.isArray(values)) values = [values];
	values.push(value);
	return JSON.stringify(values);
};
