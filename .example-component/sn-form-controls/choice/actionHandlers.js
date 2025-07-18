import { CALLBACK_AND_DISPATCH, isAttrFalse } from '@devsnc/sn-controls-common';
import { actionTypes } from '@servicenow/ui-core';
import {
	NOW_DROPDOWN_CUSTOM_TARGET,
	NOW_DROPDOWN_LIST,
	SN_RECORD_CHOICE
} from './constants';

const focusTrigger = host => {
	const trigger = host.shadowRoot.querySelector('.sn-control-field');
	if (trigger) trigger.focus();
};

const dispatchOnValueChange = ({ onValueChange, dispatchPayload, dispatch }) =>
	dispatch(CALLBACK_AND_DISPATCH, {
		callback: onValueChange,
		isValueChanged: true,
		dispatchPayload
	});

export const actionHandlers = {
	[actionTypes.COMPONENT_DOM_TREE_READY]: ({ host, properties }) => {
		const { autofocus, readonly } = properties;
		if (autofocus && isAttrFalse(readonly)) focusTrigger(host);
	},
	[NOW_DROPDOWN_CUSTOM_TARGET.SELECTED_ITEMS_SET]: ({
		action,
		properties,
		dispatch
	}) => {
		const { label: displayValue, id: value } = action.payload.items[0];
		const { onValueChange } = properties;
		const dispatchPayload = { value, displayValue };
		dispatchOnValueChange({ onValueChange, dispatchPayload, dispatch });
		action.stopPropagation();
	},
	[NOW_DROPDOWN_CUSTOM_TARGET.OPENED_SET]: ({ action, updateState }) => {
		const { value } = action.payload;
		updateState({
			isDropdownOpen: value
		});
		action.stopPropagation();
	},
	[NOW_DROPDOWN_CUSTOM_TARGET.ITEM_CLICKED]: {
		stopPropagation: true
	},
	[NOW_DROPDOWN_LIST.ITEM_CLICKED]: {
		stopPropagation: true
	},
	[SN_RECORD_CHOICE.FOCUS_SET]: ({ action, updateState }) => {
		const { value } = action.payload;
		updateState({
			isFocused: value
		});
		action.stopPropagation();
	}
};
