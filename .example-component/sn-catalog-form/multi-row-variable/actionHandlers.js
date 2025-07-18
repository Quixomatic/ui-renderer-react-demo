import _ from 'lodash';
import {
	ADD_BUTTON_CLICKED,
	LIST_OPEN_PANEL,
	REMOVE_BUTTON_CLICKED,
	GRID_CHECKBOX_TOGGLED,
	MULTI_ROW_FORM_MODAL_CLOSED,
	UPDATE_MULTI_ROW_DATA,
	UPDATE_MULTI_ROW_DATA_DISPLAY_VALUES_FETCHED,
	ROW_DATA_UPDATED,
	DISPLAY_VALUE_REQUESTED,
	DISPLAY_VALUE_REQUESTED_ROW,
	DISPLAY_VALUE_FETCHED,
	REMOVE_MODAL_CLICKED,
	REMOVE_MODAL_CLOSED,
	DISMISS_REMOVE_MODAL
} from './constants';
import { GFORM_SET_VALUE, GFORM_INTERNAL_SET_ADDITIONAL_FIELD_STATE } from '../common/gFormActions';
import { buildValueFromRowData } from './utils';
import { actionTypes } from '@servicenow/ui-core';
import { createMultiRowValueChangeEffect } from './effects';
import { VARIABLE_INTERNAL_TYPES } from '../library-catalog-form/constants';

const doSelectAllAction = (action, updateState) => {
	const selectedRecords = action.payload.checked ? action.payload.value : [];
	updateState({
		path: 'rowSelection',
		operation: 'set',
		value: {
			selectedRecords: [...selectedRecords],
			allSelectedOnPage: action.payload.checked
		}
	});
};

const doIndividualToggleAction = (
	action,
	{ rowSelection: { selectedRecords = [], allSelectedOnPage } },
	updateState
) => {
	if (action.payload.checked) {
		if (selectedRecords.indexOf(action.payload.value) === -1) {
			selectedRecords.push(action.payload.value);
			if (selectedRecords.length === action.payload.allSysIdsOnPage.length) {
				allSelectedOnPage = true;
			}
		}
	} else {
		selectedRecords = [
			..._.remove(selectedRecords, n => n !== action.payload.value)
		];
		if (allSelectedOnPage) {
			allSelectedOnPage = !allSelectedOnPage;
		}
	}
	updateState({
		path: 'rowSelection',
		operation: 'set',
		value: {
			selectedRecords: [...selectedRecords],
			allSelectedOnPage: !!allSelectedOnPage
		}
	});
};

const doCheckBoxToggledAction = ({ action, state, updateState }) => {
	if (typeof action.payload.value === 'object') {
		doSelectAllAction(action, updateState);
	} else {
		doIndividualToggleAction(action, state, updateState);
	}
};

const removeButtonClickHandler = ({
	state,
	updateState,
	dispatch,
	properties
}) => {
	/* eslint-disable-line */
	const { rowData } = properties;
	const {
		rowSelection: { selectedRecords }
	} = state;

	if (!selectedRecords || selectedRecords.length === 0) {
		return;
	}

	const newRowData = _.filter(
		rowData,
		(row, index) => selectedRecords.indexOf(index) === -1
	);

	updateState({
		path: 'rowSelection',
		operation: 'set',
		value: {
			selectedRecords: [],
			allSelectedOnPage: false
		}
	});

	dispatch(REMOVE_MODAL_CLOSED);
	dispatch(ROW_DATA_UPDATED, {
		rowData: newRowData
	});
};

const updateFieldDataFetchedDisplayValues = ({
	dispatch,
	action,
	properties
}) => {
	const { rowId, data, displayValue } = action.payload;
	const { rowData } = properties;
	var useValFromDisplayValueObj = false;

	try {
		if (displayValue) {
			if (Array.isArray(JSON.parse(displayValue))) {
				var displayValueArrObj = JSON.parse(displayValue);
				if (!(displayValueArrObj.length === 1)) {
					throw new Error('Error when fetching row display data'); //Should fetch only a single row display values data
				}
				useValFromDisplayValueObj = true;
			}
		}
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error(error);
	}

	const row = {
		row: data.map(cell => {
			return {
				id: cell.id,
				name: cell.variable_name,
				value: cell.value,
				displayValue: useValFromDisplayValueObj
					? displayValueArrObj[0][cell.variable_name] || cell.displayValue
					: cell.displayValue
			};
		})
	};

	// index starts from 1
	if (rowId > 0) {
		rowData[rowId - 1] = row;
	} else {
		rowData.push(row);
	}
	dispatch(ROW_DATA_UPDATED, {
		rowData
	});
};
const updateFieldData = ({ dispatch, action, properties, state }) => {
	const { data, formDirty = false } = action.payload;
	const { hasLookupChoices } = state;
	const displayValue = '';

	if (hasLookupChoices && formDirty) {
		var rowModalData = [];
		rowModalData.push(
			_.reduce(
				data,
				(acc, cell) => ({
					...acc,
					[cell.variable_name]: cell.value
				}),
				{}
			)
		);
		dispatch(DISPLAY_VALUE_REQUESTED_ROW, {
			...action.payload,
			sys_id: properties.field.id,
			sysparm_value: JSON.stringify(rowModalData)
		});
	} else {
		dispatch(UPDATE_MULTI_ROW_DATA_DISPLAY_VALUES_FETCHED, {
			...action.payload,
			displayValue
		});
	}
};

function isValueEqual(previousValue = [], value = []) {
	try {
		if (previousValue && typeof previousValue === 'string') {
			previousValue = JSON.parse(previousValue);
		}
		if (value && typeof value === 'string') {
			value = JSON.parse(value);
		}
		return _.isEqual(value, previousValue);
	} catch (error) {
		/* istanbul ignore next */
		console.error(error); //eslint-disable-line
		/* istanbul ignore next */
		return true; // this will prevent new requests
	}
}
const watchedFieldTypes = [
	VARIABLE_INTERNAL_TYPES.LIST_COLLECTOR,
	VARIABLE_INTERNAL_TYPES.LOOKUP_MULTIPLE_CHOICE,
	VARIABLE_INTERNAL_TYPES.LOOKUP_SELECT_BOX,
	VARIABLE_INTERNAL_TYPES.MULTIPLE_CHOICE,
	VARIABLE_INTERNAL_TYPES.NUMERIC_SCALE,
	VARIABLE_INTERNAL_TYPES.REFERENCE,
	VARIABLE_INTERNAL_TYPES.SELECT_BOX,
	VARIABLE_INTERNAL_TYPES.YES_NO
];

const referenceTypes = [
	VARIABLE_INTERNAL_TYPES.LIST_COLLECTOR,
	VARIABLE_INTERNAL_TYPES.LOOKUP_MULTIPLE_CHOICE,
	VARIABLE_INTERNAL_TYPES.LOOKUP_SELECT_BOX,
	VARIABLE_INTERNAL_TYPES.MULTIPLE_CHOICE,
	VARIABLE_INTERNAL_TYPES.REFERENCE,
	VARIABLE_INTERNAL_TYPES.SELECT_BOX
];

const lookupTypes = [
	VARIABLE_INTERNAL_TYPES.LOOKUP_MULTIPLE_CHOICE,
	VARIABLE_INTERNAL_TYPES.LOOKUP_SELECT_BOX
];

export default {
	[actionTypes.COMPONENT_BOOTSTRAPPED]: function({
		properties,
		updateState,
		dispatch
	}) {
		const { field = {} } = properties;
		const { fields = [] } = field;
		const watchValueChange = fields.some(f => {
			return _.isUndefined(f.type) || watchedFieldTypes.includes(f.type);
		});
		const hasReferenceType = fields.some(f => referenceTypes.includes(f.type));
		const hasLookupChoices = fields.some(f => lookupTypes.includes(f.type));
		const value = field['value'];
		const displayValue = field['displayValue'];
		if (value && hasReferenceType && isValueEqual(value, displayValue)) {
			dispatch(DISPLAY_VALUE_REQUESTED, {
				sys_id: properties.field.id,
				sysparm_value: properties.field.value
			});
		}
		updateState([
			{
				path: 'watchValueChange',
				value: watchValueChange,
				operation: 'set'
			},
			{
				path: 'hasLookupChoices',
				value: hasLookupChoices,
				operation: 'set'
			}
		]);
	},

	[ADD_BUTTON_CLICKED]: ({ updateState }) =>
		updateState({
			popoverActive: true,
			mode: 'add',
			rowSysId: -1
		}),

	[LIST_OPEN_PANEL]: ({ updateState, action }) =>
		updateState({
			popoverActive: true,
			mode: 'edit',
			rowSysId: action.payload.quickEditSysId + 1
		}),

	[REMOVE_BUTTON_CLICKED]: {
		effect: removeButtonClickHandler
	},

	[REMOVE_MODAL_CLICKED]: ({ updateState }) =>
		updateState({
			operation: 'set',
			path: 'removePopOver',
			value: true
		}),

	[REMOVE_MODAL_CLOSED]: ({ updateState }) =>
		updateState({
			removePopOver: false
		}),

	[DISMISS_REMOVE_MODAL]: ({ updateState }) =>
		updateState({
			removePopOver: false
		}),

	[GRID_CHECKBOX_TOGGLED]: {
		effect: doCheckBoxToggledAction
	},

	[MULTI_ROW_FORM_MODAL_CLOSED]: ({ updateState }) =>
		updateState({
			popoverActive: false,
			mode: '',
			rowSysId: null
		}),

	[UPDATE_MULTI_ROW_DATA]: {
		effect: updateFieldData
	},
	[ROW_DATA_UPDATED]: {
		effect({ properties, action, dispatch }) {
			const newRowData = action.payload.rowData;
			const valueGetter = buildValueFromRowData(newRowData);
			const { field } = properties;

			dispatch(GFORM_INTERNAL_SET_ADDITIONAL_FIELD_STATE, {
				fieldName: field.name,
				propName: 'validated',
				value: true
			});
			dispatch(GFORM_INTERNAL_SET_ADDITIONAL_FIELD_STATE, {
				fieldName: field.name,
				propName: 'updateDisplayValue',
				value: true
			});
			dispatch(GFORM_SET_VALUE, {
				fieldName: field.name,
				value: valueGetter('value'),
				displayValue: valueGetter('displayValue')
			});
		}
	},
	[actionTypes.COMPONENT_PROPERTY_CHANGED]: function({
		action,
		state,
		dispatch
	}) {
		const { payload } = action;
		const { name } = payload;
		if (name !== 'field') {
			return;
		}
		const { watchValueChange } = state;
		const { previousValue, value } = payload;
		const field = payload.value;
		const variableSetId = field.id;
		const newValue = field['value'];
		const newDisplayValue = field['displayValue'];
		// value changed
		if (
			!isValueEqual(previousValue.value, value.value) ||
			//Fetch displayValue when value and displayValue are same (Happens when client script does setValue on MRVS) 
			//But don't fetch displayValue when even after fetching displayValue happens to be same as value (Refer DEF0238248)
			(watchValueChange && newValue && isValueEqual(newValue, newDisplayValue) && !isValueEqual(previousValue.displayValue, newDisplayValue))
		) {
			if (watchValueChange) {
				if (!newDisplayValue || isValueEqual(newValue, newDisplayValue)) {
					dispatch(DISPLAY_VALUE_REQUESTED, {
						sys_id: variableSetId,
						sysparm_value: newValue
					});
				} else {
					// build row data with display value as display value
					dispatch(DISPLAY_VALUE_FETCHED, {
						displayValue: field['displayValue']
					});
				}
			} else {
				// build row data with value as display value
				dispatch(DISPLAY_VALUE_FETCHED, {
					displayValue: field['value']
				});
			}
		}
		// ignore if value didn't change
	},
	[DISPLAY_VALUE_REQUESTED]: createMultiRowValueChangeEffect(
		DISPLAY_VALUE_FETCHED
	),

	[DISPLAY_VALUE_REQUESTED_ROW]: createMultiRowValueChangeEffect(
		UPDATE_MULTI_ROW_DATA_DISPLAY_VALUES_FETCHED
	),

	[DISPLAY_VALUE_FETCHED]: ({ action, properties, updateProperties }) => {
		const { field } = properties;

		updateProperties({
			field: {
				...field,
				displayValue: action.payload.displayValue
			}
		});
	},
	[UPDATE_MULTI_ROW_DATA_DISPLAY_VALUES_FETCHED]: {
		effect: updateFieldDataFetchedDisplayValues
	}
};
