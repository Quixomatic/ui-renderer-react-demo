import md5 from 'crypto-js/md5';
import Base64 from 'crypto-js/enc-base64';
// Some browsers don't support using self.caches outside of secure contexts.
// The only use case for using ServiceNow in a non-secure context are internal developers working locally.
// Use browser flags to make localhost:8080 act like a secure context.
// Note that this doesn't mean there is NO client caching. HTTP cache still works here.
export async function isCacheStorageAPISupported(cacheName) {
	// Only doing "'caches' in self" is not enough for Firefox v78 ESR, we actually need to try to open the cache to see if it could be used
	if ('caches' in self) {
		try {
			const {caches} = self;
			await caches.open(cacheName);
			return true;
		} catch (e) {
			return false;
		}
	}
	return false;
}

export const computeHash = (data) =>
	Base64.stringify(md5(JSON.stringify(data)));

const DB_ENGINE_EXEC_REST_URL = '/exec';
const DB_CACHENAME = 'DATABROKER_CACHE';

export async function getDBCacheHandle() {
	if ('caches' in self) return await caches.open(DB_CACHENAME);
}

export const getCacheKey = (pipelineId, hash) => {
	const headers = new Headers();
	headers.set('Accept', 'application/json');
	const cacheUrl = new URL(DB_ENGINE_EXEC_REST_URL, window.location.origin);
	cacheUrl.pathname = cacheUrl.pathname + '/' + pipelineId + '/' + hash;
	return new Request(cacheUrl.toString(), {
		headers,
		method: 'GET'
	});
};

export const IS_CACHE_STORAGE_API_AVAILABLE_PROMISE =
	isCacheStorageAPISupported(DB_CACHENAME);
