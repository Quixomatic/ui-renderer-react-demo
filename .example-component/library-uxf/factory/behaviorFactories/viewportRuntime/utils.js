import {uniq} from '@devsnc/snowdash';
import {isNumber} from '@devsnc/snowdash';

export const getConditionProperties = (macroponentProperties, properties) => {
	return Object.keys(macroponentProperties).reduce((acc, cur) => {
		acc[cur] = properties[cur];
		return acc;
	}, {});
};

export const getBasePath = (viewportElementId) => {
	return `behaviors.viewportRuntime.viewports.${viewportElementId}`;
};

export const getViewportElementIds = (subroutes) => {
	return uniq(subroutes.map((subroute) => subroute.parentCompositionElementId));
};

export const uniqueScreenKey = (fields, route) => {
	return Object.keys(fields).reduce((route, key) => {
		return typeof fields[key] === 'string'
			? `${route}~${key}~${fields[key]}`
			: `${route}~${key}~${JSON.stringify(fields[key])}`;
	}, route);
};

export const includeScreenKey = (useScreenKey, screenKey) =>
	useScreenKey ? {screenKey} : {};

export const isValidPrefetchLimits = (prefetchLimits) => {
	const {routes: routesCount, screens: screensCount} = prefetchLimits;
	return (
		isNumber(routesCount) &&
		routesCount &&
		isNumber(screensCount) &&
		screensCount
	);
};
