import {
	registerComponent,
	setActionState
} from '@servicenow/now-trigger-library';
import {actionTypes} from '@servicenow/ui-core';

import {
	LIST_REFRESH_REQUESTED,
	LIST_REFRESH_REQUESTED_INTERNAL,
	LIST_TYPE_DEFAULT,
	LIST_TYPE_RELATED,
	LIST_TYPE_SNAPSHOT,
	OPEN_PANEL,
	PANEL_TYPE_FILTER
} from '../../constants';

const {COMPONENT_BOOTSTRAPPED, COMPONENT_PROPERTY_CHANGED} = actionTypes;

export const keyboardShortcutsBehavior = {
	name: 'keyboardShortcutsBehavior',
	actionHandlers: {
		[COMPONENT_BOOTSTRAPPED]: {
			effect: ({dispatch, host, updateState, properties}) => {
				const {hideFilterPanel, hideRefreshButton, listType} = properties;

				let parentComponentTagName;

				switch (listType) {
					case LIST_TYPE_DEFAULT:
						parentComponentTagName = 'now-record-list';
						break;
					case LIST_TYPE_RELATED:
						parentComponentTagName = 'now-record-list-related';
						break;
					case LIST_TYPE_SNAPSHOT:
						parentComponentTagName = 'now-record-list-snapshot';
						break;
					default:
						parentComponentTagName = 'now-record-list';
				}

				const triggerComponentId = registerComponent(host, {
					updateState,
					parentComponentTagName: parentComponentTagName,
					actionMap: {
						[LIST_REFRESH_REQUESTED]: {
							action: () => {
								dispatch(LIST_REFRESH_REQUESTED_INTERNAL, {
									timestamp: Date.now()
								});
							},
							active: !hideRefreshButton
						},
						OPEN_FILTER_PANEL: {
							action: () => {
								dispatch(OPEN_PANEL, {
									panelType: PANEL_TYPE_FILTER
								});
							},
							active: !hideFilterPanel
						}
					}
				});
				updateState({
					path: 'triggerComponentId',
					value: triggerComponentId,
					operation: 'set',
					shouldRender: false
				});
			}
		},
		[COMPONENT_PROPERTY_CHANGED]: coeffects => {
			const {
				state,
				payload: {name}
			} = coeffects;
			const {triggerComponentId, properties} = state;
			const {hideFilterPanel, hideRefreshButton} = properties;
			if (name === 'hideFilterPanel') {
				setActionState(
					triggerComponentId,
					'OPEN_FILTER_PANEL',
					!hideFilterPanel
				);
			}
			if (name === 'hideRefreshButton') {
				setActionState(
					triggerComponentId,
					[LIST_REFRESH_REQUESTED],
					!hideRefreshButton
				);
			}
		}
	}
};
