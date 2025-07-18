import snHttpProm from '../../snHttpInstance';

/**
 * Usage:
 *
 * now.http(url, options, onProgress, onStart) // api is like createHttpEffect
 *  .then((response) => {...})
 *  .catch((error) => {...})
 **/
export default function(
	url,
	options,
	onProgress = () => {},
	onStart = () => {}
) {
	return new Promise((resolve, reject) => {
		const {
			method = 'GET',
			headers = {},
			params = {},
			body = {},
			batch = true
		} = options;
		onStart();

		snHttpProm().then((snHttp) =>
			snHttp
				.request(url, method, {
					headers,
					params,
					data: body,
					onUploadProgress: onProgress,
					batch
				})
				.then((response) =>
					resolve({
						response: {
							...response.data
						}
					})
				)
				.catch((error) => {
					const {
						response: {data, status, statusText, headers: responseHeaders},
						message
					} = error;
					reject({
						error: {
							data,
							status,
							statusText,
							options: {
								...(headers && {headers}),
								...(responseHeaders && {responseHeaders}),
								...(params && {params}),
								...(data && {data})
							},
							...(message && {message})
						}
					});
				})
		);
	});
}
