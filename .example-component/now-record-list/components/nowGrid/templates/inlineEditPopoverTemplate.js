import '../../inlineEditor/inlineEditor';

export const inlineEditTemplateName = 'inlineEditPopoverTemplate';

export const inlineEditTemplateRender = context => {
	const {
		popoverContext: {componentProps = {}},
		properties: {
			options: {
				recordData: {inlineEditorPrefetchState}
			}
		}
	} = context;
	const {
		style,
		recordSysId,
		selectedSysIds,
		tableName,
		fieldName,
		fieldType,
		label,
		displayValue,
		value,
		onKeydown,
		allColumns,
		tableMetadata
	} = componentProps;

	return (
		<sn-record-list-inline-editor
			popoverStyle={style}
			recordSysId={recordSysId}
			selectedSysIds={selectedSysIds}
			tableName={tableName}
			fieldName={fieldName}
			fieldType={fieldType}
			label={label}
			displayValue={displayValue}
			value={value}
			onKeydown={onKeydown}
			allColumns={allColumns}
			prefetchData={inlineEditorPrefetchState}
			tableMetadata={tableMetadata}
		/>
	);
};
