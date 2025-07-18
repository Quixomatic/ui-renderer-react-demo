import { omit, has } from 'lodash';
import { escapeSeismicSpecialSymbols } from './utils/escapeSeismicSpecialSymbols';
import * as FIELD_TYPE from './FieldType';

export function setInitialValue(controlProps) {
	const hasValue = has(controlProps, 'value');
	const hasDisplayValue = has(controlProps, 'displayValue');

	if (!hasValue && !hasDisplayValue) {
		return controlProps;
	}

	const newControlProps = omit(controlProps, ['value', 'displayValue']);
	const { displayValue, value, isEncrypted, type } = controlProps;

	if (hasValue) {
		newControlProps.initialValue = isEncrypted
			? escapeSeismicSpecialSymbols(displayValue)
			: escapeSeismicSpecialSymbols(value);
	}

	if (hasDisplayValue) {
		const initialDisplayValue =
			type === FIELD_TYPE.PASSWORD ? value : displayValue;
		newControlProps.initialDisplayValue =
			escapeSeismicSpecialSymbols(initialDisplayValue);
	}

	return newControlProps;
}
