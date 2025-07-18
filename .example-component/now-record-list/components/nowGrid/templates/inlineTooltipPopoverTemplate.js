import '../../inlineEditor/tooltip';

export const inlineTooltipTemplateName = 'inlineTooltipPopoverTemplate';

export const inlineTooltipTemplateRender = context => {
	const {
		popoverContext: {componentProps = {}}
	} = context;
	const {message} = componentProps;

	return <sn-record-list-inline-editor-tooltip message={message} />;
};
