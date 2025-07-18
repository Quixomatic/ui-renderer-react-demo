import {
	generateRoutePath,
	generateRoutePathForSubURL,
	parseURLToRoute,
	isCustom404Available,
	getCustom404Route,
	pathnameHasSub
} from './helpers';
import matchPath from './matchPath';
import {isEmpty} from '@devsnc/snowdash';
import {get} from '@devsnc/snowdash';

/**!
 * findRoute
 *
 * @param routes
 * @param pathname
 * @param siteName
 * @param authRoutes
 * @returns {{found: boolean, currentRoute: {}}}
 */
const findRoute = (
	routes = {},
	pathname = window.location.pathname,
	siteName = 'now/cwf/agent',
	authRoutes = {}
) => {
	const routeKeys = Object.keys(routes);
	let currentRoute = {},
		found = false;

	for (let i = 0; i < routeKeys.length; i++) {
		const route = routes[routeKeys[i]][0];
		const {fields, params} = route;
		let routePath = '',
			hasFields = false,
			hasParams = false,
			matches = {},
			routePathObj = {};

		if (pathnameHasSub(pathname) && (!isEmpty(fields) || !isEmpty(params))) {
			routePathObj = generateRoutePathForSubURL(
				siteName,
				routeKeys[i],
				route,
				pathname
			);
		} else {
			routePathObj = generateRoutePath(siteName, routeKeys[i], route, pathname);
		}

		routePath = get(routePathObj, 'path');
		hasFields = get(routePathObj, 'hasFields');
		hasParams = get(routePathObj, 'hasParams');
		matches = matchPath(routePath, pathname);

		if (matches) {
			currentRoute = parseURLToRoute(
				routeKeys[i],
				route,
				matches,
				hasFields,
				hasParams
			);
			found = true;
		}
	}

	if (!found && isCustom404Available(authRoutes, routes)) {
		found = true;
		currentRoute = getCustom404Route(authRoutes, routes);
	}

	return {found, currentRoute};
};

export default findRoute;
