import snHttp from '../snHttpInstance';
import {
	getPageContextId,
	PAGE_PROCESSOR_LOADED_TEMPLATES,
	polyfilledPromiseDotAllSettled,
	getMacroponentSkipSet,
	getUxGlobal,
	getUserPrefLangCode
} from './utils';
import getUxfSysProp from '../utils/getUxfSysProp.js';
import createMacroponentFragmentGenerator from './createMacroponentFragmentGenerator.js';
import createFragmentGenerator from './createFragmentGenerator';
import {has} from '@devsnc/snowdash';
import {get} from '@devsnc/snowdash';
import {partition} from '@devsnc/snowdash';
import {union} from '@devsnc/snowdash';
import createBatchingQueue from './createBatchingQueue.js';
import {PAGE_FRAGMENT_PARTIAL_CONTENT_CACHE_ENABLED} from './getClientCacheableContent.js';
import {getPrefetchableRequests} from './getPrefetchableRequests.js';
import {isNil} from '@devsnc/snowdash';

import getReconstructedPageFragment from './getReconstructedPageFragment.js';
import {memoize} from '@servicenow/ui-utils';
import {USER_PREF_LANG_HEADER} from '../factory/constants';

export function createTemplateLoader({
	addTimestamp = false,
	awaitSeedingComplete = false,
	withAppConfigAgnosticSubRoutes = false
} = {}) {
	let resolveSeedingCompletePromise = () => {
		console.warn('Seeding complete called prematurely.');
	};

	const seedingComplete = new Promise((resolve) => {
		resolveSeedingCompletePromise = resolve;
	});

	const SeededPageFragments = new Map();
	const PageFragmentGeneratorCache = new Map();
	const SeededPageFragmentLoaderPromises = new Map();

	function getSkipSet() {
		return getMacroponentSkipSet(
			union(
				Array.from(SeededPageFragments.keys()),
				Array.from(PageFragmentGeneratorCache.keys())
			)
		);
	}

	async function getFragmentGenerator(pageFragment, awaitAssetLoading) {
		const {sysId: macroponentSysId} = pageFragment;

		const reconstructedPageFragment = await getReconstructedPageFragment(
			pageFragment
		);
		const prefetchableRequests = getPrefetchableRequests(macroponentSysId);
		if (prefetchableRequests.length > 0) {
			sendPrefetchRequest(prefetchableRequests, macroponentSysId);
		}

		const fragmentGeneratorFn = await createMacroponentFragmentGenerator(
			reconstructedPageFragment,
			addTimestamp ? Date.now() : undefined,
			awaitAssetLoading,
			withAppConfigAgnosticSubRoutes
		);
		PageFragmentGeneratorCache.set(macroponentSysId, fragmentGeneratorFn);
		return fragmentGeneratorFn;
	}

	async function fetchPageFragments(macroponentSysIds) {
		try {
			const snHttpRef = await snHttp();
			const {data: {result: fetchedFragments = []} = {}} =
				await snHttpRef.request(
					'/api/now/uxframework/macroponent_drivers',
					'POST',
					{
						data: {
							excludeStaticContent: true,
							excludeClientCacheableContent:
								PAGE_FRAGMENT_PARTIAL_CONTENT_CACHE_ENABLED,
							macroponentSysIds,
							macroponentSkipSet: getSkipSet(),
							pageContextId: getPageContextId(),
							withAppConfigAgnosticSubRoutes
						},
						batch: false,
						headers: {[USER_PREF_LANG_HEADER]: getUserPrefLangCode()}
					}
				);
			return fetchedFragments;
		} catch (e) {
			console.warn(
				'Failed to retrieve page fragments for these sys ids:',
				macroponentSysIds
			);
			return [];
		}
	}

	async function fetchAndLoadFragmentGenerators(macroponentSysIds) {
		const [macroponentSysIdsToLookup, macroponentSysIdsToFetch] = partition(
			macroponentSysIds,
			(macroponentSysId) => SeededPageFragments.has(macroponentSysId)
		);

		const fetchedFragments =
			macroponentSysIdsToFetch.length > 0
				? await fetchPageFragments(macroponentSysIdsToFetch)
				: [];

		const seededFragments = macroponentSysIdsToLookup.map((macroponentSysId) =>
			SeededPageFragments.get(macroponentSysId)
		);

		const fragments = [...seededFragments, ...fetchedFragments];

		for (let j = 0; j < fragments.length; j++)
			await getFragmentGenerator(fragments[j]);
	}

	const {enqueue: enqueueFetchPageFragment, whenIdle: whenGetTemplatesIdle} =
		createBatchingQueue(async (batch) => {
			const macroponentSysIds = batch.map(
				([_, __, macroponentSysId]) => macroponentSysId
			);

			// Check if any of the macroponentSysIds could be skipped (because they were resolved in an earlier batch response)
			const macroponentSysIdsToFetch = macroponentSysIds.filter(
				(macroponentSysId) => !PageFragmentGeneratorCache.has(macroponentSysId)
			);

			await fetchAndLoadFragmentGenerators(macroponentSysIdsToFetch);
			// we don't know when a particular macroponent request has failed from the REST service yet, so always resolve
			batch.forEach(([resolve]) => resolve());
		});

	function getTemplateGeneratorPromise(macroponentSysId) {
		if (isNil(macroponentSysId)) return;

		if (PageFragmentGeneratorCache.has(macroponentSysId)) {
			return Promise.resolve();
		} else if (has(PAGE_PROCESSOR_LOADED_TEMPLATES, [macroponentSysId])) {
			const fragmentGeneratorFn = createFragmentGenerator(
				get(PAGE_PROCESSOR_LOADED_TEMPLATES, [macroponentSysId])
			);
			PageFragmentGeneratorCache.set(macroponentSysId, fragmentGeneratorFn);
			return Promise.resolve();
		} else if (SeededPageFragmentLoaderPromises.has(macroponentSysId)) {
			return SeededPageFragmentLoaderPromises.get(macroponentSysId);
		} else {
			return enqueueFetchPageFragment(macroponentSysId);
		}
	}

	const memoizedGetTemplateGeneratorPromise = memoize(
		getTemplateGeneratorPromise
	);

	async function getTemplates(
		macroponentSysIds = [],
		_withConsolidatedScripts
	) {
		if (macroponentSysIds.length === 0) return;
		// Wait for the HTML document to signal that it has finished seeding everything it has
		if (awaitSeedingComplete) await seedingComplete;

		// Kick off requests for all the macroponents
		await polyfilledPromiseDotAllSettled(
			macroponentSysIds.map(memoizedGetTemplateGeneratorPromise)
		);

		// Once all the requests are finished, look them up in the cache
		return macroponentSysIds.reduce((acc, macroponentSysId) => {
			acc[macroponentSysId] = PageFragmentGeneratorCache.get(macroponentSysId);
			return acc;
		}, {});
	}

	function deleteCache(macroponentSysIds = []) {
		macroponentSysIds.forEach((macroponentSysId) => {
			memoizedGetTemplateGeneratorPromise.cache.delete(macroponentSysId);
			PageFragmentGeneratorCache.delete(macroponentSysId);
		});
	}

	function seedPageFragment(rawPageFragment) {
		const {sysId} = rawPageFragment;
		SeededPageFragments.set(sysId, rawPageFragment);
	}

	function loadSeededPageFragment(sysId) {
		SeededPageFragmentLoaderPromises.set(
			sysId,
			getFragmentGenerator(SeededPageFragments.get(sysId), true)
		);
	}

	function signalSeedingComplete() {
		resolveSeedingCompletePromise();
	}

	function sendPrefetchRequest(requests, macroponentSysId) {
		const prefetchEnabled = getUxfSysProp(
			'glide.uxf.lib.api_prefetch.known_queries.enabled',
			false
		);
		if (prefetchEnabled) {
			//TODO: evaluate, may be need to fire n request ?
			const {data, url, method = 'POST'} = requests[0] || {};
			if (!data || !url) return;
			snHttp().then((snHttpInstance) =>
				snHttpInstance
					.request(url, method, {
						data: [data],
						headers: {
							'X-Now-Requested-As-Prefetch': true
						}
					})
					.catch(() =>
						console.warn(
							`Error occured while prefetching ${data.operationName} for ${macroponentSysId}`
						)
					)
			);
		}
	}

	return {
		getTemplates,
		seedPageFragment,
		loadSeededPageFragment,
		signalSeedingComplete,
		deleteCache,
		whenGetTemplatesIdle
	};
}

// This is set to `true` by the page processor
const SERVED_BY_GLIDE = getUxGlobal('documentServedByGlide', false);

const SUPPORTS_MULTIPLE_EXPERIENCES = getUxGlobal(
	'documentSupportsMultipleExperiences',
	false
);

// Only await seeding complete when served in the glide environment
// to keep backwards compatibility for non-glide environments like
// tectonic dev server, jest, karma functional test runner, etc.
const instance = createTemplateLoader({
	awaitSeedingComplete: SERVED_BY_GLIDE,
	withAppConfigAgnosticSubRoutes: SUPPORTS_MULTIPLE_EXPERIENCES
});

export const seedPageFragment = instance.seedPageFragment;
export const signalSeedingComplete = instance.signalSeedingComplete;
export const loadSeededPageFragment = instance.loadSeededPageFragment;
export const getTemplates = instance.getTemplates;
export const whenGetTemplatesIdle = instance.whenGetTemplatesIdle;
export default getTemplates;
