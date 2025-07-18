import { t } from 'sn-translate';
import { VariableType } from './common';
import {
	getHelperTextForFormControls,
	getHelperContentForNDS
} from './getHelperContent';
export function isAttrTrue(val) {
	return val === true || val === 'true';
}
const SC_CAT_ITEM = 'sc_cat_item';

export function getEncodedRecord(formData = {}) {
	return formData.isNewRecord ? formData.encodedRecord : "";
}

export const wrapHelperContent = helperContent => {
	if (!helperContent) return helperContent;

	return (
		<div style={{ maxWidth: "300px", maxHeight: "200px" }}>{helperContent}</div>
	);
};

export const renderFormFieldHelper = (helperContent, invalid) => {
	if (helperContent) {
		return (
			<span
				style={{
					padding: '0 5px'
				}}
			>
				<now-popover className="now-form-field-popover" interaction-type="none">
					<now-button-iconic
						slot="trigger"
						config-aria={{
							button: { 'aria-label': t('More information') }
						}}
						class={{ 'now-form-field-button': true, 'is-invalid': invalid }}
						icon="circle-info-outline"
						size="sm"
						variant="tertiary"
						bare
						hide-padding
					/>
					<now-form-popover-content
						slot="content"
						content={wrapHelperContent(helperContent)}
						role="status"
					/>
				</now-popover>
			</span>
		);
	}
};

export const getFieldAnnotation = field => {
	let showHelp = field.showHelp;
	let helperContent = field.instructions || field.helpText;
	if (!showHelp || !helperContent) {
		return;
	}

	return handleForHelperContent(field)
		? getHelperContentForNDS(helperContent)
		: getHelperTextForFormControls(helperContent);
};

const handleForHelperContent = ({ type, containerType, referringTable }) => {
  switch (type) {
    case VariableType.CHOICE:
    case VariableType.LABEL:
    case VariableType.REQUESTED_FOR:
    case VariableType.DATE:
    case VariableType.DATE_TIME:
    case VariableType.IP_ADDRESS:
    case VariableType.GLIDE_LIST:
    case VariableType.MULTI_TWO_LINES:
    case VariableType.MULTIPLE_CHOICE:
    case VariableType.NUMERIC_SCALE:
    case VariableType.REFERENCE:
    case VariableType.TABLE_NAME:
    case VariableType.URL:
    case VariableType.DEFAULT_TEXT_AREA:
      return true;
    case VariableType.CONTAINER: {
      return containerType != VariableType.CHECKBOX_CONTAINER;
    }
    default:
      return false;
  }
};
