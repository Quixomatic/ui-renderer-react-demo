import {getLocationPathname, getUXAppRouteConfig} from './helpers';
import findRoute from './findRoute';
import {viewportActions} from './../factory/constants';
import {isEmpty} from '@devsnc/snowdash';

const {UXF_VIEWPORT_RENDER_BY_ID} = viewportActions;

/**
 * setupLocationChangeEvents
 */
const setupLocationChangeEvents = () => {
	let pushState = history.pushState;
	let replaceState = history.replaceState;

	history.pushState = function() {
		pushState.apply(history, arguments);
		window.dispatchEvent(new Event('pushstate'));
		window.dispatchEvent(new Event('locationchange'));
	};

	history.replaceState = function() {
		replaceState.apply(history, arguments);
		window.dispatchEvent(new Event('replacestate'));
		window.dispatchEvent(new Event('locationchange'));
	};

	window.addEventListener('popstate', function() {
		window.dispatchEvent(new Event('locationchange'));
	});
};

/**
 * activateLocationChange
 *
 * @param properties
 * @param dispatch
 */
const activateLocationChange = (properties, dispatch, updateState) => {
	window.addEventListener('locationchange', (e) => {
		onURLChange(e, properties, dispatch, updateState);
	});
};

/**
 * inactivateLocationChange
 *
 * @param properties
 * @param dispatch
 * @param updateState
 */
const inactivateLocationChange = (properties, dispatch, updateState) => {
	window.removeEventListener('locationchange', (e) => {
		onURLChange(e, properties, dispatch, updateState);
	});
};

/**
 * loadViewportContent
 *
 * @param properties
 * @param dispatch
 */
const loadViewportContent = (properties, dispatch, updateState) => {
	const {uxAppRouteConfig} = getUXAppRouteConfig(window);
	const {siteName, routes, authRoutes} = uxAppRouteConfig;
	const pathname = getLocationPathname(window.location);
	const {found, currentRoute} = findRoute(
		routes,
		pathname,
		siteName,
		authRoutes
	);

	if (found) {
		// when route match found, load the screen
		dispatch(UXF_VIEWPORT_RENDER_BY_ID, {
			...currentRoute,
			viewportElementId: 'uxf-viewport-screen',
			reinitialize: true
		});
	} else {
		// when no matched routes, render default custom 404 message
		onPageNotFound(currentRoute, dispatch, updateState);
	}
};

/**
 * onURLChange
 *
 * @param event
 * @param properties
 * @param dispatch
 * @param updateState
 */
const onURLChange = (event, properties, dispatch, updateState) => {
	loadViewportContent(properties, dispatch, updateState);
};

/**
 * onConnect
 *
 * @param action
 * @param properties
 * @param dispatch
 * @param updateState
 */
export const onConnect = ({action, properties, dispatch, updateState}) => {
	const {options} = action.payload;
	if (options.canSyncWithURL) {
		setupLocationChangeEvents();
		loadViewportContent(properties, dispatch, updateState);
		activateLocationChange(properties, dispatch, updateState);
	}
};

/**!
 * onPageNotFound
 *
 * @param currentRoute
 * @param dispatch
 * @param updateState
 */
export const onPageNotFound = (currentRoute, dispatch, updateState) => {
	if (isEmpty(currentRoute)) {
		updateState([
			{
				path: 'behaviors.uxfViewport.showDefault404',
				operation: 'set',
				value: true
			}
		]);
	} else {
		dispatch(UXF_VIEWPORT_RENDER_BY_ID, {
			...currentRoute,
			viewportElementId: 'uxf-viewport-screen',
			reinitialize: true
		});
	}
};

/**
 * onDisconnect
 *
 * @param action
 * @param properties
 * @param dispatch
 * @param updateState
 */
export const onDisconnect = ({action, properties, dispatch, updateState}) => {
	const {options} = action.payload;
	if (options.canSyncWithURL) {
		inactivateLocationChange(properties, dispatch, updateState);
	}
};
