import {getActiveLibraryUxfVersion, getUxGlobal} from './utils.js';
import {isCacheStorageAPISupported} from '../utils/clientCacheUtils';

export const PAGE_FRAGMENT_PARTIAL_CONTENT_CACHE_ENABLED = getUxGlobal(
	'pageFragmentPartialContentCacheEnabled',
	false
);

// This must never change since we use it to delete stale caches
// If we ever need to change it, make sure to add additional code that deletes stale caches based on the outdated name
const CACHE_NAME_PREFIX = '__uxf_pagefragment_partials';
const PAGE_FRAGMENT_PARTIAL_CONTENT_CACHE_NAME =
	CACHE_NAME_PREFIX + ':v' + getActiveLibraryUxfVersion();

async function removeStaleCaches() {
	if (
		!(await isCacheStorageAPISupported(
			PAGE_FRAGMENT_PARTIAL_CONTENT_CACHE_NAME
		))
	) {
		console.warn(
			`Partial content cache is skipping the cache storage API; window.isSecureContext = ${
				window.isSecureContext
			}`
		);
		return;
	}
	(await caches.keys())
		.filter((cacheName) => cacheName.startsWith(CACHE_NAME_PREFIX))
		.filter(
			(cacheName) => cacheName !== PAGE_FRAGMENT_PARTIAL_CONTENT_CACHE_NAME
		)
		.map((cacheName) => caches.delete(cacheName));
}

removeStaleCaches();

const IS_CACHE_STORAGE_API_AVAILABLE_PROMISE = isCacheStorageAPISupported(
	PAGE_FRAGMENT_PARTIAL_CONTENT_CACHE_NAME
);

async function getOpenedCache() {
	if (
		!(await isCacheStorageAPISupported(
			PAGE_FRAGMENT_PARTIAL_CONTENT_CACHE_NAME
		))
	)
		return;

	const {caches} = self;
	return await caches.open(PAGE_FRAGMENT_PARTIAL_CONTENT_CACHE_NAME);
}

const OPENED_CACHE = getOpenedCache();

async function getClientCacheableContentFromCache(request) {
	const cache = await OPENED_CACHE;
	const response = await cache.match(request);
	if (typeof response === 'undefined') {
		await cache.add(request);
		return await cache.match(request);
	} else {
		return response;
	}
}

export async function fetchClientCacheableContent(url) {
	const headers = new Headers();
	headers.set('Accept', 'application/json');
	const request = new Request(url, {headers});
	const response = (await IS_CACHE_STORAGE_API_AVAILABLE_PROMISE)
		? await getClientCacheableContentFromCache(request)
		: await fetch(request);
	const clientCacheableContent = await response.json();
	return clientCacheableContent || [];
}

export function getClientCacheableComponentDriverRequestUrl(
	componentIdOrTagName,
	cacheBuster
) {
	return `/$uxappimmutables.do?sysparm_request_type=component_driver_partial&sysparm_component_id_or_tagname=${componentIdOrTagName}&uxpcb=${cacheBuster}`;
}

const UX_GLOBAL_CLIENT_CACHE_BUSTER =
	window?.ux_globals?.uxGlobalsClientCacheBuster || '';

export async function fetchExperienceForUxGlobals(pageRegistryId) {
	const requestUrl = getClientCacheableUxGlobalExperienceRequestUrl(
		pageRegistryId,
		UX_GLOBAL_CLIENT_CACHE_BUSTER
	);
	const headers = new Headers();
	headers.set('Accept', 'application/json');
	const response = await fetch(new Request(requestUrl, {headers}));
	const experienceContent = await response.json();
	Object.assign(window?.ux_globals?.experienceConfigs, experienceContent);
	return experienceContent;
}

export function getClientCacheableUxGlobalExperienceRequestUrl(
	pageRegistryId,
	cacheBuster
) {
	return `/$uxappimmutables.do?sysparm_request_type=ux_globals_experience&sysparm_page_registry=${pageRegistryId}&uxpcb=${cacheBuster}`;
}
