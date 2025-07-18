import {t} from 'sn-translate';

// actions
export const CHOICE_FILTER_RESET = 'CHOICE_FILTER_RESET';
export const CHOICE_FILTER_GRAPHQL_EFFECT = 'CHOICE_FILTER_GRAPHQL_EFFECT';
export const CHOICE_FILTER_GRAPHQL_EFFECT_RESULT =
	'CHOICE_FILTER_GRAPHQL_EFFECT_RESULT';
export const CHOICE_FILTER_SET_STATE = 'CHOICE_FILTER_SET_STATE';
export const CHOICE_FILTER_SELECT_OPTION = 'CHOICE_FILTER_SELECT_OPTION';
export const CHOICE_FILTER_SELECT_ALL_BUTTON =
	'CHOICE_FILTER_SELECT_ALL_BUTTON#CLICKED';
export const CHOICE_FILTER_SELECT_NONE_BUTTON =
	'CHOICE_FILTER_SELECT_NONE_BUTTON#CLICKED';
export const CHOICE_FILTER_CLEAR_INPUT_VALUE =
	'CHOICE_FILTER_CLEAR_INPUT_VALUE';
export const COL_FILTER_SELECTED = 'COL_FILTER_SELECTED';
export const COL_FILTER_SUBMIT_QUERY = 'COL_FILTER_SUBMIT_QUERY';
export const COL_FILTER_INPUT_UPDATED = 'COL_FILTER_INPUT_UPDATED';
export const COL_FILTER_INPUT_GENERIC_UPDATED =
	'COL_FILTER_INPUT_GENERIC_UPDATED';
export const COL_FILTER_INPUT_BOOLEAN_UPDATED =
	'COL_FILTER_INPUT_BOOLEAN_UPDATED';
export const COL_FILTER_INPUT_REFERENCE_UPDATED =
	'COL_FILTER_INPUT_REFERENCE_UPDATED';
export const COL_FILTER_INPUT_NUMERIC_UPDATED =
	'COL_FILTER_INPUT_NUMERIC_UPDATED';
export const COL_FILTER_INPUT_DATE_UPDATED = 'COL_FILTER_INPUT_DATE_UPDATED';
export const COL_FILTER_INPUT_DATE_TIME_UPDATED =
	'COL_FILTER_INPUT_DATE_TIME_UPDATED';
export const COL_FILTER_INPUT_CHOICE_UPDATED =
	'COL_FILTER_INPUT_CHOICE_UPDATED';
export const COL_FILTER_INPUT_SEARCH_UPDATED =
	'COL_FILTER_INPUT_SEARCH_UPDATED';
export const COL_FILTER_SEARCH_TEXT = 'COL_FILTER_SEARCH_TEXT';
export const COL_FILTER_APPLY_BUTTON_CLICKED =
	'COL_FILTER_APPLY_BUTTON_CLICKED';

// component-names
export const FILTER_CLEAR_BUTTON = 'sn-list-column-filter-clear-button';
export const FILTER_CLOSE_BUTTON = 'sn-list-column-filter-close-button';
export const FILTER_APPLY_BUTTON = 'sn-list-column-filter-apply-button';
export const FILTER_SELECT_ALL_BUTTON =
	'sn-list-column-filter-select-all-button';
export const FILTER_SELECT_NONE_BUTTON =
	'sn-list-column-filter-select-none-button';

// field error type
export const FIELD_TYPE_ERROR = 'error';

export const MIN_CHOICES_FOR_CHOICE_FILTERING = 10;

// values
export const DEFAULT_DATE_FORMAT = 'YYYY-MM-DD';
export const DEFAULT_DATE_TIME_FORMAT = 'YYYY-MM-DD h:mm a';

export const OPERATORS_MAP_COLUMN_FILTERING = {
	'=': [t('is')],
	NOTON: [t('not on')],
	'!=': [t('is not')],
	ISEMPTY: [t('is empty')],
	ISNOTEMPTY: [t('is not empty')],
	STARTSWITH: [t('starts with')],
	ENDSWITH: [t('ends with')],
	LIKE: [t('contains')],
	'NOT LIKE': [t('does not contain')],
	'<': [t('before'), t('less than')],
	'<=': [t('at or before'), t('less than or is')],
	'>': [t('greater than'), t('after')],
	'>=': [t('greater than or is'), t('at or after')],
	BETWEEN: [t('between')],
	ON: [t('on')]
};

// types
export const COL_FILTER_TYPE_IS = {
	label: {generic: t('Is'), numeric: t('Is'), boolean: t('Is')},
	operator: '='
};
export const COL_FILTER_TYPE_IS_NOT = {
	label: {
		date: t('Not On'),
		generic: t('Is Not'),
		numeric: t('Is Not'),
		boolean: t('Is Not')
	},
	operator: '!='
};
export const COL_FILTER_TYPE_IS_EMPTY = {
	label: {
		date: t('Is Empty'),
		generic: t('Is Empty'),
		numeric: t('Is Empty'),
		reference: t('Is Empty'),
		boolean: t('Is Empty')
	},
	operator: 'ISEMPTY'
};
export const COL_FILTER_TYPE_IS_NOT_EMPTY = {
	label: {
		date: t('Is Not Empty'),
		generic: t('Is Not Empty'),
		numeric: t('Is Not Empty'),
		reference: t('Is Not Empty'),
		boolean: t('Is Not Empty')
	},
	operator: 'ISNOTEMPTY'
};
export const COL_FILTER_TYPE_STARTS_WITH = {
	label: {generic: t('Starts With'), reference: t('Starts With')},
	operator: 'STARTSWITH'
};
export const COL_FILTER_TYPE_ENDS_WITH = {
	label: {generic: t('Ends With'), reference: t('Ends With')},
	operator: 'ENDSWITH'
};
export const COL_FILTER_TYPE_CONTAINS = {
	label: {generic: t('Contains'), reference: t('Contains')},
	operator: 'LIKE'
};
export const COL_FILTER_TYPE_DOES_NOT_CONTAIN = {
	label: {generic: t('Does Not Contain'), reference: t('Does Not Contain')},
	operator: 'NOT LIKE'
};

// Figure out Glide ops below
export const COL_FILTER_TYPE_LESS_THAN = {
	label: {numeric: t('Less Than'), date: t('Before')},
	operator: '<'
};
export const COL_FILTER_TYPE_GREATER_THAN = {
	label: {numeric: t('Greater Than'), date: t('After')},
	operator: '>'
};
export const COL_FILTER_TYPE_LESS_THAN_OR_IS = {
	label: {numeric: t('Less Than or Is'), date: t('At or Before')},
	operator: '<='
};
export const COL_FILTER_TYPE_GREATER_THAN_OR_IS = {
	label: {numeric: t('Greater Than or Is'), date: t('At or After')},
	operator: '>='
};
export const COL_FILTER_TYPE_BETWEEN = {
	label: {numeric: t('Between'), date: t('Between')},
	operator: 'BETWEEN'
};

// Date specific
export const COL_FILTER_TYPE_ON = {
	label: {date: t('On')},
	operator: 'ON'
};
export const COL_FILTER_TYPE_NOT_ON = {
	label: {date: t('Not On')},
	operator: 'NOTON'
};
export const COL_FILTER_TYPE_BEFORE = {
	label: {date: t('Before')},
	operator: '<'
};
export const COL_FILTER_TYPE_AT_OR_BEFORE = {
	label: {date: t('At or Before')},
	operator: '<='
};
export const COL_FILTER_TYPE_AFTER = {
	label: {date: t('After')},
	operator: '>'
};
export const COL_FILTER_TYPE_AT_OR_AFTER = {
	label: {date: t('At or After')},
	operator: '>='
};

export const COL_GENERIC_FILTERS = [
	COL_FILTER_TYPE_IS,
	COL_FILTER_TYPE_IS_NOT,
	COL_FILTER_TYPE_STARTS_WITH,
	COL_FILTER_TYPE_ENDS_WITH,
	COL_FILTER_TYPE_CONTAINS,
	COL_FILTER_TYPE_DOES_NOT_CONTAIN,
	COL_FILTER_TYPE_IS_EMPTY,
	COL_FILTER_TYPE_IS_NOT_EMPTY
];

export const COL_BOOLEAN_FILTERS = [
	COL_FILTER_TYPE_IS,
	COL_FILTER_TYPE_IS_NOT,
	COL_FILTER_TYPE_IS_EMPTY,
	COL_FILTER_TYPE_IS_NOT_EMPTY
];

export const COL_NUMERIC_FILTERS = [
	COL_FILTER_TYPE_IS,
	COL_FILTER_TYPE_IS_NOT,
	COL_FILTER_TYPE_IS_EMPTY,
	COL_FILTER_TYPE_IS_NOT_EMPTY,
	COL_FILTER_TYPE_LESS_THAN,
	COL_FILTER_TYPE_GREATER_THAN,
	COL_FILTER_TYPE_LESS_THAN_OR_IS,
	COL_FILTER_TYPE_GREATER_THAN_OR_IS,
	COL_FILTER_TYPE_BETWEEN
];

export const COL_DATE_FILTERS = [
	COL_FILTER_TYPE_ON,
	COL_FILTER_TYPE_NOT_ON,
	COL_FILTER_TYPE_BEFORE,
	COL_FILTER_TYPE_AT_OR_BEFORE,
	COL_FILTER_TYPE_AFTER,
	COL_FILTER_TYPE_AT_OR_AFTER,
	COL_FILTER_TYPE_BETWEEN,
	COL_FILTER_TYPE_IS_EMPTY,
	COL_FILTER_TYPE_IS_NOT_EMPTY
];

export const COL_REFERENCE_FILTERS = [
	COL_FILTER_TYPE_STARTS_WITH,
	COL_FILTER_TYPE_ENDS_WITH,
	COL_FILTER_TYPE_CONTAINS,
	COL_FILTER_TYPE_DOES_NOT_CONTAIN,
	COL_FILTER_TYPE_IS_EMPTY,
	COL_FILTER_TYPE_IS_NOT_EMPTY
];

export const APPLY = t('Apply');
export const CLEAR = t('Remove filter');

export const ENTER_KEY = 'Enter';

export const CLOSE_WITHOUT_FILTERING = t('Close without saving filter');
export const CLOSE = t('Close');

export const BOOLEAN_FILTER_CHOICES = [
	{value: 'true', displayValue: t('True')},
	{value: 'false', displayValue: t('False')}
];

export const FILTER_VALUE = t('Filter value');
