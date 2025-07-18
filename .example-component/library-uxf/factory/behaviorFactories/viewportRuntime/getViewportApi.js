import {klona} from 'klona';
import {get} from '@devsnc/snowdash';

const createRoute = ({name, icon, order, fields, optionalParameters}) => {
	return {
		name,
		icon,
		order,
		fields,
		optionalParameters,
		metadata: {}
	};
};

export const buildViewportApi = (viewports, isRouteInitializationCompleted) => {
	const viewportApi = Object.entries(viewports).reduce(
		(viewports, [currentViewportId, currentViewport]) => {
			const viewportRoutes = get(currentViewport, 'viewportRoutes', []).reduce(
				(routes, currentRoute) => {
					routes[currentRoute.routeType] = createRoute(currentRoute);
					return routes;
				},
				{}
			);

			viewports[currentViewportId] = new Proxy(
				{
					activeRoute: get(currentViewport, 'currentScreen.activeRoute', {}),
					routeDefinitions: viewportRoutes,
					hasRoutes: Object.entries(viewportRoutes).length > 0
				},
				{
					set() {
						return false;
					}
				}
			);

			return viewports;
		},
		{isRouteInitializationCompleted}
	);

	return new Proxy(viewportApi, {
		get(obj, prop) {
			// If a viewport has no routes it isn't exposed in the api
			// in that case we return an obj with hasRoutes=false
			return prop in obj ? obj[prop] : {hasRoutes: false};
		},

		set() {
			return false;
		}
	});
};

const getViewportApi = (seismicState) => {
	// We're deep cloning to prevent nested mutations by users affecting the viewportRuntime behavior
	// Using cloneDeep instead of a recursive freeze or object proxying is faster
	const viewports = klona(
		get(seismicState, 'behaviors.viewportRuntime.viewports', {})
	);
	const isRouteInitializationCompleted = get(
		seismicState,
		'behaviors.viewportRuntime.isRouteInitializationCompleted',
		false
	);
	return buildViewportApi(viewports, isRouteInitializationCompleted);
};

const getLazyViewportApi = (seismicState) => {
	let viewportApi = null;

	return new Proxy(
		{},
		{
			get(target, prop) {
				if (viewportApi == null) {
					viewportApi = getViewportApi(seismicState);
				}

				return Reflect.get(viewportApi, prop);
			},
			set() {
				return false;
			},
			deleteProperty() {
				return false;
			}
		}
	);
};

export default getLazyViewportApi;
