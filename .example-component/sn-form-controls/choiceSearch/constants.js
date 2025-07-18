export const DROPDOWN_OPENED_SET = 'NOW_DROPDOWN_CUSTOM_TARGET#OPENED_SET';
export const ITEM_SELECTED = 'NOW_DROPDOWN_CUSTOM_TARGET#ITEM_CLICKED';
export const LEGACY_ACTION = 'SN_CHOICE_SEARCH_DROPDOWN#ITEM_SELECTED';
export const PANEL_FIT_PROPS = {
	position: [
		{ target: 'bottom-start', content: 'top-start' },
		{ target: 'top-start', content: 'bottom-start' },
		{ target: 'bottom-end', content: 'top-end' },
		{ target: 'top-end', content: 'bottom-end' }
	],
	constrain: {
		minHeight: 32,
		minWidth: 'target',
		maxWidth: 400
	}
};
