import {
	SC_FORM_VALUECHANGE,
	SC_FORM_REGEX_VALIDATION,
	SC_FORM_REGEX_VALIDATION_SUCCESS,
	SC_FORM_REGEX_VALIDATION_ERROR,
	FETCH_REQUESTED_FOR_ACCESS,
	DELEGATION_DATA_FETCH_SUCCESS,
	DELEGATION_DATA_FETCH_FAILURE,
	REQUESTED_FOR_ERROR_MSG,
	DELEGATION_API_URL,
	DELEGATION_DATA_FETCH_FAILURE_MSG,
	NOW_RADIO_BUTTONS_VALUE_SET,
	CHOICE_FETCH_DATA,
	CHOICE_FETCH_DATA_SUCCESS,
	CHOICE_FETCH_DATA_FAILURE,
	GRAPHQL_DATA_PATH,
	SC_FORM_REGEX_VALIDATION_FETCH_FAILED_MSG
} from '../common/constants';
import { actionTypes } from '@servicenow/ui-core';
import { getDispatchForGFormHandling } from '../common/util';
import { createHttpEffect } from '@servicenow/ui-effect-http';
import {
	GFORM_SET_VALUE,
	GFORM_SHOW_FIELD_MESSAGE,
	GFORM_HIDE_FIELD_MESSAGE,
	GFORM_INTERNAL_SET_FIELD_INVALID,
	GFORM_ADD_ERROR_MESSAGE,
	GFORM_INTERNAL_BATCH_ACTIONS
} from '../common/gFormActions';
import { createGraphQLEffect } from '@servicenow/ui-effect-graphql';
import { get } from 'lodash';

const query = `
query ($table: String!, $field: String!, $sys_id: String, $serialized_changes: String, $encoded_record: String) {
  GlideLayout_Query {
    choiceDataRetriever(tableName: $table, fieldName: $field, sysId: $sys_id, serializedChanges: $serialized_changes, encodedRecord: $encoded_record) {
      choice {
        value
        label
      }
    }
  }
}
`;

const variableRegexQuery = `
query ($questionId: String!, $value: String!) {
	snSc {
	  serviceCatalog {
		validateVariableRegex(questionId: $questionId, value: $value) {
		  result
		  errMsg
		}
	  }
	}
  }
`;

const supportsRegexValidation = field => !!field.regExp && !!field.value;

const isFieldValueChanged = (previousField, field) =>
	previousField.value != field.value;

const { COMPONENT_PROPERTY_CHANGED, COMPONENT_BOOTSTRAPPED } = actionTypes;

export default {
	actions: {
		[SC_FORM_VALUECHANGE]: {
			private: true
		},
		[SC_FORM_REGEX_VALIDATION]: {
			private: true
		},
		[SC_FORM_REGEX_VALIDATION_SUCCESS]: {
			private: true
		},
		[SC_FORM_REGEX_VALIDATION_ERROR]: {
			private: true
		},
		[FETCH_REQUESTED_FOR_ACCESS]: {
			private: true
		},
		[DELEGATION_DATA_FETCH_SUCCESS]: {
			private: true
		},
		[DELEGATION_DATA_FETCH_FAILURE]: {
			private: true
		}
	},
	actionHandlers: {
		[NOW_RADIO_BUTTONS_VALUE_SET]: ({ action: { payload }, dispatch }) => {
			dispatch(SC_FORM_VALUECHANGE, {
				...payload
			});
		},

		[CHOICE_FETCH_DATA]: createGraphQLEffect(query, {
			variableList: [
				'table',
				'field',
				'sys_id',
				'serialized_changes',
				'encoded_record'
			],
			successActionType: CHOICE_FETCH_DATA_SUCCESS,
			errorActionType: CHOICE_FETCH_DATA_FAILURE
		}),

		[CHOICE_FETCH_DATA_SUCCESS]: ({ properties, updateProperties, action }) => {
			const { payload } = action;
			const { field } = properties;
			if (payload.errors.length < 1) {
				const results = get(payload, GRAPHQL_DATA_PATH);
				const choices = results.map(result => {
					return {
						value: result.value,
						displayValue: result.label
					};
				});
				updateProperties({
					field: {
						...field,
						choices: choices,
						fetchedField: field.dependentField
					}
				});
			} else {
				updateProperties({
					field: {
						...field,
						choices: [],
						fetchedField: field.dependentField
					}
				});
			}
		},

		[CHOICE_FETCH_DATA_FAILURE]: ({ properties, updateProperties }) => {
			const { field } = properties;
			updateProperties({
				field: {
					...field,
					choices: [],
					fetchedField: field.dependentField
				}
			});
		},

		[FETCH_REQUESTED_FOR_ACCESS]: createHttpEffect(DELEGATION_API_URL, {
			method: 'GET',
			pathParams: ['user_sys_id', 'item_sys_id'],
			successActionType: DELEGATION_DATA_FETCH_SUCCESS,
			errorActionType: DELEGATION_DATA_FETCH_FAILURE
		}),

		[DELEGATION_DATA_FETCH_SUCCESS]: ({
			dispatch,
			action,
			state,
			properties
		}) => {
			const {
				result: { result }
			} = action.payload;

			let {
				field: { name },
				formProps
			} = properties;

			let { stagedValue, stagedDisplayValue } = state;
			const _dispatch = getDispatchForGFormHandling(formProps, dispatch);

			if (!result) {
				_dispatch(GFORM_INTERNAL_BATCH_ACTIONS, {
					actions: [
						{
							name: GFORM_SET_VALUE,
							payload: {
								fieldName: name,
								value: null,
								displayValue: null
							}
						},
						{
							name: GFORM_HIDE_FIELD_MESSAGE,
							payload: {
								fieldName: name,
								clearAll: true
							}
						},
						{
							name: GFORM_SHOW_FIELD_MESSAGE,
							payload: {
								fieldName: name,
								message: REQUESTED_FOR_ERROR_MSG,
								type: 'error'
							}
						},
						{
							name: GFORM_INTERNAL_SET_FIELD_INVALID,
							payload: {
								fieldName: name,
								isInvalid: true
							}
						}
					]
				});
			} else {
				_dispatch(GFORM_SET_VALUE, {
					fieldName: name,
					value: stagedValue,
					displayValue: stagedDisplayValue
				});
			}
		},

		[DELEGATION_DATA_FETCH_FAILURE]: ({ dispatch, properties }) => {
			let {
				field: { name },
				formProps
			} = properties;

			const _dispatch = getDispatchForGFormHandling(formProps, dispatch);

			_dispatch(GFORM_INTERNAL_BATCH_ACTIONS, {
				actions: [
					{
						name: GFORM_HIDE_FIELD_MESSAGE,
						payload: {
							fieldName: name,
							clearAll: true
						}
					},
					{
						name: GFORM_SHOW_FIELD_MESSAGE,
						payload: {
							name: name,
							message: DELEGATION_DATA_FETCH_FAILURE_MSG,
							type: 'error'
						}
					},
					{
						name: GFORM_INTERNAL_SET_FIELD_INVALID,
						payload: {
							fieldName: name,
							isInvalid: true
						}
					}
				]
			});
		},

		[SC_FORM_VALUECHANGE]: ({ action, properties, dispatch, updateState }) => {
			let { error, value, displayValue, actionsPayload = [] } = action.payload;
			let {
				field: { name, type },
				formData: { tableName, sysId },
				formProps
			} = properties;

			const _dispatch = getDispatchForGFormHandling(formProps, dispatch);
			const shouldDispatchSetValue = !(
				type == 'requested_for' && tableName == 'sc_cat_item'
			);

			if (!shouldDispatchSetValue) {
				updateState({
					stagedValue: value,
					stagedDisplayValue: displayValue
				});
			}

			_dispatch(GFORM_INTERNAL_BATCH_ACTIONS, {
				actions: [
					{
						name: GFORM_HIDE_FIELD_MESSAGE,
						payload: {
							fieldName: name,
							clearAll: true
						}
					},
					...(shouldDispatchSetValue
						? [
								{
									name: GFORM_SET_VALUE,
									payload: {
										fieldName: name,
										value,
										displayValue
									}
								}
						  ]
						: []),
					...(error
						? [
								{
									name: GFORM_SHOW_FIELD_MESSAGE,
									payload: {
										fieldName: name,
										message: error.message,
										type: error.type
									}
								},
								...(error.type === 'error'
									? [
											{
												name: GFORM_INTERNAL_SET_FIELD_INVALID,
												payload: {
													fieldName: name,
													isInvalid: true
												}
											}
									  ]
									: [])
						  ]
						: []),
					...actionsPayload
				]
			});

			if (type == 'requested_for' && tableName == 'sc_cat_item') {
				dispatch(FETCH_REQUESTED_FOR_ACCESS, {
					user_sys_id: value,
					item_sys_id: sysId
				});
			}
		},

		[COMPONENT_BOOTSTRAPPED]: ({ properties, dispatch }) => {
			let { field } = properties;
			if (supportsRegexValidation(field)) {
				dispatch(SC_FORM_REGEX_VALIDATION, {
					questionId: field.id,
					value: field.value
				});
			}
		},
		[COMPONENT_PROPERTY_CHANGED]: ({ action, dispatch }) => {
			let { name, previousValue: previousField, value: field } = action.payload;
			if (
				name === 'field' &&
				isFieldValueChanged(previousField, field) &&
				supportsRegexValidation(field)
			) {
				dispatch(SC_FORM_REGEX_VALIDATION, {
					questionId: field.id,
					value: field.value
				});
			}
		},

		[SC_FORM_REGEX_VALIDATION]: createGraphQLEffect(variableRegexQuery, {
			variableList: ['questionId', 'value'],
			successActionType: SC_FORM_REGEX_VALIDATION_SUCCESS,
			errorActionType: SC_FORM_REGEX_VALIDATION_ERROR
		}),

		[SC_FORM_REGEX_VALIDATION_SUCCESS]: ({ action, properties, dispatch }) => {
			const path = 'data.snSc.serviceCatalog.validateVariableRegex';
			const { payload } = action;
			const { field, formProps } = properties;
			const data = get(payload, path);
			const _dispatch = getDispatchForGFormHandling(formProps, dispatch);

			if (!data || (payload.errors && payload.errors.length > 0)) {
				_dispatch(GFORM_ADD_ERROR_MESSAGE, {
					message: SC_FORM_REGEX_VALIDATION_FETCH_FAILED_MSG
				});
				return;
			}

			if (data && !data.result) {
				_dispatch(GFORM_INTERNAL_BATCH_ACTIONS, {
					actions: [
						{
							name: GFORM_HIDE_FIELD_MESSAGE,
							payload: {
								fieldName: field.name,
								clearAll: true
							}
						},
						{
							name: GFORM_SHOW_FIELD_MESSAGE,
							payload: {
								fieldName: field.name,
								message: data.errMsg,
								type: 'error'
							}
						},
						{
							name: GFORM_INTERNAL_SET_FIELD_INVALID,
							payload: {
								fieldName: field.name,
								isInvalid: true
							}
						}
					]
				});
			}
		}
	}
};
