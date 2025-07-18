import {
	getEncodedRecord,
	wrapHelperContent
} from './utils';
import { FieldType } from '@devsnc/sn-glide-form-controls';
import { isAttrTrue, getFieldAnnotation } from '../utils';
import { VariableType } from '../common';
import _ from 'lodash';
import { CHOICE_FETCH_DATA } from '../common/constants';
import { getProperty } from 'sn-uxpage-presource';
const MAX_LENGTH = 'max_length';
const ACROSS = 'across';
const HORIZONTAL = 'horizontal';
const VERTICAL = 'vertical';
const SC_CAT_ITEM = 'sc_cat_item';

export default (field, formData, dispatch) => {
	let transformedField = field;
	let varAttrs;
	transformedField.readonly = _.toString(_.get(field, 'readonly', false));
	if (isAttrTrue(field.sys_readonly) && _.isEmpty(field.defaultValue)) {
		transformedField.mandatory = false;
	} else {
		transformedField.mandatory = _.toString(_.get(field, 'mandatory', false));
	}
	transformedField.visible = _.toString(_.get(field, 'visible', true));
	transformedField.showFieldHint = true;
	transformedField.dictionary = {
		...transformedField.dictionary,
		fieldHint: getFieldAnnotation(field)
	};
	switch (field.type) {
		case VariableType.STRING:
			varAttrs = transformedField.variableAttributes;
			if (varAttrs && varAttrs.length != 0) {
				let attrsArray = varAttrs.split(',');
				let maxLengthAttr = attrsArray.find(attr =>
					attr.startsWith(MAX_LENGTH)
				);
				if (maxLengthAttr) {
					transformedField.maxLength = maxLengthAttr.split('=')[1];
				}
			}
			break;
		case VariableType.NUMERIC_SCALE:
		case VariableType.MULTIPLE_CHOICE:
			if (transformedField.referringTable == SC_CAT_ITEM) {
				transformedField.choiceDirection =
					transformedField.choiceDirection == ACROSS ||
					transformedField.type == VariableType.NUMERIC_SCALE
						? HORIZONTAL
						: VERTICAL;
				let choices = [];
				if (
					transformedField.fetchedField != transformedField.dependentField &&
					(transformedField.dependentField &&
						(transformedField.dependentFieldValue ||
							transformedField.dependentValue))
				) {
					choices = fetchDependentChoices(transformedField, formData, dispatch);
				} else {
					choices = transformedField.choices;
				}

				const options = choices.map(choice => {
					return {
						id: choice.value,
						label: choice.displayValue,
						checked: choice.value == transformedField.value
					};
				});
				transformedField.options = options;
				transformedField.dictionary = {
					...transformedField.dictionary,
					fieldHint: wrapHelperContent(getFieldAnnotation(field))
				};
			} else {
				transformedField.type = FieldType.CHOICE;
			}
			break;
		case VariableType.CHECKBOX:
			transformedField.value = _.toString(isAttrTrue(transformedField.value));
			transformedField.showHelp = false;
			transformedField.dictionary = {
				...transformedField.dictionary,
				fieldHint: ""
			};
			break;
		case VariableType.ATTACHMENT:
			transformedField.type = FieldType.FILE_ATTACHMENT;
			transformedField.extensions = (transformedField.allowedFileExtensions || '');
			break;
		case VariableType.REQUESTED_FOR:
			transformedField.type = FieldType.REFERENCE;
			break;
		case VariableType.GLIDE_LIST:
			varAttrs = transformedField.variableAttributes;
			if (varAttrs && varAttrs.length != 0) {
				let attrsArray = varAttrs.split(',');
				let multiSelect = attrsArray.find(attr =>
					attr.startsWith(VariableType.MULTI_SELECT)
				);
				let hasScript = attrsArray.find(attr => attr.startsWith('script'));
				if (multiSelect) {
					transformedField.isMultiSelect = true;
					transformedField.type = VariableType.MULTI_SELECT;
				}
				if (hasScript) {
					transformedField.hasScript = true;
				}
			}
			break;
		case VariableType.HTML:
			transformedField.referringTable = formData.targetTable || formData.tableName;
			transformedField.referringRecordId = formData.targetRecordId || formData.sysId;
			break;
	}
	return transformedField;
};

export const fetchDependentChoices = (field, formData, dispatch) => {
	const changes = {
		[field.dependentField]: field.dependentFieldValue || field.dependentValue
	};
	const payload = {
		sys_id: field.referringRecordId,
		field: field.name,
		table: field.referringTable,
		serialized_changes: JSON.stringify(changes),
		encoded_record: getEncodedRecord(formData)
	};
	dispatch(CHOICE_FETCH_DATA, payload, { stopPropagation: true });

	return [];
};
