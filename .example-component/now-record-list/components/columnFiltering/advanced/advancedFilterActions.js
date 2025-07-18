import {NOW_GRID_CLOSE_POPOVER} from '@servicenow/now-grid';

import {dirtyModalInterceptor} from '../../../behaviors/dirtyBehavior/dirtyBehavior';
import {
	GRID_ADD_GROUPBY,
	GRID_CLOSE_POPOVER,
	GRID_REMOVE_GROUPBY,
	NOW_BUTTON_ICONIC_CLICKED,
	OPEN_PANEL,
	PANEL_TYPE_FILTER,
	TEXT_LINK_CLICKED
} from '../../../constants';
import {FILTER_CLOSE_BUTTON} from '../constants';
import {closeFilterPopOver} from '../helpers';

export default {
	[NOW_BUTTON_ICONIC_CLICKED]: {
		effect: ({dispatch, state, action}) => {
			const {nowTableReturnFocus} = state.properties;

			const componentName =
				action.meta.componentName || action.payload.componentName;

			if (componentName === FILTER_CLOSE_BUTTON) {
				closeFilterPopOver(nowTableReturnFocus, dispatch);
			}
		},
		stopPropagation: true
	},
	[TEXT_LINK_CLICKED]: {
		effect: ({dispatch, action, state}) => {
			const {
				payload: {actionName, field}
			} = action;
			const {nowTableReturnFocus} = state.properties;

			switch (actionName) {
				case OPEN_PANEL:
					dispatch(OPEN_PANEL, {panelType: PANEL_TYPE_FILTER});
					dispatch(GRID_CLOSE_POPOVER);
					dispatch(NOW_GRID_CLOSE_POPOVER, {setParentFocus: true});
					nowTableReturnFocus();
					break;

				case GRID_ADD_GROUPBY:
				case GRID_REMOVE_GROUPBY:
					dispatch(actionName, {field});
					break;
			}
		},
		stopPropagation: false,
		interceptors: [dirtyModalInterceptor]
	}
};
