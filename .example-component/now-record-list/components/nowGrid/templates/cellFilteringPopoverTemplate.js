import '../../cellFiltering/cellFilteringContainer';

export const cellFilteringTemplateName = 'cellFilteringPopoverTemplate';

export const cellFilteringTemplateRender = context => {
	const {
		popoverContext: {componentProps = {}}
	} = context;
	const {popover, listInstanceId} = componentProps;

	return (
		<sn-record-list-cell-filter
			popover={popover}
			listInstanceId={listInstanceId}
		/>
	);
};
