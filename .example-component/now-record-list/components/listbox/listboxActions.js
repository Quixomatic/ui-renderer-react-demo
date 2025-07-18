import {LISTBOX_ITEM_CLICKED, LISTBOX_SELECT} from './constants';

const handleItemClick = ({dispatch, action}) => {
	const {
		payload: {index, isDisabled}
	} = action;

	if (!isDisabled) dispatch(LISTBOX_SELECT, {index});
};

export default {
	[LISTBOX_ITEM_CLICKED]: {
		effect: handleItemClick,
		stopPropagation: true
	}
};
