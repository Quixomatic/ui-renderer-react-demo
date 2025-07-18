import {getAndClearRetainedFocus} from '@devsnc/sn-list-commons';
import {NOW_GRID_CLOSE_POPOVER} from '@servicenow/now-grid';

import {dirtyModalInterceptor} from '../../behaviors/dirtyBehavior/dirtyBehavior';
import {
	GRID_CELL_LIST,
	GRID_CLOSE_POPOVER,
	LIST_SELECT_FROM_DROPDOWN
} from '../../constants';

import {CELL_FILTERING_ENTER, CELL_FILTERING_OPTION_CLICKED} from './constants';

const enterEffect = ({state, dispatch}) => {
	const {listInstanceId, popover, selectionIndex: index} = state.properties;
	selectDropDown({dispatch, index, popover, listInstanceId});
};

const optionClickedEffect = ({state, dispatch, action}) => {
	const {listInstanceId, popover} = state.properties;
	const {index} = action.payload;

	selectDropDown({dispatch, index, popover, listInstanceId});
};

const selectDropDown = ({dispatch, index, popover, listInstanceId}) => {
	dispatch(LIST_SELECT_FROM_DROPDOWN, {
		index,
		dropdownName: GRID_CELL_LIST,
		context: popover.context
	});
	// Needed for tree grid
	dispatch(GRID_CLOSE_POPOVER);
	dispatch(NOW_GRID_CLOSE_POPOVER, {setParentFocus: true});
	getAndClearRetainedFocus(listInstanceId);
};

export default {
	[CELL_FILTERING_ENTER]: {
		effect: enterEffect,
		stopPropagation: true,
		interceptors: [dirtyModalInterceptor]
	},
	[CELL_FILTERING_OPTION_CLICKED]: {
		effect: optionClickedEffect,
		stopPropagation: true,
		interceptors: [dirtyModalInterceptor]
	}
};
