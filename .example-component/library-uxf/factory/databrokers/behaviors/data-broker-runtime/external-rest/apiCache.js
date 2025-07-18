import md5 from 'crypto-js/md5';
import Base64 from 'crypto-js/enc-base64';

/**
 * Cache name for the external REST Data broker
 * @type {string}
 */
const EXTERNAL_REST_DATABROKER_CACHE = 'EXTERNAL_REST_DATABROKER_CACHE';
/**
 * Computes the hash for the data.
 *
 * @param data
 */
export const computeHash = (data) =>
	Base64.stringify(md5(JSON.stringify(data)));

/**
 * Fetches the API response from the cache, if available.
 *
 * @param key
 * @param ttl
 * @returns {Promise<null|*>}
 */
export const fetchFromCache = async (key, ttl) => {
	const cache = await caches.open(EXTERNAL_REST_DATABROKER_CACHE);
	const cachedData = await cache.match(key);
	if (cachedData) {
		const data = await cachedData.json();
		if (Date.now() < data.timestamp + ttl) {
			return data.executionResult;
		} else {
			await cache.delete(key);
			return null;
		}
	}
	return null;
};

/**
 * Stores the API response in the cache.
 *
 * @param key
 * @param pipelineSysId
 * @param executionResult
 * @param ttl
 * @param hash
 * @returns {Promise<void>}
 */
export const storeInCache = async (
	key,
	pipelineSysId,
	executionResult,
	ttl,
	hash
) => {
	const cache = await caches.open(EXTERNAL_REST_DATABROKER_CACHE);
	const entry = {
		pipelineSysId,
		executionResult,
		timestamp: Date.now(),
		ttl,
		hash
	};
	await cache.put(key, new Response(JSON.stringify(entry)));
};
