import {isEmpty} from '@devsnc/snowdash';
import {has} from '@devsnc/snowdash';

/**
 * decodeParam
 * @param value
 * @returns {string|*}
 */
export const decodeParam = (value) => {
	try {
		return decodeURIComponent(value);
	} catch (err) {
		return value;
	}
};

/**
 * getLocationPathname
 *
 * @param location
 * @returns {string|*}
 */
export const getLocationPathname = (location) => {
	return sanitizePath(location.pathname);
};

/**
 * Cleans up sloppy URLs on the request object, like /foo////bar/// to /foo/bar.
 *
 * @function sanitizePath
 * @param    {Object} path - a url path to clean up
 * @returns  {String} cleaned path
 */
export const sanitizePath = (path) => {
	let cur,
		next,
		str = '';

	for (let i = 0; i < path.length; i++) {
		cur = path.charAt(i);

		if (i !== path.length - 1) {
			next = path.charAt(i + 1);
		}

		if (cur === '/' && (next === '/' || (next === '?' && i > 0))) {
			continue;
		}

		str += cur;
	}

	return str;
};

/**
 * camelToDash
 * @param str
 * @returns {*}
 */
export const camelToDash = (str) =>
	str.replace(/([A-Z])/g, ($1) => '-' + $1.toLowerCase());

/**
 * pathnameContainsSub
 *
 * @param path
 * @param subToken
 * @returns {boolean}
 */
export const pathnameContainsSub = (path, subToken = '/sub/') => {
	return path.indexOf(subToken) !== -1;
};

/**
 * paramsExistsInPathname
 * @param pDashed
 * @param path
 * @returns {boolean}
 */
export const paramsExistsInPathname = (pDashed, path) => {
	return paramOrderInPathname(pDashed, path) !== -1;
};

const paramOrderInPathname = (pDashed, path) => {
	const paramsStart = path.indexOf('/params/') - 1;
	const pathParams = path.slice(paramsStart);
	return pathParams.indexOf(`/${pDashed}/`);
};

/**
 * atLeastOneParamsExistsInPathname
 * @param params
 * @param path
 * @returns {boolean}
 */
export const atLeastOneParamsExistsInPathname = (params, path) => {
	let flag = false;

	for (let i = 0; i < params.length; i++) {
		const pDashed = camelToDash(params[i]);
		flag = paramsExistsInPathname(pDashed, path);

		if (flag) {
			break;
		}
	}

	return flag;
};

/**
 * getUXAppRouteConfig
 *
 * @param window
 * @returns {{
 * 	uxAppRouteConfig: ({
 * 		routes: {
 * 		  home: [{
 * 			macroponentSysId: string,
 * 			macroponentConfiguration: {},
 * 			fields: [string],
 * 			optionalParameters: [string]
 * 		  }],
 * 		  record: [{
 * 			macroponentSysId: string,
 * 			macroponentConfiguration: {},
 * 			fields: [string, string],
 * 			optionalParameters: [string, string, string]
 * 		  }],
 * 		  list: [{
 * 			macroponentSysId: string,
 * 			macroponentConfiguration: {},
 * 			fields: [string, string],
 * 			optionalParameters: [string, string, string]
 * 		  }]
 * 		},
 * 		authRoutes: {},
 * 		errorPages: {},
 * 		prefetchLimits: {routes: 0, screens: 0},
 *		queryString: false,
 * 		siteName: string,
 * 		landingPath: string
 * 	}|string)
 * }}
 */
export const getUXAppRouteConfig = (window) => {
	return {uxAppRouteConfig: window.ux_globals.routeConfiguration};
};

/**
 * isCustom404Available
 *
 * @param authRoutes
 * @param routes
 * @returns {boolean}
 */
export const isCustom404Available = (authRoutes, routes) => {
	return (
		!isEmpty(authRoutes) &&
		has(authRoutes, 'custom404') &&
		has(routes, authRoutes['custom404'])
	);
};

/**
 * getCustom404Route
 *
 * @param authRoutes
 * @param routes
 * @returns {{ route?: string, fields?: Array<string>, params?: Array<string> }}
 */
export const getCustom404Route = (authRoutes, routes) => {
	let custom404Route = {};
	if (has(authRoutes, 'custom404') && has(routes, authRoutes['custom404'])) {
		const {fields, optionalParameters: params} = routes[
			authRoutes['custom404']
		][0];
		custom404Route = {
			...custom404Route,
			route: authRoutes['custom404'],
			fields,
			params
		};
	}

	return custom404Route;
};

/**
 * getSiteName
 * @param uxAppConfig
 * @returns {string}
 */
export const getSiteName = (uxAppConfig) => {
	const {siteName = 'now/cwf/agent'} = uxAppConfig;
	return siteName;
};

/**
 * pathnameHasSub
 *
 * @param pathname
 * @returns {boolean}
 */
export const pathnameHasSub = (pathname) => !!pathname.match('/sub/');

/**
 * capitalizeFirstLetter
 *
 * @param string
 * @returns {string}
 */
export const capitalizeFirstLetter = (string) =>
	string.charAt(0).toUpperCase() + string.slice(1);

/**
 * buildNamedFields
 *
 * @param fields
 * @param forParent
 * @returns {string}
 */
const buildNamedFields = (fields, forParent = false) => {
	let path = '';

	if (!isEmpty(fields)) {
		fields.map((f) => {
			if (forParent) {
				path = path.concat(`/:parent${capitalizeFirstLetter(f)}`);
			} else {
				path = path.concat(`/:${f}`);
			}
		});
	}
	return path;
};

/**
 * buildNamedParams
 *
 * @param params
 * @param pathname
 * @param forParent
 * @returns {string}
 */
const buildNamedParams = (params, pathname, forParent = false) => {
	let path = '';

	if (!isEmpty(params)) {
		if (atLeastOneParamsExistsInPathname(params, pathname)) {
			path = path.concat(`/params`);

			params
				.sort(
					(a, b) =>
						paramOrderInPathname(camelToDash(a), pathname) -
						paramOrderInPathname(camelToDash(b), pathname)
				)
				.map((p) => {
					const pDashed = camelToDash(p);

					if (paramsExistsInPathname(pDashed, pathname)) {
						if (forParent) {
							path = path.concat(
								`/${pDashed}/:parent${capitalizeFirstLetter(p)}`
							);
						} else {
							path = path.concat(`/${pDashed}/:${p}`);
						}
					}
				});
		}
	}
	return path;
};

/**
 * appendFieldsAndParams
 *
 * @param fields
 * @param params
 * @param pathname
 * @param forParent
 * @returns {string}
 */
const appendFieldsAndParams = (fields, params, pathname, forParent = false) => {
	let path = '';

	if (!isEmpty(fields)) {
		path = path.concat(buildNamedFields(fields, forParent));
	}
	if (!isEmpty(params)) {
		path = path.concat(buildNamedParams(params, pathname, forParent));
	}
	return path;
};

/**
 * generateRoutePathForSubURL
 *
 * @param siteName
 * @param routeKey
 * @param route
 * @param pathname
 *
 * @returns {{
 * 	path: string,
 * 	parentHasFields: boolean,
 * 	hasFields: boolean,
 * 	parentHasParams: boolean,
 * 	hasParams: boolean
 * }}
 *
 * @example
 *   path: /now/cwf/agent/record/sn_customerservice_case/bc6a8a2ac3302200e7c7d44d81d3ae19/params/selected-tab-index/0/sub/record/csm_consumer/59e788fbdb1b1200b6075200cf9619d2/params/selected-tab-index/2
 *   route: /now/cwf/agent/record/:parentTable/:parentSysId/params/selected-tab-index/:parentSelectedTabIndex/sub/record/:table/:sysId/params/selected-tab-index/:selectedTabIndex
 */
export const generateRoutePathForSubURL = (
	siteName,
	routeKey,
	route,
	pathname
) => {
	const {fields, optionalParameters: params} = route;
	let path = `/${siteName}/${routeKey}`,
		parentHasFields = false,
		parentHasParams = false,
		hasFields = false,
		hasParams = false,
		hasSubUrl = pathnameHasSub(pathname);

	if (hasSubUrl && (!isEmpty(fields) || !isEmpty(params))) {
		parentHasFields = hasFields = !isEmpty(fields);
		parentHasParams = hasParams = !isEmpty(params);
		path = path.concat(appendFieldsAndParams(fields, params, pathname, true));
		path = path.concat(`/sub/${routeKey}`);
		path = path.concat(appendFieldsAndParams(fields, params, pathname, false));
	}

	return {path, parentHasFields, parentHasParams, hasFields, hasParams};
};

/**
 * generateRoutePath
 *
 * @param siteName
 * @param routeKey
 * @param route
 * @param pathname
 * @returns {{
 *     path: string,
 *     hasFields: boolean,
 *     hasParams: boolean
 * }}
 *
 * @example
 *   path: /now/cwf/agent/record/sn_customerservice_case/bc6a8a2ac3302200e7c7d44d81d3ae19/params/selected-tab-index/3
 *   route: /now/cwf/agent/record/:table/:sysId/params/selected-tab-index/:selectedTabIndex
 */
export const generateRoutePath = (siteName, routeKey, route, pathname) => {
	const {fields, optionalParameters: params} = route;
	let path = `/${siteName}/${routeKey}`,
		hasFields = !isEmpty(fields),
		hasParams = !isEmpty(params);

	path = path.concat(appendFieldsAndParams(fields, params, pathname, false));

	return {path, hasFields, hasParams};
};

/**
 * parseURLToRoute
 *
 * @param routeKey
 * @param route
 * @param matchedPath
 * @param pathHasFields
 * @param pathHasParams
 * @returns {{route: *, fields: {}, params: {}}}
 */
export const parseURLToRoute = (
	routeKey,
	route,
	matchedPath,
	pathHasFields,
	pathHasParams
) => {
	const {keys, params: fieldsAndParams} = matchedPath;
	const {fields, optionalParameters: params} = route;
	let routeObj = {route: routeKey, fields: {}, params: {}};
	let fieldsObj = {},
		paramsObj = {};

	if (!isEmpty(keys)) {
		// when path has fields, process the fields object
		if (pathHasFields && !isEmpty(fields)) {
			fields.forEach((f) => {
				fieldsObj[f] = fieldsAndParams[f];
			});
		}

		// when path has params, process the params object
		if (pathHasParams && !isEmpty(params)) {
			params.forEach((p) => {
				if (!isEmpty(fieldsAndParams[p])) {
					paramsObj[p] = fieldsAndParams[p];
				}
			});
		}
	}

	routeObj = {
		...routeObj,
		fields: {...fieldsObj},
		params: {...paramsObj}
	};

	return routeObj;
};
