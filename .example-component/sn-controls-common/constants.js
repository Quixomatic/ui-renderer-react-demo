import { t } from 'sn-translate';

export const FIELD_MESSAGE_TYPES = [
	'error',
	'warning',
	'success',
	'liveUpdate',
	'info',
	'suggestion'
];
export const CALLBACK_AND_DISPATCH = 'CONTROLS_INTERNAL#CALLBACK_AND_DISPATCH';
export const CALLBACK_AND_DISPATCH_WITH_STATE =
	'CONTROLS_INTERNAL#CALLBACK_AND_DISPATCH_WITH_STATE';
export const NOW_INPUT = {
	VALUE_SET: 'NOW_INPUT#VALUE_SET',
	INVALID_SET: 'NOW_INPUT#INVALID_SET',
	INPUT: 'NOW_INPUT#INPUT'
};

export const NOW_BUTTON_ICONIC_CLICKED = 'NOW_BUTTON_ICONIC#CLICKED';
export const NOW_POPOVER_OPENED_SET = 'NOW_POPOVER#OPENED_SET';

export const TRACK_RECOMMENDATION_CLICK = 'Selected option from Recommendations section';

export const FIELD_RECOMMENDATION_INFORMATION = 'Field Recommendation information';
export const NO_PREDICTIONS_AVAILABLE = t('No predictions available'); 

export const SUGGESTION_PREFIX = 'suggestion#'
