import { escapeSeismicSpecialSymbols } from './escapeSeismicSpecialSymbols';
import { getSerializedChanges, getEncodedRecord } from './field';

export const getDeclarativeActionsProps = (daProps, controlProps = {}) => {
	let props = daProps;
	if (controlProps && props) {
		Object.assign(props, controlProps);
	}
	if(!props) return {};
	
	const displayValue = props.displayValue || '';
	
	const daOnlyProps = {
		canWrite: props.canWrite,
		declarativeUiActions: props.declarativeUiActions,
		dependentField: props.dependentField,
		dependentTable: props.dependentTable,
		dependentValue: props.dependentFieldValue || props.dependentValue,
		dictionary: props.dictionary,
		displayValue: escapeSeismicSpecialSymbols(displayValue.toString()),
		displayValueList: Array.isArray(displayValue) ? displayValue : null,
		fetchDeclarativeActions: props.fetchDeclarativeActions,
		fieldName: props.name,
		fieldType: props.fieldType,
		fields: props.fields,
		hidden: props.hidden,
		label: props.label,
		name: props.name,
		onValueChange: props.onValueChange,
		readonly: props.readonly,
		reference: props.reference,
		referenceKey: props.referenceKey,
		referenceSysId: props.referenceSysId || props.value,
		referenceTable: props.reference || props.referenceTable,
		referringRecordId: props.referringRecordId,
		referringTable: props.referringTable,
		required: props.required,
		tableName: props.referringTable || props.tableName,
		value: props.value,
		visible: props.visible,
		referenceQualifier: props.referenceQualifier,
		recordSysId: controlProps?.formData?.isNewRecord
			? '-1'
			: props.referringRecordId || props.recordSysId,
		serializedChanges: getSerializedChanges(props),
		encodedRecord: getEncodedRecord(controlProps.formData),
		ignoreDepAsRefQual: daProps?.ignoreDepAsRefQual || false
	}

	return daOnlyProps;
};
