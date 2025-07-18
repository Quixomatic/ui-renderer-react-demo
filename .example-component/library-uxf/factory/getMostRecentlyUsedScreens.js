import {Cache} from './cache';
import {isEmpty} from '@devsnc/snowdash';
import {get} from '@devsnc/snowdash';
import {isNumber} from '@devsnc/snowdash';
import {map} from '@devsnc/snowdash';

const DEFAULT_CACHE_LIMIT = 10;

const getCacheLimit = () => {
	const chromeMainPageProperty = get(
		window,
		['ux_globals', 'pageProperties', 'chrome_main'],
		{}
	);
	let cacheLimit = DEFAULT_CACHE_LIMIT;

	try {
		if (!isEmpty(chromeMainPageProperty)) {
			const {maxCachedPageCount} = JSON.parse(chromeMainPageProperty);
			cacheLimit =
				isNumber(maxCachedPageCount) && maxCachedPageCount > 0
					? maxCachedPageCount
					: DEFAULT_CACHE_LIMIT;
		}
	} catch (e) {
		console.warn(
			'Skipped invalid JSON content in chrome_main page property evaluation.'
		);
	}

	return cacheLimit;
};

/**
 * cachedScreens instances are per Macroponent having sn-uxf-viewport-screen and not shared across other MCPs.
 * This is fine because there will only ever be ONE instance of `sn-uxf-viewport-screen` ever on a page. Currently,
 * this is being used for `sn-uxf-viewport-screen` but this Cache mechanism could be re-used in future for any
 * other non-destructive viewports [tab-set, sidebar or headless] to limit the growing
 * number of `<screen-action-transformer-*>` nodes.
 *
 * @type {Cache}
 */
// @ts-ignore
let cachedScreens = new Cache(getCacheLimit());

const getMostRecentlyUsedScreens = (viewportContent) => {
	let usedScreens = {};
	const {screens} = viewportContent;

	if (!isEmpty(screens)) {
		const screenKey = get(viewportContent, ['currentScreen', 'screenKey']);

		cachedScreens.has(screenKey)
			? cachedScreens.get(screenKey)
			: cachedScreens.set(screenKey, screens[screenKey]);
	}

	if (cachedScreens.size) {
		map(screens, (screen) => {
			const {screenKey} = screen;
			const screenFromCache = cachedScreens.find(screenKey);
			usedScreens[screenKey] = screenFromCache;
		});
	}

	return usedScreens;
};

export default getMostRecentlyUsedScreens;
