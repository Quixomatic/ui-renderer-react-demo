import { t } from 'sn-translate';
export const SC_FORM_VALUECHANGE = 'SC_FORM_VALUECHANGE';
export const SC_FORM_VALUECHANGE_SUCCESS = 'SC_FORM_VALUECHANGE_SUCCESS';
export const SC_FORM_VALUECHANGE_ERROR = 'SC_FORM_VALUECHANGE_ERROR';
export const SC_FORM_REGEX_VALIDATION = 'SC_FORM_REGEX_VALIDATION';
export const SC_FORM_REGEX_VALIDATION_SUCCESS =
	'SC_FORM_REGEX_VALIDATION_SUCCESS';
export const SC_FORM_REGEX_VALIDATION_ERROR = 'SC_FORM_REGEX_VALIDATION_ERROR';
export const MESSAGE_TYPE_ERROR = 'error';
export const ON_CHANGE = 'ON_CHANGE';
export const FETCH_REQUESTED_FOR_ACCESS = 'FETCH_REQUESTED_FOR_ACCESS';
export const DELEGATION_DATA_FETCH_SUCCESS = 'DELEGATION_DATA_FETCH_SUCCESS';
export const DELEGATION_DATA_FETCH_FAILURE = 'DELEGATION_DATA_FETCH_FAILURE';
export const DELEGATION_API_URL =
	'/api/sn_sc/v1/servicecatalog/items/:item_sys_id/delegation/:user_sys_id';
export const REQUESTED_FOR_ERROR_MSG = t(
	"This person isn't eligible for this request."
);
export const DELEGATION_DATA_FETCH_FAILURE_MSG = t(
	'Error occured while fetching the delegation access'
);

export const SC_FORM_REGEX_VALIDATION_FETCH_FAILED_MSG = t(
	'Error occured while validating the variable regex'
);
export const NOW_RADIO_BUTTONS_VALUE_SET = 'NOW_RADIO_BUTTONS#VALUE_SET';
export const CHOICE_FETCH_DATA = 'CHOICE_FETCH_DATA';
export const CHOICE_FETCH_DATA_SUCCESS = 'CHOICE_FETCH_DATA_SUCCESS';
export const CHOICE_FETCH_DATA_FAILURE = 'CHOICE_FETCH_DATA_FAILURE';
export const GRAPHQL_DATA_PATH =
	'data.GlideLayout_Query.choiceDataRetriever.choice';

export const READONLY_OPTION = {
	DEFAULT: 'default',
	PRINTABLE: 'printable'
};

export const RENDER_STYLE = {
	DEFAULT: 'default',
	COMPACT: 'compact'
};
