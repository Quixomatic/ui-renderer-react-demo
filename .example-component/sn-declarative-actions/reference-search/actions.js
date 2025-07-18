import {VALUE_CHANGED} from '../mediator/actions';
import {actionTypes} from '@servicenow/ui-core';
import {createGraphQLEffect} from '@servicenow/ui-effect-graphql';
import createComponentLoaderEffect from '@devsnc/uxf-effect-component-loader';
import find from 'lodash/find';
import get from 'lodash/get';

const {COMPONENT_BOOTSTRAPPED} = actionTypes;

const itemSelectedAction = 'NOW_RECORD_LIST_CONNECTED#ROW_CLICKED';
const treePickerItemSelectedAction = 'SN_RECORD_CONTENT_TREE_CONNECTED#ITEM_CLICKED';
const treePickerModalCloseAction = 'SN_RECORD_CONTENT_TREE_CONNECTED#MODAL_CLOSE_CLICKED_ACTION';
const treePickerModalAddAction = 'SN_RECORD_CONTENT_TREE_CONNECTED#MODAL_ADD_CLICKED_ACTION';
const FETCH_TREE_PICKER = 'FETCH_TREE_PICKER';
const FETCH_TREE_PICKER_SUCCESS = 'FETCH_TREE_PICKER_SUCCESS';
const FETCH_TREE_PICKER_FAILURE = 'FETCH_TREE_PICKER_FAILURE';
const TREE_PICKER_CONFIG_DATA_PATH = 'data.GlideLayout_Query.treePickerConfigQuery.treePicker';
const DOMAIN_SEPARATION_DATA_PATH = 'data.GlideLayout_Query.formLayout.domainSeparation';

const COMPONENT_LOAD_REQUESTED = 'SN_DECLARATIVE_REFERENCE_SEARCH#COMPONENT_LOAD_REQUESTED';
const COMPONENT_LOAD_SUCCEEDED = 'SN_DECLARATIVE_REFERENCE_SEARCH#COMPONENT_LOAD_SUCCEEDED';
const COMPONENT_LOAD_FAILED = 'SN_DECLARATIVE_REFERENCE_SEARCH#COMPONENT_LOAD_FAILED';

export const itemSelectedTransform = ({action, dispatch, state}) => {
	const {referenceKey} = state.properties;
	const value = referenceKey
		? get(action, 'payload.row.referenceKeyValue.value')
		: get(action, 'payload.row.sys_id.value');
	const newPayload = {
		name: get(state, 'properties.name', ''),
		value,
		displayValue: get(action, 'payload.row.displayValue.value', ''),
		additionalInfo: {referenceSysId: get(action, 'payload.row.sys_id.value')}
	};
	dispatch(VALUE_CHANGED, newPayload);
};

export const treePickerItemSelectedTransform = ({action, dispatch, state, updateState}) => {
	const newPayload = {
		name: get(state, 'properties.name', ''),
		value: get(action, 'payload.value', ''),
		displayValue: get(action, 'payload.displayValue', '')
	};
	if (state.properties.fieldType !== 'glide_list') {
		dispatch(VALUE_CHANGED, newPayload);
		dispatch(treePickerModalCloseAction);
	} else {
		const operation = {
			operation: 'push'
		};
		const isSelected = get(action, 'payload.isSelected', true);
		if (!isSelected) {
			const index = state.selectedItems.value.indexOf(newPayload.value);
			if (index === -1) {
				return;
			}
			Object.assign(operation, {operation: 'splice', start: index, deleteCount: 1});
		}
		updateState([
			{
				path: 'selectedItems.value',
				value: get(action, 'payload.value', ''),
				...operation
			},
			{
				path: 'selectedItems.display_value_list',
				value: get(action, 'payload.displayValue', ''),
				...operation
			}
		]);
	}
};

export const addSelectedItemsEffect = ({dispatch, state}) => {
	const {selectedItems} = state;
	if (selectedItems.value.length === 0) {
		dispatch(treePickerModalCloseAction);
		return;
	}
	const newPayload = {
		name: get(state, 'properties.name', ''),
		value: selectedItems.value.join(','),
		displayValue: selectedItems.display_value_list
	};

	dispatch(VALUE_CHANGED, newPayload);
	dispatch(treePickerModalCloseAction);
};

const closeModalEffect = ({updateState}) => {
	updateState({
		active: false,
		selectedItems: {value: [], display_value_list: []}
	});
};

const treePickerQuery = `
query ($table: String!, $field: String!, $sys_id: String, $serialized_changes: String, $encoded_record: String) {
  	GlideLayout_Query {
		treePickerConfigQuery(tableName: $table, fieldName: $field, sysId: $sys_id, serializedChanges: $serialized_changes, encodedRecord: $encoded_record) {
			treePicker {
				isSupported
				processor
				table
				targetField
				targetValue
				targetPath
				queryString
			}
		}
		formLayout(table: $table, sysId: $sys_id) {                          
			domainSeparation {
				domainId             
			}
		}
  	}
}
`;

export const handleComponentBootstrapped = ({
	properties: {fieldName, tableName, recordSysId, serializedChanges, encodedRecord, dictionary},
	dispatch,
	updateState
}) => {
	const attributes = get(dictionary, 'attributes', []);
	const attributeValue = find(attributes, a => a.name === 'tree_picker');
	const isTreePicker = attributeValue === undefined ? false : attributeValue.value === 'true';

	// if tree_picker attribute is configured to true, determine tree picker is supported or not.
	if (isTreePicker) {
		const payload = {
			field: fieldName,
			table: tableName,
			sys_id: recordSysId,
			serialized_changes: serializedChanges,
			encoded_record: encodedRecord
		};
		dispatch(FETCH_TREE_PICKER, payload, {stopPropagation: true});
		dispatch(COMPONENT_LOAD_REQUESTED, {tagName: 'sn-record-content-tree-connected'});
	} else {
		updateState({
			fetchingTreePicker: false,
			isTreePicker: false
		});
		dispatch(COMPONENT_LOAD_REQUESTED, {tagName: 'now-record-list-connected-reference'});
	}
};

export default {
	[itemSelectedAction]: {
		handlers: [itemSelectedTransform, closeModalEffect],
		stopPropagation: true
	},
	[treePickerItemSelectedAction]: {
		effect: treePickerItemSelectedTransform,
		stopPropagation: true
	},
	[treePickerModalCloseAction]: {
		effect: closeModalEffect,
		stopPropagation: true
	},
	[treePickerModalAddAction]: {
		effect: addSelectedItemsEffect,
		stopPropagation: true
	},
	'NOW_MODAL#OPENED_SET': closeModalEffect,
	[COMPONENT_BOOTSTRAPPED]: handleComponentBootstrapped,
	[FETCH_TREE_PICKER]: createGraphQLEffect(treePickerQuery, {
		variableList: ['table', 'field', 'sys_id', 'serialized_changes', 'encoded_record'],
		successActionType: FETCH_TREE_PICKER_SUCCESS,
		errorActionType: FETCH_TREE_PICKER_FAILURE
	}),
	[FETCH_TREE_PICKER_SUCCESS]: ({updateState, action}) => {
		const {payload} = action;
		if (payload.errors.length < 1) {
			const config = get(payload, TREE_PICKER_CONFIG_DATA_PATH);
			const domainSeparation = get(payload, DOMAIN_SEPARATION_DATA_PATH);
			updateState({
				fetchingTreePicker: false,
				treePickerConfig: config,
				domainId: domainSeparation ? domainSeparation.domainId : null
			});
		} else {
			updateState({
				fetchingTreePicker: false,
				treePickerConfig: {}
			});
		}
	},
	[FETCH_TREE_PICKER_FAILURE]: ({updateState}) => {
		updateState({
			fetchingTreePicker: false,
			treePickerConfig: {}
		});
	},
	[COMPONENT_LOAD_REQUESTED]: createComponentLoaderEffect({
		successActionType: COMPONENT_LOAD_SUCCEEDED,
		errorActionType: COMPONENT_LOAD_FAILED
	}),
	[COMPONENT_LOAD_SUCCEEDED]: {
		effect: ({updateState}) => {
			updateState({
				componentLoading: false
			});
		},
		stopPropagation: true
	},
	[COMPONENT_LOAD_FAILED]: {
		effect: ({updateState}) => {
			console.error('Failed to load component');
			updateState({
				componentLoading: false
			});
		},
		stopPropagation: true
	}
};
