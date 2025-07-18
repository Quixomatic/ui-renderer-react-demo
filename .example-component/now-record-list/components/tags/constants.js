import {t} from 'sn-translate';

export const ADD_TAG_INPUT_ID = 'add-tag-input-id';
export const ADD_TAG = t('Add Tag');
export const REMOVE = t('Remove');
export const TAGS = t('Tags');
export const TAG_LIST_PILL_ARIA_DESCRIPTION = t('Click to edit tag');
export const TAG_LIST_PILL_REMOVE_ARIA_DESCRIPTION = t('Click to remove tag');

export const LABEL = 'label';
export const WRAP = 'wrap';
export const TRUNCATED = 'truncated';

export const VIEWABLE_BY = {
	ME: {
		value: 'me',
		displayValue: t('Me')
	},
	GROUPS_AND_USERS: {
		value: 'groups and users',
		displayValue: t('Groups and Users')
	},
	EVERYONE: {
		value: 'everyone',
		displayValue: t('Everyone')
	}
};

// Min-width for a pill component is 66px. (small sized pill)
// Considering ARBITRARY_PILL_WIDTH as 100, Assuming density or scaling changes on pill will not make pill min-width over 100px.
// So we could fit a pill safelfy in every 100px space available on a table column.
export const ARBITRARY_PILL_WIDTH = 100;

export const VIEWABLE_BY_DROPDOWN = {
	ME: {
		id: 'me',
		label: t('Me')
	},
	GROUPS_AND_USERS: {
		id: 'groups and users',
		label: t('Groups and Users')
	},
	EVERYONE: {
		id: 'everyone',
		label: t('Everyone')
	}
};

export const LABELS = {
	ADD_TAG: t('Add Tag'),
	ADD_TAG_INPUT_ID: 'add-tag-input-id',
	TAGS: t('Tags'),
	TAG_LIST_PILL_ARIA_DESCRIPTION: t('Click to edit tag')
};

export const PILL_COMPONENT_NAME = 'list-tags';
export const PILL_USERS_COMPONENT = 'user-tags';
export const PILL_GROUPS_COMPONENT = 'group-tags';
export const TAG_FILTER_APPLIED =
	'NOW_RECORD_LIST_CONNECTED#TAG_FILTER_APPLIED';
export const EDIT_TAG_MODAL_QUERIES = {
	GET_TAG_DETAILS: 'GET_TAG_DETAILS',
	GET_USERS: 'GET_USERS',
	GET_USER_GROUPS: 'GET_USER_GROUPS',
	UPDATE_TAG: 'UPDATE_TAG',
	GET_AVATARS: 'GET_AVATARS'
};
export const LOAD_TAG_DETAILS = 'LOAD_TAG_DETAILS';
export const LOAD_TAG_DETAILS_SUCCESSFUL = 'LOAD_TAG_DETAILS_SUCCESSFUL';
export const LOAD_TAG_DETAILS_FAILURE = 'LOAD_TAG_DETAILS_FAILURE';
export const NOW_PILL_SELECTED_SET = 'NOW_PILL#SELECTED_SET';
export const FILTER_TAG_LABEL = t('View records with this tag');
export const CANCEL_EDIT_MODAL_CLICKED = 'CANCEL_EDIT_MODAL_CLICKED';
export const SAVE_EDIT_MODAL_CLICKED = 'SAVE_EDIT_MODAL_CLICKED';
export const NOW_SELECT_SELECTED_ITEM_SET = 'NOW_SELECT#SELECTED_ITEM_SET';
export const NOW_INPUT_VALUE_SET = 'NOW_INPUT#VALUE_SET';
export const NOW_INPUT_INVALID_SET = 'NOW_INPUT#INVALID_SET';
export const UPDATE_TAG_AND_SAVE = 'UPDATE_TAG_AND_SAVE';
export const UPDATE_TAG_SUCCESSFUL = 'UPDATE_TAG_SUCCESSFUL';
export const TAG_NAME_LABEL = t('Name');
export const FILTER_LABEL = t('Filter tags');
export const VIEWABLE_BY_LABEL = t('Viewable by');
export const INVALID_TAG_NAME_ALERT = [
	{
		status: 'critical',
		icon: 'circle-exclamation-outline',
		content: t('Enter a name')
	}
];
export const INVALID_GROUPS_AND_USERS_ALERT = [
	{
		status: 'critical',
		icon: 'circle-exclamation-outline',
		content: t('Please add at least one group or user')
	}
];
export const TAG_FOOTER = {
	CANCEL: {
		label: t('Cancel'),
		variant: 'secondary',
		size: 'md'
	},
	SAVE: {
		label: t('Save'),
		variant: 'primary',
		size: 'md'
	}
};
export const FOOTER_ACTIONS = [TAG_FOOTER.SAVE, TAG_FOOTER.CANCEL];
export const FETCH_USERS = 'FETCH_USERS';
export const FETCH_GROUPS = 'FETCH_GROUPS';
export const GROUPS = t('Groups');
export const USERS = t('Users');
export const TAG_MODAL_HEADER = t('Tag Details');
export const TEXT_LINK_CLICKED = 'NOW_BUTTON_BARE#CLICKED';
export const NOW_TYPEAHEAD_MULTI_VALUE_SET = 'NOW_TYPEAHEAD_MULTI#VALUE_SET';
export const NOW_TYPEAHEAD_MULTI_SELECTED_ITEMS_SET =
	'NOW_TYPEAHEAD_MULTI#SELECTED_ITEMS_SET';
export const GET_USERS_SUCCESS_ACTION = 'GET_USERS_SUCCESS_ACTION';
export const GET_GROUPS_SUCCESS_ACTION = 'GET_GROUPS_SUCCESS_ACTION';
export const ALERT_MESSAGE = t('Please add at least one group or user');
export const TAG_MAX_LENGTH = 40;

export const NOW_TYPEAHEAD_VALUE_SET = 'NOW_TYPEAHEAD#VALUE_SET';
export const NOW_TYPEAHEAD_ENTER_KEYDOWN = 'NOW_TYPEAHEAD#ENTER_KEYDOWN';
export const NOW_TYPEAHEAD_SELECTED_ITEM_SET =
	'NOW_TYPEAHEAD#SELECTED_ITEM_SET';
export const FETCH_TAGS_WITH_PREFIX = 'FETCH_TAGS_WITH_PREFIX';
export const FETCH_TAGS_WITH_PREFIX_SUCCESS = 'FETCH_TAGS_WITH_PREFIX_SUCCESS';
export const HAS_TAG_CHECK = 'HAS_TAG_CHECK';
export const HAS_TAG_CHECK_SUCCESS = 'HAS_TAG_CHECK_SUCCESS';
export const CREATE_TAG = 'CREATE_TAG';
export const TAG_CLICKED = 'TAG_CLICKED';
export const CREATE_TAG_SUCCESS = 'CREATE_TAG_SUCCESS';
export const PREPARE_LABEL_ENTRIES_REQUEST = 'PREPARE_LABEL_ENTRIES_REQUEST';
export const CREATE_TAG_LABEL_ENTRIES =
	'NOW_RECORD_LIST_CONNECTED#CREATE_LABEL_ENTRIES';
export const DELETE_TAG_LABEL_ENTRIES =
	'NOW_RECORD_LIST_CONNECTED#DELETE_LABEL_ENTRIES';
export const PREFETCH_TAGS_REQUEST =
	'NOW_RECORD_LIST_CONNECTED#PREFETCH_TAGS_REQUEST';
export const TAG_GRAPGQL_FAILURE = 'TAG_GRAPGQL_FAILURE';
