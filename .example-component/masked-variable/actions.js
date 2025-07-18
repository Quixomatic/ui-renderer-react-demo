import { t } from 'sn-translate';
import { RE_ENTER_VALUE_CHANGED, MASKED_VALUE_CHANGED } from './constants';
import { SC_FORM_VALUECHANGE } from '../common/constants';
import {
	GFORM_SHOW_FIELD_MESSAGE,
	GFORM_HIDE_FIELD_MESSAGE,
	GFORM_INTERNAL_SET_FIELD_INVALID,
	GFORM_INTERNAL_SET_ADDITIONAL_FIELD_STATE,
	GFORM_INTERNAL_BATCH_ACTIONS
} from '../common/gFormActions';

import { getDispatchForGFormHandling } from '../common/util';

export const actions = {
	[RE_ENTER_VALUE_CHANGED]: {
		private: true
	}
};

export const actionHandlers = {
	[RE_ENTER_VALUE_CHANGED]: ({
		// updateState,
		action: { payload },
		properties: { field, formProps },
		dispatch
	}) => {
		const _dispatch = getDispatchForGFormHandling(formProps, dispatch);
		_dispatch(GFORM_INTERNAL_BATCH_ACTIONS, {
			actions: [
				{
					name: GFORM_HIDE_FIELD_MESSAGE,
					payload: {
						fieldName: field.name,
						clearAll: true
					}
				},
				...((field.value || payload.value) && field.value !== payload.value
					? [
							{
								name: GFORM_SHOW_FIELD_MESSAGE,
								payload: {
									fieldName: field.name,
									message: t('Confirmation must match'),
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
					: [
							{
								name: GFORM_INTERNAL_SET_FIELD_INVALID,
								payload: {
									fieldName: field.name,
									isInvalid: false
								}
							}
					  ]),
				{
					name: GFORM_INTERNAL_SET_ADDITIONAL_FIELD_STATE,
					payload: {
						fieldName: field.name,
						propName: 'confirmationValue',
						value: payload.value
					}
				}
			]
		});
	},
	[MASKED_VALUE_CHANGED]: ({
		properties: { field },
		dispatch,
		action: { payload }
	}) => {
		if (
			field.useConfirmation &&
			(field.confirmationValue || payload.value) &&
			field.confirmationValue !== payload.value
		) {
			payload.error = {
				type: 'error',
				message: t('Confirmation must match')
			};
		}
		/**
		 * Order of below two actions need to be sequential.
		 * Inside the environment:
		 * action1: (tries to simulate what happens if you use ClientScript to set value)
		 * 	field.value = new_field_value;
		 * 	field.confirmationValue = new_field_value;
		 * action2:
		 * 	field.confirmationValue = actual_confirmation_value;
		 */

		let actionsPayload = [];
		if (field.useConfirmation) {
			actionsPayload.push({
				name: GFORM_INTERNAL_SET_ADDITIONAL_FIELD_STATE,
				payload: {
					fieldName: field.name,
					propName: 'confirmationValue',
					value: field.confirmationValue
				}
			});
		}
		dispatch(SC_FORM_VALUECHANGE, {
			...payload,
			displayValue: payload.value ? '**********' : '',
			actionsPayload: actionsPayload
		});
	}
};
