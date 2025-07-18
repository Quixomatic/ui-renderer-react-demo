import {isEmpty} from '@devsnc/snowdash';
import {isValidPrefetchLimits} from './utils';
import {flatMap} from '@devsnc/snowdash';
import getTemplates from '../../../templateLoader/getTemplates';
import {union} from '@devsnc/snowdash';
import {whenScreenMacroponentIdleDuringPageLoad} from '@devsnc/uxf-runtime-utils';

// Arbitrary value of 10 chosen for whether we try to pre load the macroponents of the viewports for
// this macroponent. Pre loading macroponents speeds up the experience of tab switching, for example, but
// pre loading too many macroponents drastically increases time to initial page load. This is an attempt at a balance.
const MAXIMUM_MACROPONENTS_FOR_PRELOAD = 10;
// TODO: How can we more intelligently determine which macroponents to pre load, without being forced to
// load either all of them or none of them?

// Amount of time we wait on the screen macroponent to be idle before giving up.
// This only gets used in case the logic to determine idle-ness fails for whatever reason.
// The value is set arbitrarily and can be revised if there is a more suitable number that works better.
const TEMPLATE_PRIMING_MAX_WAIT_MS = 10000;

/**
 * cacheTopLevelTemplates: Prefetch the screen macroponents for the app shell MCP based on the prefetch_limits
 *     configured in ux app configuration record.
 *
 * @param subroutes
 * @param prefetchLimits
 * @returns {boolean}
 */
const cacheTopLevelTemplates = (subroutes, prefetchLimits) => {
	if (
		!isEmpty(prefetchLimits) &&
		!isEmpty(subroutes) &&
		isValidPrefetchLimits(prefetchLimits)
	) {
		const {routes: routeCount, screens: screenCount} = prefetchLimits;
		const viewportSubroutes = subroutes
			.sort((r1, r2) =>
				r1.order > r2.order ? 1 : r2.order > r1.order ? -1 : 0
			)
			.filter(
				(subroute, index) =>
					subroute.parentCompositionElementId && index < routeCount
			);

		const macroponentSysIds = flatMap(
			viewportSubroutes,
			(subroute) =>
				subroute.macroponents.filter((mcp, index) => index < screenCount) || []
		).reduce((acc, cur) => {
			acc.push(cur.macroponentSysId);
			return acc;
		}, []);

		const scheme = window.requestIdleCallback || window.requestAnimationFrame;
		const cancelScheme =
			window.cancelIdleCallback || window.cancelAnimationFrame;
		const id = scheme(() => {
			getTemplates(union(macroponentSysIds));
			cancelScheme(id);
		});
	}

	return true;
};

/**
 * cacheTemplates: Prefetch the screen macroponents for the viewports (uxf-tab-set, contextual-sidebar,
 *    headless viewports) based on the MAXIMUM_MACROPONENTS_FOR_PRELOAD.
 *
 *    TODO: Once we have the viewport prefetch_limits defined at metadata, "cacheTopLevelTemplates" could
 *          be re-used.
 *
 * @param subroutes
 * @returns {boolean}
 */
const cacheTemplates = (subroutes) => {
	// Getting only the subroutes that have a parent composition element ID
	// If this isn't present, it can't be rendered by this runtime anyway.
	const viewportSubroutes = subroutes.filter(
		(subroute) => subroute.parentCompositionElementId
	);

	const macroponentSysIds = flatMap(
		viewportSubroutes,
		(subroute) => subroute.macroponents || []
	).reduce((acc, cur) => {
		acc.push(cur.macroponentSysId);
		return acc;
	}, []);

	if (macroponentSysIds.length > MAXIMUM_MACROPONENTS_FOR_PRELOAD) {
		return false;
	}

	getTemplates(union(macroponentSysIds));
	return true;
};

/**
 * primeTemplateCache
 *
 * @param subroutes
 * @param prefetchLimits
 * @param hasViewportScreen
 * @returns {boolean}
 */
export const primeTemplateCache = async (
	subroutes,
	prefetchLimits,
	hasViewportScreen
) => {
	let cached = false;

	if (hasViewportScreen) {
		// Cache the screen macroponents for the top-level MCP based on
		// the configured prefetch_limits
		cached = cacheTopLevelTemplates(subroutes, prefetchLimits);
	} else {
		await whenScreenMacroponentIdleDuringPageLoad({
			maxWait: TEMPLATE_PRIMING_MAX_WAIT_MS
		});
		// continue to cache the MCP arbitrarily value of 10 chosen to pre load the macroponents
		// of the viewports for other descendant macroponents.
		cached = cacheTemplates(subroutes);
	}

	return cached;
};
