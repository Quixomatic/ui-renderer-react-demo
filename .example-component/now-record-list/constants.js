import {t} from 'sn-translate';

//Seismic Actions
export const COMPONENT_PROPERTY_CHANGED = 'SEISMIC_COMPONENT_PROPERTY_CHANGED';

export const MODEL_PATH = {
	LAYOUT_QUERY: {
		ALL_SYS_IDS: 'layoutQuery.allSysIds',
		COUNT: 'layoutQuery.count',
		ENCODED_QS: 'layoutQuery.encodedQueryString',
		FINAL_COUNT: 'layoutQuery.finalCount',
		GROUP_COUNT: 'layoutQuery.groupCount',
		IS_OMIT_COUNT: 'layoutQuery.isOmitCount',
		QUERY_ROWS: 'layoutQuery.queryRows'
	}
};

// Accessibility user preferences
export const SHOW_HIDDEN_CONTROLS_USER_PREF =
	'glide.ui.accessibility.show_hidden_controls';

//Actions
export const REFRESH_BUTTON_CLICKED = 'REFRESH_BUTTON_CLICKED';
export const FILTER_BUTTON_CLICKED = 'FILTER_BUTTON_CLICKED';
export const SELECT_ALL_RECORDS = 'SELECT_ALL_RECORDS';
export const ITEM_SELECTED = 'ITEM_SELECTED';
export const LIST_UPDATED = 'LIST_UPDATED';
export const LIST_MENU_CRUD = 'LIST_MENU_CRUD';
export const LIST_USER_PREFERENCE_WRAPLISTTEXT = 'workspace.wrapListText';
export const DATE_FORMAT_USER_PREFERENCE = 'glide.ui.date_format';
export const SHORT_DATE_FORMAT_USER_PREFERENCE = 'glide.ui.short_date_format';
export const REFRESH_LIST_MENU = 'REFRESH_LIST_MENU';
export const DA_WRAPPED_CLICKED = 'DA_WRAPPED_CLICKED';
export const RESET_GRID_SCROLL = 'NOW_RECORD_LIST#RESET_SCROLL';
// Actions UIB
export const LIST_EDIT_COLUMN_REQUESTED =
	'NOW_RECORD_LIST#EDIT_COLUMN_REQUESTED';
export const LIST_RENAME_REQUESTED = 'NOW_RECORD_LIST#LIST_RENAME_REQUESTED';
export const LIST_RESET_COLUMN_WIDTH_REQUESTED =
	'NOW_RECORD_LIST#RESET_COLUMN_WIDTH_REQUESTED';
export const LIST_SAVE_AS_REQUESTED = 'NOW_RECORD_LIST#LIST_SAVE_AS_REQUESTED';
export const LIST_SAVE_REQUESTED = 'NOW_RECORD_LIST#LIST_SAVE_REQUESTED';
export const LIST_DELETE_REQUESTED = 'NOW_RECORD_LIST#LIST_DELETE_REQUESTED';
export const LIST_VIEW_ALL_CLICKED = 'NOW_RECORD_LIST#VIEW_ALL_CLICKED';
export const LIST_DA_WRAPPED_CLICKED = 'NOW_RECORD_LIST#DA_WRAPPED_CLICKED';
export const LIST_FORM_EDIT_WRAPPED_CLICKED =
	'NOW_RECORD_LIST#FORM_EDIT_WRAPPED_CLICKED';
export const LIST_DA_ACTIONS_CONTRACT_GENERATED =
	'NOW_RECORD_LIST#DA_CLIENT_ACTIONS_CONTRACT_GENERATED';
export const LIST_FORM_EDIT_PREVIEW_RECORD_CLICKED =
	'NOW_RECORD_LIST#FORM_EDIT_PREVIEW_RECORD_CLICKED';
export const REFERENCE_INFO_CLICK = 'REFERENCE_INFO_CLICK';
export const REF_SEARCH_REQUESTED = 'REF_SEARCH_REQUESTED';
export const PREVIEW_RECORD = 'PREVIEW_RECORD';

// Actions for pagination
export const PAGE_UPDATE = 'NOW_PAGINATION#PAGE_UPDATE';
export const LIMIT_UPDATE = 'NOW_PAGINATION#LIMIT_UPDATE';

export const LIST_RESTORE_DEFAULTS = 'LIST_RESTORE_DEFAULTS';
export const LIST_DELETE_CONDITION = 'LIST_DELETE_CONDITION';
export const LIST_REFRESH_REQUESTED = 'LIST_REFRESH_REQUESTED';
export const LIST_REFRESH_REQUESTED_INTERNAL =
	'LIST_REFRESH_REQUESTED_INTERNAL';
export const LIST_TIMEAGO_RESET = 'LIST_TIMEAGO_RESET';
export const LIST_SELECT_ADVANCED_VIEW = 'LIST_SELECT_ADVANCED_VIEW';
export const LIST_SELECT_FROM_DROPDOWN = 'LIST_SELECT_FROM_DROPDOWN';

export const NOW_PANEL_OPENED_SET = 'NOW_PANEL#OPENED_SET';

//Metrics
export const METRIC_TRACKED = 'LIST_METRIC_TRACKED';

// Filter panel actions
export const QUICK_EDIT_CLICKED = 'QUICK_EDIT_CLICKED';
export const LIST_CLOSE_PANEL = 'LIST_CLOSE_PANEL';
export const ADD_NEW_PILL = 'ADD_NEW_PILL';
export const CLOSE_FILTER_PANEL = 'CLOSE_FILTER_PANEL';

//Form actions
export const RECORD_WATCHER_SUBSCRIBED = 'RECORD_WATCHER_SUBSCRIBED';
export const RECORD_WATCHER_STARTED = 'RECORD_WATCHER_SUBSCRIBE_STARTED';
export const RECORD_WATCHER_FAILED = 'RECORD_WATCHER_SUBSCRIBE_FAILED';
export const FORM_DATA_PROVIDER_SUCCESS = 'FORM_DATA_PROVIDER_FETCH_SUCCESS';
export const CONTENT_ITEMS_SELECTED = 'CONTENT_ITEMS_SELECTED';
export const FORM_UPDATE_HEADER = 'FORM_UPDATE_HEADER';
export const NOW_RESIZE_ELEMENT_RESIZED = 'NOW_RESIZE#ELEMENT_RESIZED';

//Quick form actions
export const QUICK_FORM = {
	CLOSE: 'QUICK_FORM#CLOSE',
	SAVE_SUCCEEDED: 'QUICK_FORM#SAVE_SUCCEEDED',
	SAVE_FAILED: 'QUICK_FORM#SAVE_FAILED',
	DIRTY_CHANGED: 'QUICK_FORM#DIRTY_CHANGED'
};

// Multi form constants
export const MULTI_FORM = {
	CLOSE: 'MULTI_FORM#CLOSE',
	SAVE_SUCCEEDED: 'MULTI_FORM#SAVE_SUCCEEDED',
	SAVE_FAILED: 'MULTI_FORM#SAVE_FAILED',
	DIRTY_CHANGED: 'MULTI_FORM#DIRTY_CHANGED'
};

export const DIRTY_CHANGED = 'DIRTY_CHANGED';
export const DECLARATIVE_ACTIONS = {
	EDIT: 'DA#EDIT_SELECTED',
	EXPORT: 'DA#EXPORT_MODAL',
	DELETE: 'DA#CASCADE_DELETE',
	IMPORT: 'DA#IMPORT_MODAL'
};
export const OPEN_RECORD = 'OPEN_RECORD';
export const RESIZE_FLOATING_HEADER = 'RESIZE_FLOATING_HEADER';

//Live List changes
export const LIVE_LIST_ITEM_ENTERED = 'LIVE_LIST_ITEM_ENTERED';
export const LIVE_LIST_ITEM_CHANGED = 'LIVE_LIST_ITEM_CHANGED';

// Actions
export const DROPDOWN_ITEM_CLICKED = 'NOW_DROPDOWN#ITEM_CLICKED';
export const TEXT_LINK_CLICKED = 'NOW_TEXT_LINK#CLICKED';
export const BUTTON_CLICKED = 'NOW_BUTTON#CLICKED';
export const BARE_BUTTON_CLICKED = 'NOW_BUTTON_BARE#CLICKED';
export const SPLIT_BUTTON_CLICKED = 'NOW_SPLIT_BUTTON#ACTION_CLICKED';
export const SPLIT_BUTTON_ITEM = 'NOW_SPLIT_BUTTON#ITEM_CLICKED';
export const DATA_PROVIDER_BOOTSTRAP = 'PROVIDER_BOOTSTRAP';
export const FETCH_LIST_DATA = 'FETCH_LIST_DATA';
export const FETCH_LIST_DATA_COMPLETE = 'FETCH_LIST_DATA_COMPLETE';
export const LIST_UPDATE_SORT = 'LIST_UPDATE_SORT';
export const LIST_OPEN_GROUP = 'LIST_OPEN_GROUP';
export const LIST_ADD_GROUPBY = 'LIST_ADD_GROUPBY';
export const LIST_REMOVE_GROUPBY = 'LIST_REMOVE_GROUPBY';
export const LIST_ID_CHANGED = 'LIST_ID_CHANGED';
export const GRID_ADD_GROUPBY = 'GRID#ADD_GROUPBY';
export const GRID_REMOVE_GROUPBY = 'GRID#REMOVE_GROUPBY';
export const GRID_UPDATE_SORT = 'GRID#UPDATE_SORT';
export const GRID_COLUMN_SELECT = 'GRID#COLUMN_SELECT';
export const GRID_A11Y_COLUMN_REORDER = 'GRID#A11Y_COLUMN_REORDER';
export const GRID_TOGGLE_GROUP = 'GRID#TOGGLE_GROUP';
export const COLUMN_APPLY_COLOR = 'COLUMN#APPLY_COLOR';
export const VIEW_ALL_CLICKED = 'NOW_RECORD_LIST_CONNECTED#VIEW_ALL_CLICKED';
export const LIST_UPDATE_COLUMN_WIDTH_USER_PREF =
	'LIST_UPDATE_COLUMN_WIDTH_USER_PREF';
export const UPDATE_COLPROPS_HEADERROWS = 'UPDATE_COLPROPS_HEADERROWS';

//Col Resizing
export const COL_RESIZE = 'COL_RESIZE';
export const COL_RESIZE_INITIAL = 'COL_RESIZE_INITIAL';
export const TOGGLE_COL_RESIZING = 'TOGGLE_COL_RESIZING';

// Prop Names
export const LOADING_PROP = 'loading';
export const LAST_FORCED_RENDER_PROP = 'lastForcedRender';
export const GRID_MODEL_PROP = 'gridModel';
export const COLUMN_WIDTHS_RESET_REQUESTED_PROP = 'columnWidthsResetRequested';

export const SELECTED_RECORDS_CHANGED = 'SELECTED_RECORDS_CHANGED';

// Preference Actions
export const PREF_GROUP_TOGGLE = 'PREF_GROUP_TOGGLE';
export const PREF_GROUP_TOGGLE_ALL = 'PREF_GROUP_TOGGLE_ALL';

// Actions for parsedquerymodel data provider
export const FETCH_PARSED_QUERY_MODEL = 'FETCH_PARSED_QUERY_MODEL';
export const ADD_FILTER_COMPARISON = 'LIST#ADD_FILTER_COMPARISON';
export const MUTATE_FILTER_COMPARISON = 'LIST#MUTATE_FILTER_COMPARISON';
export const MUTATE_COMPLEX_FILTER_COMPARISON =
	'LIST#MUTATE_COMPLEX_FILTER_COMPARISON';
export const ADD_COMPLEX_FILTER_COMPARISON =
	'LIST#ADD_COMPLEX_FILTER_COMPARISON';
export const DELETE_COMPLEX_FILTER_COMPARISON =
	'LIST#DELETE_COMPLEX_FILTER_COMPARISON';

export const DELETE_FILTER_COMPARISON = 'LIST#DELETE_FILTER_COMPARISON';

//Utils
export const ASC = 'ASC';
export const DESC = 'DESC';
export const CLEAR = 'CLEAR';
export const ORDERBYDESC = 'ORDERBYDESC';
export const ORDERBY = 'ORDERBY';
export const QUERY_DELIMITER = '^';
export const AT_DELIMITER = '@';
export const EQUALS = '=';
export const NOT_EQUALS = '!=';
export const OPEN_PAREN = '(';
export const CLOSE_PAREN = ')';
export const SINGLE_QUOTE = "'";
export const COMMA = ',';
export const DATE_COLUMN_NAME = 'GlideLayout_DateTimeElementType';
export const GROUP_BY = 'GROUPBY';
export const SCROLL_THROTTLE_LIMIT = 1000;
export const LIST_LOADER_SIZE_MD = 'md';
export const LIST_LOADER_SIZE_LG = 'lg';
export const SCRIPT_DATE_GENERATE = 'javascript:gs.dateGenerate';
export const SCRIPT_CURRENCY_FILTER = 'javascript:global.getCurrencyFilter';
export const ON = 'ON';
export const NOTON = 'NOTON';
export const BETWEEN = 'BETWEEN';
export const ISEMPTY = 'ISEMPTY';
export const ISNOTEMPTY = 'ISNOTEMPTY';
export const REQUIRES_RANGE = [ON, NOTON, BETWEEN];
export const _START = 'start';
export const _END = 'end';
export const TIME_START = '00:00:00';
export const TIME_END = '23:59:59';
export const BEFORE = '<';
export const AT_OR_BEFORE = '<=';
export const AFTER = '>';
export const AT_OR_AFTER = '>=';
export const DATEPART = 'DATEPART';
export const RELATIVE = 'RELATIVE';
export const ANYTHING = 'ANYTHING';
export const SAMEAS = 'SAMEAS';
export const NSAMEAS = 'NSAMEAS';
export const MORETHAN = 'MORETHAN';
export const LESSTHAN = 'LESSTHAN';
export const NOT_IN = 'NOT IN';
export const IN = 'IN';
export const EMPTYSTRING = 'EMPTYSTRING';
export const DYNAMIC = 'DYNAMIC';
export const NONE = 'none';
export const GRID_CELL_MAXCHAR = 4000;
export const END_QUERY_DELIMITER = '^EQ';

//Grid Cell Input Types
export const GLIDE_DATE = 'glide_date';
export const GLIDE_DATE_TIME = 'glide_date_time';
export const GLIDE_CURRENCY = 'currency';
export const GLIDE_FX_CURRENCY = 'currency2';
export const GLIDE_JOURNAL_INPUT = 'journal_input';
export const GLIDE_JOURNAL = 'journal';
export const GLIDE_REFERNCE = 'reference';
export const GLIDE_DOCUMENT_ID = 'document_id';
export const GLIDE_RELATED_TAGS = 'related_tags';
export const GLIDE_LIST = 'glide_list';
export const GLIDE_PASSWORD = 'password';
export const GLIDE_TAGS = 'tags';
export const GLIDE_SYS_CLASS = 'sys_class_name';
export const GLIDE_URL = 'url';
export const GLIDE_REFERENCE_TYPE = 'GlideLayout_ReferenceElementType';

//LIST API types
export const LIMIT = 'LIMIT';
export const SCROLL = 'SCROLL';
export const PAGE = 'PAGE';
export const ORDER_BY = 'ORDER_BY';

// Discrete API actions
export const LIST_SCROLL_UPDATED = 'LIST_SCROLL_UPDATED';
export const GRID_MODEL_UPDATED = 'GRID_MODEL_UPDATED';
export const ADVANCED_VIEW_SET_QUERY = 'ADVANCED_VIEW_SET_QUERY';
export const PROPERTIES_SET = 'PROPERTIES_SET';
export const UPDATE_STATE_PROPERTIES = 'UPDATE_STATE_PROPERTIES';
// LIST Actions Manager
export const MY_LIST = 'my_list';
export const AW_LIST = 'sys_aw_list';
export const AW_MY_LIST = 'sys_aw_my_list';
export const UX_MY_LIST = 'sys_ux_my_list';
export const GRID_CELL_LIST = 'grid_cell_list';

export const MY_LIST_RENAME = 'MY_LIST_RENAME';
export const MY_LIST_EDIT = 'MY_LIST_EDIT';
export const MY_LIST_SAVE = 'MY_LIST_SAVE';
export const MY_LIST_SAVE_AS = 'MY_LIST_SAVE_AS';
export const MY_LIST_DELETE = 'MY_LIST_DELETE';

export const LIST_SAVE_AS = 'LIST_SAVE_AS';

export const GRID_CELL_FILTER_OUT = 'GRID_CELL_FILTER_OUT';
export const GRID_CELL_SHOW_MATCHING = 'GRID_CELL_SHOW_MATCHING';

export const INVALID_ACTION_ITEM = 'INVALID_ACTION_ITEM';

//Checkbox Action
export const CHECKBOX_CHECKED_SET = `SN_GRID_CHECKBOX#CHECKED_SET`;

export const LIST_PAGE_RESET = {
	page: 1
};

export const LIST_SELECTION_RESET = {
	selectedRecords: [],
	exceptedRecords: [],
	allRecordsSelected: false,
	selectionCount: 0,
	quickEditSysId: ''
};

export const LIST_PROP_RESET = {
	...LIST_PAGE_RESET,
	...LIST_SELECTION_RESET
};

// Checkbox API actions
export const GRID_CHECKBOX_TOGGLED = 'GRID_CHECKBOX_TOGGLED';

// Checkbox names
export const SN_GRID_CHECKBOX_ALL = 'SN_GRID_CHECKBOX_ALL';

// LIST Notifications
export const RECORD_LIST_NOTIFICATION_ADDED =
	'NOW_RECORD_LIST#NOTIFICATION_ADDED';

// LIST iframe Modal
export const IFRAME_DEFAULTS = {
	autoCloseOn: ['URL_CHANGED']
};
export const EDIT_COLS_BASE_URL =
	'/aw_personalize_col_iframe_form.do?sysparm_titleless=true&sysparm_skipmsgs=true';

export const URL_PARAM_LIMIT = 1900;

// GlideQuery
export const EMPTY_PARSED_QUERY = {
	predicates: [
		{
			compound_type: 'or',
			subpredicates: [
				{
					compound_type: 'and',
					subpredicates: [
						{
							compound_type: 'and',
							subpredicates: [],
							type: 'compound'
						}
					],
					type: 'compound'
				}
			],
			type: 'compound'
		}
	],
	has_rlq_conditions: false,
	order_by: [],
	group_by: []
};

export const LIST_TYPE_DEFAULT = 'DEFAULT';
export const LIST_TYPE_GROUPED = 'GROUPED'; // This listType is currently used based on listModel query if it is grouped. Outside consumer cannot configure list with this type
export const LIST_TYPE_REFERENCE = 'REFERENCE';
export const LIST_TYPE_RELATED = 'RELATED';
export const LIST_TYPE_SNAPSHOT = 'SNAPSHOT';
export const LIST_TYPE_PICKER = 'PICKER';
export const VIRTUAL_DATA_SOURCE = 'VIRTUAL_DATA_SOURCE'; // This listType is for future use.

export const LIST_TYPE_INTERFACES = {
	[LIST_TYPE_DEFAULT]: ['table'],
	[LIST_TYPE_GROUPED]: ['table', 'query'],
	[LIST_TYPE_REFERENCE]: [
		'table',
		'chars',
		'recordSysId',
		'field',
		'ignoreRefQual',
		'serializedChanges'
	],
	[LIST_TYPE_RELATED]: ['table', 'parentTable', 'relatedListName']
};

export const LIST_TYPES = {
	DEFAULT: LIST_TYPE_DEFAULT,
	REFERENCE: LIST_TYPE_REFERENCE,
	RELATED: LIST_TYPE_RELATED,
	PICKER: LIST_TYPE_PICKER,
	SNAPSHOT: LIST_TYPE_SNAPSHOT
};

export const LIST_TYPE_TAGS = {
	DEFAULT: 'now-record-list',
	REFERENCE: 'now-record-list-reference',
	RELATED: 'now-record-list-related',
	PICKER: 'now-record-list-picker',
	SNAPSHOT: 'now-record-list-snapshot'
};

export const INLINE_EDITOR_TYPE_TAGS = {
	DEFAULT: 'sn-record-list-inline-editor',
	DEPENDENT: 'sn-record-list-inline-editor-dependent',
	TAGS: 'sn-record-list-inline-editor-tags'
};

// Filter panel types
export const PANEL_TYPE_FILTER = 'PANEL_TYPE_FILTER';
export const PANEL_TYPE_MULTI_EDIT = 'PANEL_TYPE_MULTI_EDIT';
export const PANEL_TYPE_QUICK_EDIT = 'PANEL_TYPE_QUICK_EDIT';
export const PANEL_TYPE_FROM_DA = 'PANEL_TYPE_FROM_DA';

export const PANEL_TYPE_TRANSLATIONS = {
	[PANEL_TYPE_FILTER]: t('Filter'),
	[PANEL_TYPE_MULTI_EDIT]: t('Multi Edit'),
	[PANEL_TYPE_QUICK_EDIT]: t('Quick Edit')
};

// List Column Filtering
export const COLUMN_FILTERING = 'COLUMN_FILTERING';
export const ADVANCED_FILTER = 'advanced';
export const CHOICE_FILTER = 'choice';
export const DATE_FILTER = 'date';
export const DATE_TIME_FILTER = 'date_time';
export const GENERIC_FILTER = 'generic';
export const NUMERIC_FILTER = 'numeric';
export const REFERENCE_FILTER = 'reference';
export const UNSUPPORTED_FILTER = 'unsupported';
export const SEARCH_FILTER = 'search';
export const BOOLEAN_FILTER = 'boolean';
export const FILTERS_OPERATED_VIA_VALUE_COMPONENT = [
	GENERIC_FILTER,
	NUMERIC_FILTER,
	DATE_FILTER,
	DATE_TIME_FILTER,
	REFERENCE_FILTER,
	BOOLEAN_FILTER
];

// List Cell Filtering
export const CELL_FILTERING = 'CELL_FILTERING';
export const CELL_FILTERING_OPTION_CLICKED = 'CELL_FILTERING_OPTION_CLICKED';

export const DEFAULT_VARIANT = 'tertiary';
export const DEFAULT_COLOR = 'positive';

export const FILTER_TYPE_FLAGS = {
	[ADVANCED_FILTER]: {optionsNotSupported: []},
	[CHOICE_FILTER]: {
		optionsSupported: [EQUALS, IN],
		optionsSupportedMap: {
			is: EQUALS,
			in: IN
		}
	},
	[DATE_FILTER]: {
		optionsNotSupported: [
			DATEPART,
			RELATIVE,
			ANYTHING,
			SAMEAS,
			NSAMEAS,
			MORETHAN,
			LESSTHAN
		]
	},
	[DATE_TIME_FILTER]: {
		optionsNotSupported: [
			DATEPART,
			RELATIVE,
			ANYTHING,
			SAMEAS,
			NSAMEAS,
			MORETHAN,
			LESSTHAN
		]
	},
	[GENERIC_FILTER]: {
		optionsNotSupported: [
			ANYTHING,
			IN,
			EMPTYSTRING,
			AT_OR_BEFORE,
			AT_OR_AFTER,
			SAMEAS,
			NSAMEAS
		]
	},
	[BOOLEAN_FILTER]: {
		optionsNotSupported: [
			ANYTHING,
			IN,
			EMPTYSTRING,
			AT_OR_BEFORE,
			AT_OR_AFTER,
			SAMEAS,
			NSAMEAS
		]
	},
	[NUMERIC_FILTER]: {
		dataTypesSupported: [
			'integer',
			'float',
			'decimal',
			'numeric',
			'long',
			'longint',
			GLIDE_CURRENCY
		],
		optionsNotSupported: [NOT_IN, IN, ANYTHING, SAMEAS, NSAMEAS]
	},
	[REFERENCE_FILTER]: {
		optionsNotSupported: [
			ANYTHING,
			IN,
			EMPTYSTRING,
			AT_OR_BEFORE,
			AT_OR_AFTER,
			SAMEAS,
			NSAMEAS,
			EQUALS,
			NOT_EQUALS,
			DYNAMIC
		]
	},
	[UNSUPPORTED_FILTER]: [
		GLIDE_LIST,
		GLIDE_PASSWORD,
		GLIDE_TAGS,
		GLIDE_RELATED_TAGS,
		GLIDE_FX_CURRENCY,
		GLIDE_SYS_CLASS
	]
};

export const TOGGLE_LIST_MENU = 'TOGGLE_LIST_MENU';
export const DEFAULT_MAX_PAGES = 10;
export const REF_MAX_PAGES = 5;
export const GROUPED_CHOICE_MAX_PAGES = 1;
export const MAX_GROUPS_PER_PAGE = 20;

// Click handler constants
export const CLICK_HANDLER_POPOVER = 'CLICK_HANDLER_POPOVER';
export const CLICK_HANDLER_QUICK_EDIT = 'CLICK_HANDLER_QUICK_EDIT';

// Grid Popover constants
export const GRID_CLOSE_POPOVER = 'GRID_CLOSE_POPOVER';
export const GRID_OPEN_POPOVER = 'GRID_OPEN_POPOVER';
export const COLUMN_FILTERING_WIDTH = 259;
export const CELL_FILTERING_WIDTH = 154;
export const CELL_FILTERING_HEIGHT = 70;
export const GRID_POPOVER_TRIGGER_HEIGHT = 25;
export const GRID_POPOVER_TRIGGER_WIDTH = 25;
export const GRID_POPOVER_TRIGGER_OFFSET = 5;
export const BODY_OVERFLOW_CLASS = 'sn-list-body-overflow';

export const POPOVER_OFFSET = 12;

// Button Component Names
export const BUTTON_GROUP_TOGGLE = 'BUTTON_GROUP_TOGGLE';
export const BUTTON_GROUP_ALL_TOGGLE = 'BUTTON_GROUP_ALL_TOGGLE';
export const BUTTON_CONDITION_BUILDER_RUN = 'BUTTON_CONDITION_BUILDER_RUN';

// Modal Constants
export const OPEN_MODAL = 'OPEN_MODAL';
export const CLOSE_MODAL = 'CLOSE_MODAL';
export const EXPORT_MODAL_BOOTSTRAP = 'EXPORT_MODAL_BOOTSTRAP';
export const FETCH_IS_PERSONALIZED_SUCCESS = 'FETCH_IS_PERSONALIZED_SUCCESS';
export const WORKSPACE_LIST_COLUMN_ORDER = 'workspace.list.columnOrder';
export const DEFAULT_VIEW = 'Default view';
export const LIST_WITHOUT_COLUMNS_RENDERED = 'LIST_WITHOUT_COLUMNS_RENDERED';
export const FETCH_USER_PREFERENCE_SUCCESS = 'FETCH_USER_PREFERENCE_SUCCESS';
export const LIST_WITH_PREFERENCE_RENDERED = 'LIST_WITH_PREFERENCE_RENDERED';

export const MODAL_TYPES = {
	EXPORT: 'EXPORT',
	SAVE_AS: 'SAVE_AS',
	DELETE_LIST: 'DELETE_LIST',
	RENAME_LIST: 'RENAME_LIST',
	EDIT: 'EDIT',
	ADVANCED_VIEW: 'ADVANCED_VIEW',
	CASCADE_DELETE: 'CASCADE_DELETE',
	IMPORT: 'IMPORT',
	EDIT_TAG: 'EDIT_TAG'
};

export const MODAL_ACTIONS = {
	FOOTER_ACTION_CLICKED: 'NOW_MODAL#FOOTER_ACTION_CLICKED',
	OPENED_SET: 'NOW_MODAL#OPENED_SET'
};

export const NOW_RECORD_LIST_CONNECTED_REFERENCE_CONNECTED =
	'NOW_RECORD_LIST_CONNECTED_REFERENCE#CONNECTED';

// CASCADE DELETE CONSTANTS
export const CASCADE_DELETE_GRAPHQL_POPUP_EFFECT_RESULT =
	'CASCADE_DELETE_GRAPHQL_POPUP_EFFECT_RESULT';
export const CASCADE_DELETE_GRAPHQL_POPUP_EFFECT =
	'CASCADE_DELETE_GRAPHQL_POPUP_EFFECT';
export const CASCADE_DELETE_GRAPHQL_EFFECT = 'CASCADE_DELETE_GRAPHQL_EFFECT';
export const CASCADE_DELETE_PROPERTIES = {
	CASCADE_DELETE_CONFIRM: 'glide.ui.confirm_cascade_delete'
};
//List Export Constants
export const LIST_EXPORT = 'LIST_EXPORT';
export const OPEN_LIST_EXPORT_MODAL = 'OPEN_LIST_EXPORT_MODAL';
export const MY_LIST_EXPORT = 'MY_LIST_EXPORT';
export const LIST_EXPORT_USER_PREFERENCES = {
	EXPORT_DELIVERY_TYPE: 'list_export.deliveryType',
	EXPORT_ORIENTATION_TYPE: 'list_export.orientationType',
	EXPORT_FILE_TYPE: 'list_export.fileType',
	EXPORT_EMAIL: 'list_export.email'
};
export const LIST_UPDATE_EXPORT_USER_PREF = 'LIST_UPDATE_EXPORT_USER_PREF';

export const CHANGE_MODAL_TYPE = 'CHANGE_MODAL_TYPE';
export const EXPORT_MODAL_FIELD_CHANGED = 'EXPORT_MODAL_FIELD_CHANGED';

// Field Types
export const CHOICE = 'choice';
export const REFERENCE = 'reference';
export const EMAIL = 'email';

export const EXPORT_STATUSES = {
	LOADING: 'EXPORT_STATUS#LOADING',
	SUCCESS: 'EXPORT_STATUS#SUCCESS',
	FAIL: 'EXPORT_STATUS#FAIL',
	CANCEL: 'EXPORT_STATUS#CANCEL'
};
export const EXPORT_ACTIONS = {
	SUCCESS: 'EXPORT_ACTION#SUCCESS',
	FAIL: 'EXPORT_ACTION#FAIL',
	CANCEL: 'EXPORT_ACTION#CANCEL'
};
export const EXPORT_MESSAGES = {
	SUCCESS: t('Export complete'),
	FAIL: t('Export failed'),
	CANCEL: t('Export canceled')
};
export const EXPORT_POLL_INTERVAL = 3000;
export const EXPORT_SYSTEM_PROPERTIES = {
	THRESHOLD: 'glide.ui.export.warn.threshold',
	LIMIT: 'glide.ui.export.limit'
};

export const LIST_EXPORT_EDS_MODAL = {
	BUTTONS: {
		PRIMARY: 'primary',
		SECONDARY: 'secondary',
		BUTTONTYPE: 'footer-button'
	},
	LABELS: {
		EXPORT: t('Export'),
		CANCEL: t('Cancel')
	},
	ACTIONS: {
		EXPORT: 'LIST_EXPORT_MODAL#EXPORT',
		CANCEL: 'LIST_EXPORT_MODAL#CANCEL',
		CLOSE: 'NOW_MODAL#OPENED_SET'
	},
	TYPES: {
		CHOICE: CHOICE,
		EMAIL: EMAIL
	}
};

export const LIST_PROGRESS_EDS_MODAL = {
	LABELS: {
		DOWNLOAD: t('Download'),
		CANCEL: t('Cancel'),
		OK: t('OK')
	},
	ACTIONS: {
		DOWNLOAD: 'LIST_PROGRESS_MODAL#DOWNLOAD',
		CANCEL: 'LIST_PROGRESS_MODAL#CANCEL'
	}
};

export const SET_ORIGINAL_CONDITONS = 'SET_ORIGINAL_CONDITONS';
export const CHECK_AND_SET_ORIGINAL_CONDITONS =
	'CHECK_AND_SET_ORIGINAL_CONDITONS';

export const GRID_SET_COL_WIDTH = 'GRID_SET_COL_WIDTH';
export const GRID_RESET_COL_WIDTHS = 'GRID_RESET_COL_WIDTHS';
export const GRID_SET_INITIAL_COL_WIDTHS = 'GRID_SET_INITIAL_COL_WIDTHS';
export const LIST_UPDATE_COLUMNS_RESIZED = 'LIST_UPDATE_COLUMNS_RESIZED';

// Preference constants
export const USER_PREFERENCE_NULL_VALUE = '123_NULLVALUE_321';

// Attribute Constants
export const OMIT_COUNT = 'omit_count';
export const IS_OMIT_COUNT = MODEL_PATH.LAYOUT_QUERY.IS_OMIT_COUNT;
export const OMIT_COUNT_NEXT_PAGE = 'omitCountNextPage';
export const FINAL_COUNT = MODEL_PATH.LAYOUT_QUERY.FINAL_COUNT;

export const DELETE_CONDITION_DEBOUNCE = 250;

// Header constants
export const SIZE_LARGE = 'lg';
export const SIZE_MEDIUM = 'md';
export const SIZE_SMALL = 'sm';
export const SIZE_FULL_SCREEEN = 'fullscreen';

export const HEADER_PRIMARY = 'header-primary';
export const HEADER_SECONDARY = 'header-secondary';
export const HEADER_TERTIARY = 'header-tertiary';

export const LIST_HEADER_SIZE_DEFAULT = SIZE_MEDIUM;
export const LIST_HEADING_LEVEL_DEFAULTS = {
	[SIZE_LARGE]: 1,
	[SIZE_MEDIUM]: 2,
	[SIZE_SMALL]: 3
};

// Component Driver constants
export const TEST_TIMEOUT = 45000;
export const RENDER_TIMEOUT = 15000;

// Column Resizing constants
export const KEY_ARROW_RIGHT = 'ArrowRight';
export const KEY_ARROW_LEFT = 'ArrowLeft';
export const KEY_PAGE_UP = 'PageUp';
export const KEY_PAGE_DOWN = 'PageDown';
export const KEY_LEFT = 'Left';
export const KEY_RIGHT = 'Right';
export const KEY_DOWN = 'Down';
export const KEY_UP = 'Up';
export const COL_RESIZE_AMOUNT = 5;
export const COL_RESIZE_LARGE_AMOUNT = 50;
export const COL_RESIZE_MIN_WIDTH = 120;
export const DRAG_THROTTLE_AMOUNT = 50;
export const KEYDOWN_DEBOUNCE_AMOUNT = 250;

export const UPDATE_PANEL = 'UPDATE_PANEL';
export const OPEN_PANEL = 'OPEN_PANEL';
export const CLOSE_PANEL = 'CLOSE_PANEL';

// Now Grid
export const NOW_LIST_USE_NOW_GRID = 'NOW_LIST_USE_NOW_GRID';
export const NOW_TOGGLE_CHECKED_SET = 'NOW_TOGGLE#CHECKED_SET';
//Keys
export const KEY_ENTER = 'Enter';
export const KEY_SPACE = ' ';
export const KEY_SPACEBAR = 'Spacebar';
export const KEY_BACKSPACE = 'Backspace';
export const KEY_DELETE = 'Delete';
//Alert List
export const ALERT_LIST = {
	ITEMS_SET: 'NOW_ALERT_LIST#ITEMS_SET'
};
export const ALERT_CONSTANTS = Object.freeze({
	STATUS: {
		CRITICAL: 'critical',
		HIGH: 'high',
		MODERATE: 'moderate',
		WARNING: 'warning',
		INFO: 'info',
		POSITIVE: 'positive',
		LOW: 'low'
	},
	ACTION: {
		TYPES: {
			DISMISS: 'dismiss',
			ACKNOWLEDGE: 'acknowledge',
			OPEN: 'open'
		}
	}
});

export const CLOSE_CALENDAR = 'CLOSE_CALENDAR';
export const REFIT_POPOVER = 'REFIT_POPOVER';

export const LIST_ADVANCED_VIEW_FIXED_QUERY_SET =
	'NOW_RECORD_LIST#ADVANCED_VIEW_FIXED_QUERY_SET';
export const NOW_COMPARISON_ROW_VALUE_STAGED =
	'NOW_COMPARISON_ROW#VALUE_STAGED';
export const CONDITION_BUILDER_ENCODED_QUERY_SET =
	'NOW_CONDITION_BUILDER#ENCODED_QUERY_SET';
export const UPDATE_LABEL = t('Update');
export const UPDATE_BUTTON_ID = 'update-button';
export const CANCEL_LABEL = t('Cancel');
export const CANCEL_BUTTON_ID = 'cancel-button';

export const NOW_TOOLTIP_OPENED_SET = 'NOW_TOOLTIP#OPENED_SET';
export const NOW_POPOVER_CONTENT_VISIBLE = 'NOW_POPOVER#CONTENT_VISIBLE';
export const NOW_POPOVER_CONTENT_HIDDEN = 'NOW_POPOVER#CONTENT_HIDDEN';
export const NOW_POPOVER_OPENED_SET = 'NOW_POPOVER#OPENED_SET';
export const NOW_BUTTON_ICONIC_CLICKED = 'NOW_BUTTON_ICONIC#CLICKED';
export const NOW_DROPDOWN_LIST_ACTIVE_ITEM_SET =
	'NOW_DROPDOWN_LIST#ACTIVE_ITEM_SET';
export const NOW_DROPDOWN_LIST_ITEM_CLICKED = 'NOW_DROPDOWN_LIST#ITEM_CLICKED';
export const NOW_DROPDOWN_ITEM_CLICKED = 'NOW_DROPDOWN#ITEM_CLICKED';
export const NOW_INPUT_INVALID = 'NOW_INPUT#INVALID_SET';
export const NOW_RECORD_DATE_PICKER_STAGED_CHANGED =
	'NOW_RECORD_DATE_PICKER#STAGED_VALUE_CHANGED';
export const NOW_RECORD_MINI_CALENDAR_OK = 'NOW_RECORD_MINI_CALENDAR#ON_OK';
export const LIST_DATA_FETCH_COMPLETE = 'LIST_DATA_FETCH_COMPLETE';
export const LIST_CONNECTED_FETCH_SUCCEEDED =
	'NOW_RECORD_LIST_CONNECTED#DATA_FETCH_SUCCEEDED';
export const LIST_CONNECTED_FETCH_REQUESTED =
	'NOW_RECORD_LIST_CONNECTED#DATA_FETCH_REQUESTED';
export const GRAPHQL_REQUEST_STARTED = 'GRAPHQL_REQUEST_STARTED';
export const GFORM_INTERNAL_BATCH = 'GFORM_INTERNAL#BATCH_ACTIONS';
export const DECLARATIVE_ACTION_UPDATE_RENDER =
	'DECLARATIVE_ACTION#UPDATE_RENDER';

export const HIGHLIGHT_SELECTOR = '>>> now-grid >>> .quick-edit-highlight';
export const FILTER_PANEL_BUTTON_SELECTOR =
	'>>> sn-record-list-header-toolbar >>> sn-record-list-header-toolbar-button-filter-panel >>> now-button >>> button';

export const PHONE_VALUE_CHANGED = 'PHONE_VALUE_CHANGED';
export const PHONE_STAGED_VALUE_CHANGED = 'PHONE_STAGED_VALUE_CHANGED';
export const DATE_VALUE_CHANGED = 'NOW_RECORD_DATE_PICKER#VALUE_CHANGED';
export const INPUT_VALUE_CHANGED =
	'SN_RECORD_INPUT_CONNECTED#STAGED_VALUE_CHANGED';
export const REFERENCE_VALUE_CHANGED =
	'SN_RECORD_REFERENCE_CONNECTED#VALUE_CHANGED';
export const NUMBER_VALUE_CHANGED = 'NOW_RECORD_NUMBER#VALUE_CHANGED';
export const DURATION_VALUE_CHANGED = 'SN_RECORD_DURATION#VALUE_CHANGED';

export const EMPTY_BULK_FOCUS = {
	colIndex: 0,
	focusedIndicies: [],
	focusedSysIds: [],
	previousSysId: ''
};

export const CLICK = 'click';
export const SEISMIC_HOST = 'seismic-hoist';

export const ESCAPE_KEY_CODE = 27;

export const SEISMIC_HOIST = 'SEISMIC-HOIST';

export const INLINE_EDITING_FAILED_STATUS = 'FAILED';

export const CHOICE_VALUE_MAP_CHANGED =
	'NOW_RECORD_LIST#INLINE_EDITTING_CHOICE_VALUE_MAP_CHANGED';
export const SAVE_CHOICES_EFFECT =
	'NOW_RECORD_LIST#INLINE_EDITTING_SAVE_CHOICES_EFFECT';

export const INLINE_EDITING_PREFETCH_REQUEST =
	'NOW_RECORD_LIST_CONNECTED#INLINE_EDITING_PREFETCH_REQUEST';
export const INLINE_EDITING_PREFETCH_DEPENDENT_REQUEST =
	'NOW_RECORD_LIST_CONNECTED#INLINE_EDITING_DEPENDENT_REQUEST';
export const INLINE_EDITING_WRITE_REQUEST =
	'NOW_RECORD_LIST_CONNECTED#INLINE_EDITING_WRITE_REQUEST';

export const INLINE_EDITING_RESET_FOCUSED_CELLS =
	'NOW_RECORD_LIST#INLINE_EDITING_RESET_FOCUSED_CELLS';

// List Import Constants
export const IMPORT_MODAL = Object.freeze({
	INSERT_UPDATE_MSG: t('Do you want to insert or update data?'),
	INCLUDE_ALL_FIELDS: t('Include all fields in the template?'),
	EXCEL_TEMPLATE: t('Create excel template'),
	DOWNLOAD_TEMPLATE_LABEL: t('Download Excel template'),
	BROWSE_MSG: t('Browse for the template file to upload it.'),
	UPLOAD_MSG: t('Upload a file'),
	UPLOAD_PROGRESS: t('Upload progress'),
	UPLOAD_SUCCESS: 'Success',
	PREVIEW: t('Preview'),
	GENERIC_ERROR_MESSAGE: t('Import failed'),
	ROOT_TRACKER_NOTFOUND: t('Unable to find the root tracker'),
	ACCESS_DENIED: t('Access denied'),
	DEFAULT_PROGRESS_VALUE: 0.1,
	PERCENT_COMPLETED: 100,
	TRACKER_DEFAULT_PERCENT: 25,
	EXCEL_TEMPLATE_FORMAT: t('Excel template format')
});

export const IMPORT_MODAL_ACTIONS = Object.freeze({
	NOW_RADIO_BUTTON_VALUE_CHANGE: 'NOW_RADIO_BUTTONS#VALUE_SET',
	NOW_CHECKBOX_VALUE_CHANGE: 'NOW_CHECKBOX#CHECKED_SET',
	NOW_STEPPER_SELECTED_ITEM: 'NOW_STEPPER#SELECTED_ITEM_SET',
	IMPORT_FILE_UPLOAD: 'LIST_IMPORT_MODAL#FILE_UPLOAD',
	LIST_IMPORT_GET_ROOTID: 'LIST_IMPORT_MODAL#GET_ROOTID',
	FILE_UPLOAD_PROCESSOR_TRIGGERED:
		'IMPORT_MODAL_ACTIONS#FILE_UPLOAD_PROCESSOR_TRIGGERED',
	PROGRESS_STATUS_REQUESTED: 'IMPORT_MODAL_ACTIONS#PROGRESS_STATUS_REQUESTED',
	LIST_IMPORT_GET_ROOTID_SUCCESS: 'LIST_IMPORT_MODAL#GET_ROOTID_SUCCESS',
	LIST_IMPORT_GET_ROOTID_FAILURE: 'LIST_IMPORT_MODAL#GET_ROOTID_FAILURE',
	FILE_UPLOAD_PROCESSOR_SUCCEEDED:
		'IMPORT_MODAL_ACTIONS#FILE_UPLOAD_PROCESSOR_SUCCEEDED',
	FILE_UPLOAD_PROCESSOR_FAILED:
		'IMPORT_MODAL_ACTIONS#FILE_UPLOAD_PROCESSOR_FAILED',
	PROGRESS_STATUS_SUCCEEDED: 'IMPORT_MODAL_ACTIONS#PROGRESS_STATUS_SUCCEEDED',
	PROGRESS_STATUS_FAILED: 'IMPORT_MODAL_ACTIONS#PROGRESS_STATUS_FAILED',
	PROGRESS_TRACKER_TRIGGERED: 'IMPORT_MODAL_ACTIONS#PROGRESS_TRACKER_TRIGGERED',
	NOW_DROPDOWN_VALUE_CHANGED: 'NOW_DROPDOWN#ITEM_CLICKED',
	NOW_BUTTON_BARE_CLICKED: 'NOW_BUTTON_BARE#CLICKED',
	EXPORT_CANCEL_CLICKED: 'LIST_IMPORT_MODAL#EXPORT_CANCEL_CLICKED',
	EXPORT_EXCEPTIONS_HANDLED: 'LIST_IMPORT_MODAL#EXPORT_EXCEPTIONS_HANDLED',
	COMPONENT_LOAD_COMPLETED: 'LIST_IMPORT_MODAL#COMPONENT_LOAD_COMPLETED',
	COMPONENT_LOAD_FAILED: 'LIST_IMPORT_MODAL#COMPONENT_LOAD_FAILED',
	COMPONENT_LOAD_REQUESTED: 'LIST_IMPORT_MODAL#COMPONENT_LOAD_REQUESTED',
	LIST_IMPORT_PREVIEW_REQUESTED:
		'LIST_IMPORT_MODAL#LIST_IMPORT_PREVIEW_REQUESTED',
	LIST_IMPORT_PREVIEW_SUCCEEDED:
		'LIST_IMPORT_MODAL#LIST_IMPORT_PREVIEW_SUCCEEDED',
	LIST_IMPORT_PREVIEW_FAILED: 'LIST_IMPORT_MODAL#LIST_IMPORT_PREVIEW_FAILED',
	LIST_IMPORT_ADD_ERROR_NOTIFICATION:
		'LIST_IMPORT_MODAL#LIST_IMPORT_ADD_ERROR_NOTIFICATION',
	LIST_IMPORT_COMPLETE_REQUESTED:
		'LIST_IMPORT_MODAL#LIST_IMPORT_COMPLETE_REQUESTED',
	LIST_IMPORT_COMPLETE_SUCCEEDED:
		'LIST_IMPORT_COMPLETE_REQUESTED#LIST_IMPORT_COMPLETE_SUCCEEDED',
	LIST_IMPORT_COMPLETE_FAILED:
		'LIST_IMPORT_COMPLETE_REQUESTED#LIST_IMPORT_COMPLETE_FAILED'
});

export const IMPORT_FOOTER_BUTTON = {
	CANCEL: {label: t('Cancel'), variant: 'secondary'},
	NEXT: {label: t('Next'), variant: 'primary'},
	BROWSE: {label: t('Browse'), variant: 'primary'},
	UPLOAD: {label: t('Upload'), variant: 'primary'},
	BACK: {label: t('Back'), variant: 'tertiary'},
	COMPLETE_IMPORT: {label: t('Complete import'), variant: 'primary'}
};

export const STEPPER_ITEMS = [
	{id: 1, label: t('Insert/Update'), progress: 'none'},
	{id: 2, label: t('Upload file'), progress: 'none'},
	{id: 3, label: t('Preview'), progress: 'none'}
];
export const NOW_MODAL = 'now-modal';
export const STEPPER_PROGRESS_STATES = Object.freeze({
	none: 'none',
	partial: 'partial',
	done: 'done'
});
export const TRACKER_NAME = {
	ROOT: t('Importing Excel Workbook'),
	FILE_UPLOADER: 'File Uploader',
	PROCESSOR: 'Processor'
};
export const TRACKER_RESULTS = {
	STATE: {
		PENDING: '0',
		RUNNING: '1',
		SUCCESS: '2',
		FAILED: '3',
		CANCEL: '4',
		TRACKER_NOTFOUND: '-1'
	}
};

export const IMPORT_MODAL_MESSAGES = Object.freeze({
	ROOT_ID_FAILURE_MSG: t('List Import: Failed to fetch root Id'),
	FILE_UPLOAD_FAILURE_MSG: t('List Import: File uploader failed'),
	PROGRESS_STATUS_FAILURE_MSG: t('List Import: Progress tracker failed'),
	PREVIEW_FAILURE_MSG: t('List Import: Failed to fetch preview data'),
	INVALID_IMPORT_SET_ID_MSG: t('List Import: Invalid import set Id'),
	PREVIEW_HEADING_MSG: t(
		"Click 'Complete import' when satisfied with the changes to finish importing the data."
	)
});
export const LIST_IMPORT_PROPERTIES = {
	LEGACY_EXCEL_SUPPORT: 'glide.legacy.excel.export'
};
export const SYSPARAM_INSERT_IMPORT = 'import_insert_template';
export const SYSPARAM_UPDATE_IMPORT = 'import_update_template';
export const OK_BUTTON = 'acknowledge';

export const EXPORTING = t('Exporting');
export const SYS_TAGS = 'sys_tags';

export const ASCENDING = 'ascending';
export const DESCENDING = 'descending';

export const SORTED_ASCENDING_MSG = t('Sorted in ascending order');
export const SORTED_DESCENDING_MSG = t('Sorted in descending order');

export const LIST_VIEW_ALL = 'LIST_VIEW_ALL';
export const CELL_URL_CLICKED = 'CELL_URL_CLICKED';

export const LIST_COUNT_STATUS = Object.freeze({
	FETCHING: 'fetching',
	SUCCESS: 'success',
	ERROR: 'error'
});

export const LIST_COUNT_ERROR_MESSAGE = t(
	'Unable to load record count. Try refreshing the list.'
);

// Focus trap constant

export const UPDATE_FOCUS_TRAP = 'UPDATE_FOCUS_TRAP';
