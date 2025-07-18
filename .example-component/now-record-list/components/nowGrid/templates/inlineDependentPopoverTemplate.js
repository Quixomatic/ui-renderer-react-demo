import '../../inlineEditor/choiceEditor';

export const inlineDependentTemplateName = 'inlineDependentPopoverTemplate';

export const inlineDependentTemplateRender = context => {
	const {
		popoverContext: {componentProps = {}},
		properties: {
			options: {
				recordData: {inlineEditorPrefetchState}
			}
		}
	} = context;
	const {
		recordSysId,
		tableName,
		fieldName,
		allColumns,
		selectedSysIds,
		style,
		gridCellRef
	} = componentProps;

	return (
		<sn-record-list-inline-editor-dependent
			recordSysId={recordSysId}
			selectedSysIds={selectedSysIds}
			tableName={tableName}
			fieldName={fieldName}
			allColumns={allColumns}
			popoverStyle={style}
			gridCellRef={gridCellRef}
			prefetchData={inlineEditorPrefetchState}
		/>
	);
};
