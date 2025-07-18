export const columnFilteringTemplateName = 'columnFilteringPopoverTemplate';

export const columnFilteringTemplateRender = context => {
	const {
		popoverContext: {componentProps = {}}
	} = context;
	const {
		column,
		table,
		isGrouped,
		parsedQueryModel,
		isFilterable,
		filterId,
		listInstanceId,
		isGroupable,
		isGlideQuery,
		nonGlideFilterProps,
		hideColumnGrouping,
		hideColumnFiltering,
		tableMetadata
	} = componentProps;

	return (
		<sn-record-list-column-filter
			column={column}
			table={table}
			isGrouped={isGrouped}
			parsedQueryModel={parsedQueryModel}
			isFilterable={isFilterable}
			filterId={filterId}
			listInstanceId={listInstanceId}
			isGroupable={isGroupable}
			isGlideQuery={isGlideQuery}
			nonGlideFilterProps={nonGlideFilterProps}
			hideColumnGrouping={hideColumnGrouping}
			hideColumnFiltering={hideColumnFiltering}
			tableMetadata={tableMetadata}
		/>
	);
};
