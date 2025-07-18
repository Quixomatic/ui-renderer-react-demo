import { controlElementFactory as glideControlElementFactory } from '@devsnc/sn-glide-form-controls';
import { createOnValueChangeHandler } from '../common/changeValueHandlers';
import {
	MASKED_TYPE,
	RE_ENTER_VALUE_CHANGED,
	MASKED_VALUE_CHANGED
} from './constants';
import { t } from 'sn-translate';
import { omit } from 'lodash';
import { isAttrTrue } from '../utils';

const renderConfirmationField = (field, formData, instanceId, dispatch) => {
	let isInvalid = field.isInvalid || field.value !== field.confirmationValue;

	const messages = field.messages;
	const confirmationProps = {
		label: t('Re-enter `{0}`', field.label),
		name: 'confirmation_masked_' + field.id,
		value: field.confirmationValue,
		messages,
		isInvalid
	};
	const confirmationField = omit({ ...field, ...confirmationProps }, [
		'mandatory',
		'_value'
	]);

	const {
		// eslint-disable-next-line no-unused-vars
		Control,
		props,
		children
	} = glideControlElementFactory.getFormControl(
		instanceId,
		MASKED_TYPE,
		confirmationField,
		createOnValueChangeHandler(RE_ENTER_VALUE_CHANGED, dispatch),
		null,
		formData
	);
	return (
		<div className="sc-confirmation-field">
			<Control {...props} disableUnmask={true}>
				{children}
			</Control>
		</div>
	);
};

const renderMaskedField = (field, type, formData, instanceId, dispatch) => {
	const sanitizedField = omit(field, '_value', 'messages');

	if (!sanitizedField.isInvalid && field.useConfirmation) {
		sanitizedField.isInvalid = field.value !== field.confirmationValue;
	}
	const {
		// eslint-disable-next-line no-unused-vars
		Control,
		props,
		children
	} = glideControlElementFactory.getFormControl(
		instanceId,
		type,
		sanitizedField,
		createOnValueChangeHandler(MASKED_VALUE_CHANGED, dispatch),
		null,
		formData
	);
	return (
		<div className="sc-masked-field">
			<Control
				{...props}
				disableUnmask={!isAttrTrue(field.canDecrypt) || !field.value}
			>
				{children}
			</Control>
		</div>
	);
};

export default ({ properties, type }, { dispatch, updateState }) => {
	let { field, formData, instanceId } = properties;
	return isAttrTrue(field.visible) ? (
		<div className="form-control">
			{renderMaskedField(
				field,
				type,
				formData,
				instanceId,
				dispatch
			)}
			{field.useConfirmation && !isAttrTrue(field.readonly)
				? renderConfirmationField(field, formData, instanceId, dispatch)
				: null}
		</div>
	) : null;
};
