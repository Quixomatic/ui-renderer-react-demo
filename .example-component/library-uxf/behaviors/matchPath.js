import pathToRegexp from 'path-to-regexp';
import {decodeParam} from './helpers';

const {hasOwnProperty} = Object.prototype;
const cache = new Map();

// see https://github.com/pillarjs/path-to-regexp/issues/148
cache.set('|false', {
	keys: [],
	pattern: /(?:)/
});

/**
 * matchPath
 *
 * @param routePath
 * @param pathname
 * @param exact
 * @returns {{path: string, keys: [], params: {}}|*}
 */
const matchPath = (routePath, pathname, exact = true) => {
	const cacheKey = `${routePath}|${exact}`;
	let regexp = cache.get(cacheKey);

	if (!regexp) {
		const keys = [];
		regexp = {
			keys,
			pattern: pathToRegexp(routePath, keys, {
				end: exact,
				strict: true
			})
		};
		cache.set(cacheKey, regexp);
	}
	const m = regexp.pattern.exec(pathname);

	if (!m) {
		return null;
	}

	const params = {};

	for (let i = 1; i < m.length; i++) {
		const key = regexp.keys[i - 1];
		const prop = key.name;
		const value = m[i];
		if (value !== undefined || !hasOwnProperty.call(params, prop)) {
			if (key.repeat) {
				params[prop] = value ? value.split(key.delimiter).map(decodeParam) : [];
			} else {
				params[prop] = value ? decodeParam(value) : value;
			}
		}
	}

	return {
		path: m[0],
		keys: regexp.keys,
		params
	};
};

export default matchPath;
