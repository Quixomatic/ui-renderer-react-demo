import { VariableType } from '../common';
import { READONLY_OPTION } from '../common/constants';

export const shouldRenderPrintableReadOnlyMode = (
	formProps = {},
	field = {}
) => {
	const { type = VariableType.STRING, readonly = false } = field;
	const { readOnlyOption = READONLY_OPTION.DEFAULT } = formProps;
	if (readOnlyOption !== READONLY_OPTION.PRINTABLE || !readonly) {
		return false;
	}
	let isReadOnlyMode = false;
	switch (type) {
		case VariableType.CHOICE:
		case VariableType.MULTIPLE_CHOICE:
		case VariableType.DATE:
		case VariableType.DATE_TIME:
		case VariableType.STRING:
		case VariableType.GLIDE_LIST:
		case VariableType.EMAIL:
		case VariableType.URL:
		case VariableType.IP_ADDRESS:
		case VariableType.GLIDE_DURATION:
		case VariableType.NUMERIC_SCALE:
		case VariableType.REFERENCE:
		case VariableType.REQUESTED_FOR:
		case VariableType.MASKED:
		case VariableType.TEXT_AREA:
		case VariableType.HTML:
		case VariableType.TABLE_NAME:
			isReadOnlyMode = true;
			break;
		default:
			isReadOnlyMode = false;
			break;
	}
	return isReadOnlyMode;
};
