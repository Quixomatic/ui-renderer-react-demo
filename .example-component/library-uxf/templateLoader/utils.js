import {has} from '@devsnc/snowdash';
import {get} from '@devsnc/snowdash';
import {union} from '@devsnc/snowdash';
import {default as console} from '../utils/getLogger.js';
import {propertyTypes, DEFAULT_LANG_CODE} from '../factory/constants';
import {isNil} from '@devsnc/snowdash';
import filter from 'lodash/filter';
import {fetchExperienceForUxGlobals} from './getClientCacheableContent.js';

const {JSON_LITERAL} = propertyTypes;

const lazyLoadedExperienceConfigProperties = [
	'appRouteConfiguration',
	'appShellId',
	'basePath',
	'experienceName',
	'loginRedirectURL',
	'pageSettings',
	'parentAppShellId',
	'primaryExperience',
	'theme',
	'vendorSitePrefix'
];

export function getAuthToken() {
	return window.g_ck;
}

export function getPageContextId() {
	return window.pageMeta && window.pageMeta.pageRegistryId;
}

export function getPageMacroponentId() {
	return window.pageMeta && window.pageMeta.pageMacroponentId;
}

// this technique only works as long as template-loader is loaded with "defer" attribute on the script tag
export function getUxGlobal(key, defaultValue = {}) {
	if (!isNil(key)) {
		const UX_GLOBALS = window.ux_globals || (window.ux_globals = {});

		if (!has(UX_GLOBALS, [key])) UX_GLOBALS[key] = defaultValue;

		return UX_GLOBALS[key];
	}

	console.error('Must provide a key to retrieve off ux_globals variable');
}

export async function getDataFromUxGlobalsExperienceConfig(
	experienceId,
	property
) {
	const experienceConfigs = getUxGlobal('experienceConfigs') || {};

	let experienceObject = filter(
		Object.values(experienceConfigs),
		(value) => get(value, 'experienceId') === experienceId
	)[0];

	if (!experienceObject) return;

	if (has(experienceObject, [property])) return experienceObject[property];

	// if we are here, we didn't find the property in the experience object
	// first check if the property is one of the lazy loaded experience config property before sending off an expensive network request
	if (lazyLoadedExperienceConfigProperties.includes(property)) {
		const experienceContent = await fetchExperienceForUxGlobals(experienceId);
		experienceObject = Object.values(experienceContent)[0];
		return experienceObject[property];
	}
}

export function getActiveLibraryUxfVersion() {
	return getUxGlobal('libuxf', {version: '0.0.0'}).version;
}

export function getPagePropertiesForApp(defaultValue = {}) {
	const experienceConfigs = getUxGlobal('experienceConfigs', {});
	const pagePropertiesForApp = Object.freeze(
		Object.keys(experienceConfigs).reduce((acc, path) => {
			const configKey = experienceConfigs[path].experienceId;
			acc[configKey] =
				experienceConfigs[path]['pageProperties'] || defaultValue;
			return acc;
		}, {})
	);
	return (key) =>
		pagePropertiesForApp[key] ?? getUxGlobal('pageProperties', {});
}

function getAppConfigToPageRegistrySysIdMap(experienceConfigs) {
	return Object.values(experienceConfigs)
		.map(({experienceId, pageSettings, appConfigId}) => [
			pageSettings?.sysId || appConfigId,
			experienceId
		])
		.reduce((acc, [key, value]) => {
			acc[key] = value;
			return acc;
		}, {});
}

export const EXPERIENCE_IDS_BY_APP_CONFIG_SYS_IDS =
	getAppConfigToPageRegistrySysIdMap(getUxGlobal('experienceConfigs', {}));

export function deepFreeze(object) {
	// Retrieve the property names defined on object
	var propNames = Object.getOwnPropertyNames(object);

	// Freeze properties before freezing self
	for (let name of propNames) {
		let value = object[name];

		if (value && typeof value === 'object') {
			deepFreeze(value);
		}
	}

	return Object.freeze(object);
}

const PAGE_FRAGMENTS_LOADED_BY_PAGE_PROCESSOR = '__uxfLoadedPageFragments';

const macroponentsLoadedByPageProcessor = get(
	window,
	[PAGE_FRAGMENTS_LOADED_BY_PAGE_PROCESSOR],
	[]
).map(([sysId]) => sysId);

export function getMacroponentSkipSet(customSkipSet) {
	return union(macroponentsLoadedByPageProcessor, Array.from(customSkipSet));
}

export const PAGE_PROCESSOR_LOADED_TEMPLATES = get(
	window,
	[PAGE_FRAGMENTS_LOADED_BY_PAGE_PROCESSOR],
	[]
).reduce((acc, [sysId, template]) => {
	if (template.length > 0) acc[sysId] = template;
	return acc;
}, {});

/**
 * Remove once Tectonic is able to polyfill this correctly.
 * Stolen from https://github.com/es-shims/Promise.allSettled/blob/master/implementation.js#L16
 */
export const polyfilledPromiseDotAllSettled = (promises) => {
	if (typeof Promise.allSettled === 'function')
		return Promise.allSettled(promises);
	else {
		return Promise.all(
			promises.map((item) => {
				const promise = Promise.resolve(item);
				try {
					return promise.then(
						function onFulfill(value) {
							return {
								status: 'fulfilled',
								value
							};
						},
						function onReject(reason) {
							return {status: 'rejected', reason};
						}
					);
				} catch (e) {
					return Promise.reject(e);
				}
			})
		);
	}
};

export const getJsonLiteral = (literal) => ({
	type: JSON_LITERAL,
	value: literal
});

export function getUserPrefLangCode() {
	const userSession = getUxGlobal('session');
	const langCode = userSession?.output?.user?.language;
	if (langCode) return langCode;
	return DEFAULT_LANG_CODE;
}

export const getFilteredObj = (incomingObj, func) => {
	if (!incomingObj) return incomingObj;

	return Object.keys(incomingObj).reduce((obj, key) => {
		if (func(key)) {
			obj[key] = incomingObj[key];
		}
		return obj;
	}, {});
};

export const getObjectWithoutUxfProps = (incomingObj) =>
	getFilteredObj(incomingObj, (key) => !key.startsWith('nowUxf'));
