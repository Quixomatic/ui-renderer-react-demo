import {actionTypes} from '@servicenow/ui-core';
import {viewportActions} from './../factory/constants';
import {onConnect, onDisconnect} from './componentViewportEffects';
import get from 'lodash/get';

const {COMPONENT_CONNECTED, COMPONENT_DISCONNECTED} = actionTypes;
const {UXF_VIEWPORT_RENDER, UXF_VIEWPORT_DISMISS} = viewportActions;

/**
 * Public behavior that can be used by Seismic components that act as "viewports"
 * (Examples include tab sets, contextual side bar, app shell UI viewports, etc.).
 *
 * Using with {..., options: {canSyncWithURL: true}} enables the seismic component
 * to load the screen based on the URL requests.
 */
export const uxfViewportBehavior = {
	name: 'uxfViewport',
	initialState: {
		viewportRouteRequestedFromEmitFn: {default: false}
	},
	properties: {
		viewportRoutes: {
			default: {},
			schema: {type: 'object'},
			deepCompare: true
		},
		activeRoute: {}
	},
	actionHandlers: {
		['VIEWPORT_ROUTE_REQUESTED']: {
			effect: (coeffects) => {
				const {
					action: {payload, meta},
					dispatch,
					updateState
				} = coeffects;

				const allowComponentViewportActionInEmitFn = get(
					meta,
					'uxfComponentViewportMeta.allowComponentViewportActionInEmitFn',
					false
				);

				updateState({
					path: 'viewportRouteRequestedFromEmitFn',
					value: allowComponentViewportActionInEmitFn,
					operation: 'set',
					shouldRender: false
				});

				dispatch(UXF_VIEWPORT_RENDER, payload);
			},
			stopPropagation: true
		},
		['VIEWPORT_ROUTE_DISMISSED']: {
			effect: (coeffects) => {
				const {
					dispatch,
					action: {payload}
				} = coeffects;
				dispatch(UXF_VIEWPORT_DISMISS, payload);
			},
			stopPropagation: true
		},
		[COMPONENT_CONNECTED]: onConnect,
		[COMPONENT_DISCONNECTED]: onDisconnect
	}
};
