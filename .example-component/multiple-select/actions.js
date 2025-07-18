import { actionTypes } from '@servicenow/ui-core';
import { SC_FORM_VALUECHANGE } from '../common/constants';
import {
	OPEN_RECORD,
	BUTTON_BARE_CLICKED,
	FOOTER_CLICKED,
	MODAL_DISMISSED,
	NOW_BUTTON_ICONIC,
	CANCEL,
	MESSAGE,
	IFRAME_LOADED,
	SERIALIZED_STRING_DISPATCHED,
	SLUSHBUCKET_UPDATED,
	MAX_ELEMENTS_ERROR
} from './constants.js';
const { COMPONENT_BOOTSTRAPPED } = actionTypes;
import { getValueListFromField } from './utils';

export const actionHandlers = {
	[BUTTON_BARE_CLICKED]: ({ updateState }) => {
		updateState({
			path: 'openModal',
			operation: 'set',
			value: true
		});
	},
	[NOW_BUTTON_ICONIC]: ({
		action: {
			payload: { action = '', table = '', id = '' }
		}
	}) => {
		if (action == OPEN_RECORD) {
			const url = `/${table}.do?sys_id=${id}`;
			window.open(url, '_blank');
		}
	},
	[FOOTER_CLICKED]: ({
		state: { valuesList = [] },
		dispatch,
		updateState,
		action: {
			payload: {
				action: { label }
			}
		}
	}) => {
		if (label !== CANCEL) {
			const validValues = valuesList.filter(val => val && val.value);
			// limiting max entires to 50 as large number might cause issue while passing through url
			if (validValues.length > 50) {
				window.postMessage(
					{ action: MAX_ELEMENTS_ERROR },
					window.location.origin
				);
				return;
			}
			dispatch(SC_FORM_VALUECHANGE, {
				value: validValues
					.reduce((acc, { value = '' }) => {
						acc.push(value);
						return acc;
					}, [])
					.join(),
				displayValue: validValues.reduce((acc, { displayValue = '' }) => {
					acc.push(displayValue);
					return acc;
				}, [])
			});
		}
		updateState({
			path: 'openModal',
			operation: 'set',
			value: false
		});
	},
	[MODAL_DISMISSED]: ({ updateState }) => {
		updateState({
			path: 'openModal',
			operation: 'set',
			value: false
		});
	},
	[COMPONENT_BOOTSTRAPPED]: {
		effect({ updateState, state }) {
			const {
				properties: { field }
			} = state;
			const valuesList = getValueListFromField(field);
			updateState({
				path: 'valuesList',
				value: valuesList,
				operation: 'set',
				shouldRender: false
			});
			window.addEventListener(
				MESSAGE,
				updateMultipleSelectValue.bind(null, updateState),
				false
			);
		}
	},
	[IFRAME_LOADED]: ({
		properties: {
			formData: { serializedChanges },
			field: {
				referringRecordId,
				templateValue = '',
				templateRestricted = false
			}
		}
	}) => {
		var serializedString = '';
		if (serializedChanges && serializedChanges != '') {
			for (var variable of JSON.parse(serializedChanges)) {
				serializedString += 'IO:' + variable.id + '=' + variable.value + '&';
			}
			serializedString += 'sysparm_id=' + referringRecordId;
			if (templateRestricted) {
				serializedString += '&sysparm_restricted_values=' + templateValue;
			}
		}
		window.postMessage(
			{ action: SERIALIZED_STRING_DISPATCHED, serializedString },
			window.location.origin
		);
	}
};

function updateMultipleSelectValue(
	updateState,
	{ data: { action, selectedItems = [] } }
) {
	if (action == SLUSHBUCKET_UPDATED) {
		updateState({
			path: 'valuesList',
			value: selectedItems.reduce((acc, { value, displayValue }) => {
				acc.push({
					value,
					displayValue
				});
				return acc;
			}, []),
			operation: 'set',
			shouldRender: false
		});
	}
}
