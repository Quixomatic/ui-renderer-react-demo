import {get} from '@devsnc/snowdash';

import {getBasePath, getViewportElementIds} from './utils';
import {
	viewportActions,
	SIGNAL_VIEWPORT_ROUTE_INITIALIZATION_COMPLETION
} from '../../../factory/constants';

const {UXF_VIEWPORT_RENDER_BY_ID} = viewportActions;

export const updateRouteCollectionState = ({
	subroutesByViewportElementId,
	updateState,
	subroutes,
	dispatch,
	state,
	shouldCompleteRouteInitialization = true
}) => {
	let stateOperations = [];
	if (shouldCompleteRouteInitialization) {
		stateOperations.push({
			path: 'behaviors.viewportRuntime.isRouteInitializationCompleted',
			operation: 'set',
			value: true
		});
	}

	for (const viewportElementId in subroutesByViewportElementId) {
		stateOperations.push({
			path: `${getBasePath(viewportElementId)}.viewportRoutes`,
			operation: 'set',
			value: subroutesByViewportElementId[viewportElementId]
		});
	}

	if (shouldCompleteRouteInitialization)
		stateOperations[SIGNAL_VIEWPORT_ROUTE_INITIALIZATION_COMPLETION] = true;

	updateState(stateOperations);

	const viewportElementIds = getViewportElementIds(subroutes);

	viewportElementIds.forEach((id) => {
		const activeRoute = get(
			state,
			`${getBasePath(id)}.currentScreen.activeRoute`,
			null
		);
		if (
			activeRoute &&
			(subroutesByViewportElementId[id] || []).filter(
				(subroute) => subroute.routeType === activeRoute.routeType
			).length === 0
		) {
			const routeListByOrder = subroutesByViewportElementId[id].sort(
				(a, b) => (a.order || 0) - (b.order || 0)
			);
			if (routeListByOrder[0]) {
				dispatch(UXF_VIEWPORT_RENDER_BY_ID, {
					route: routeListByOrder[0].routeType,
					viewportElementId: id
				});
			}
		}
	});
};
