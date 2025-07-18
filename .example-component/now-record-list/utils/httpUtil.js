export const createQueryString = obj => {
	let queryString = '';

	for (let key in obj) {
		if (queryString.length > 0) {
			queryString += '&';
		}
		queryString += encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]);
	}
	return queryString;
};
