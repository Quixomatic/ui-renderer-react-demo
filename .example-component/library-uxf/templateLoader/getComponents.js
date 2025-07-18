import snHttpInstance from '../snHttpInstance';
import {getPageContextId} from './utils';
import appendTranslations from './appendTranslations';
import appendSysProps from './appendSysProps';
import appendUserPrefs from './appendUserPrefs';
import appendPresources from './appendPresources';
import importESModules from './importESModules.js';
import {polyfilledPromiseDotAllSettled, getUxGlobal} from './utils';
import {isString} from '@devsnc/snowdash';
import {default as console} from '../utils/getLogger.js';
import {
	fetchClientCacheableContent,
	getClientCacheableComponentDriverRequestUrl
} from './getClientCacheableContent.js';

const CONSOLIDATION_ENABLED = getUxGlobal('useConsolidatedSource', true);

const componentCache = new Map();
const requestsInFlight = new Map();

/**
 * Tag names without a "-" are invalid custom elements per spec.
 * (see https://html.spec.whatwg.org/#valid-custom-element-name)
 */
function isCustomElementTagNameValid(componentTagName) {
	return (
		isString(componentTagName) &&
		componentTagName.length > 0 &&
		componentTagName.indexOf('-') > -1
	);
}

function loadComponent(definition) {
	const {
		translations,
		presources,
		sysProps,
		userPrefs,
		esmImports = [],
		tag,
		id
	} = definition;

	if (!customElements.get(tag)) {
		appendTranslations(translations);
		appendSysProps(sysProps);
		appendUserPrefs(userPrefs);
		appendPresources(presources);
		importESModules(esmImports);
	}

	componentCache.set(id, tag);
	componentCache.set(tag, tag);
	return tag;
}

const COMPONENT_DRIVER_CLIENT_CACHE_BUSTER = getUxGlobal(
	'componentDriverClientCacheBuster',
	''
);

async function fetchAndLoadComponent(componentIdOrTagName) {
	const requestUrl = getClientCacheableComponentDriverRequestUrl(
		componentIdOrTagName,
		COMPONENT_DRIVER_CLIENT_CACHE_BUSTER
	);
	const clientCacheableContent = await fetchClientCacheableContent(requestUrl);
	let tag;
	clientCacheableContent.forEach((ele) => (tag = loadComponent(ele)));
	return tag;
}

async function fetchAndLoadComponents(unresolvedIds, unresolvedNames) {
	const resolvedNames = [];
	if (unresolvedIds.length || unresolvedNames.length) {
		if (COMPONENT_DRIVER_CLIENT_CACHE_BUSTER.length > 0) {
			const promises = [];

			for (const unresolvedIdOrTagName of [
				...unresolvedIds,
				...unresolvedNames
			]) {
				const fetchComponentPromise = fetchAndLoadComponent(
					unresolvedIdOrTagName
				).then((tagName) => resolvedNames.push(tagName));
				promises.push(fetchComponentPromise);
			}

			await polyfilledPromiseDotAllSettled(promises);
		} else {
			const body = {
				pageContextId: getPageContextId()
			};

			if (unresolvedIds.length) body.componentSysIds = unresolvedIds;
			if (unresolvedNames.length) body.componentTagNames = unresolvedNames;
			const snHttp = await snHttpInstance();
			const {data: {result = []} = {}} = await snHttp.request(
				'/api/now/uxframework/component_drivers',
				'POST',
				{
					data: body,
					batch: false
				}
			);

			for (let i = 0; i < result.length; i++) {
				const definition = result[i];
				const tag = loadComponent(definition);
				resolvedNames.push(tag);
			}
		}
	}
	return resolvedNames;
}

async function getComponents(componentSysIds, componentTagNames) {
	// eslint-disable-next-line no-async-promise-executor
	return new Promise(async (resolve) => {
		const resolvedNames = [];
		const unresolvedNames = [];
		const unresolvedIds = [];

		componentTagNames.forEach((name) => {
			if (!isCustomElementTagNameValid(name)) {
				console.trace(`Invalid custom element load requested: ${name}`);
				return;
			}
			if (componentCache.has(name) || requestsInFlight.has(name)) return;
			else unresolvedNames.push(name);
		});

		componentSysIds.forEach((id) => {
			if (componentCache.has(id) || requestsInFlight.has(id)) return;
			else unresolvedIds.push(id);
		});

		const promise = fetchAndLoadComponents(unresolvedIds, unresolvedNames);

		unresolvedIds.forEach((id) => {
			requestsInFlight.set(id, promise);
		});

		unresolvedNames.forEach((name) => {
			requestsInFlight.set(name, promise);
		});

		await polyfilledPromiseDotAllSettled(Array.from(requestsInFlight.values()));

		componentTagNames.forEach((name) => {
			if (componentCache.has(name))
				resolvedNames.push(componentCache.get(name));
			else resolvedNames.push(undefined); // to preserve order
		});

		componentSysIds.forEach((id) => {
			if (componentCache.has(id)) resolvedNames.push(componentCache.get(id));
			else resolvedNames.push(undefined); // to preserve order
		});

		return resolve(resolvedNames);
	});
}

export async function getComponentsBySysIds(
	componentSysIds = [],
	_consolidatedSource = CONSOLIDATION_ENABLED
) {
	return await getComponents(componentSysIds, []);
}

export async function getComponentsByTagNames(
	componentTagNames = [],
	_consolidatedSource = CONSOLIDATION_ENABLED
) {
	return await getComponents([], componentTagNames);
}
