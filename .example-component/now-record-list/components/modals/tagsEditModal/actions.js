import {actionTypes} from '@servicenow/ui-core';
import {createGraphQLEffect} from '@servicenow/ui-effect-graphql';
import get from 'lodash/get';

import {
	CLOSE_MODAL,
	LIST_REFRESH_REQUESTED_INTERNAL,
	MODAL_ACTIONS
} from '../../../constants';
import {
	FETCH_GROUPS,
	FETCH_USERS,
	GET_GROUPS_SUCCESS_ACTION,
	GET_USERS_SUCCESS_ACTION,
	LOAD_TAG_DETAILS,
	LOAD_TAG_DETAILS_FAILURE,
	LOAD_TAG_DETAILS_SUCCESSFUL,
	NOW_INPUT_INVALID_SET,
	NOW_INPUT_VALUE_SET,
	NOW_SELECT_SELECTED_ITEM_SET,
	NOW_TYPEAHEAD_MULTI_SELECTED_ITEMS_SET,
	NOW_TYPEAHEAD_MULTI_VALUE_SET,
	TAG_FILTER_APPLIED,
	TAG_FOOTER,
	TEXT_LINK_CLICKED,
	UPDATE_TAG_AND_SAVE,
	UPDATE_TAG_SUCCESSFUL,
	USERS,
	VIEWABLE_BY
} from '../../tags/constants';
import {openedSetEffect} from '../listCascadeDeleteModal';

import {EDIT_TAG_MODAL_QUERIES} from './editTagModalGraphQLQuery';
import {
	getSelectedItemsList,
	getUpdateTagDetails,
	getUserLists
} from './tagsEditModalUtils';

const {COMPONENT_DOM_READY} = actionTypes;

const footerActionClickedEffect = coeffects => {
	const footerActionLabel = get(
		coeffects,
		'action.payload.footerAction.label',
		''
	);
	const {
		dispatch,
		state: {tagDetails, selectedGroups, selectedUsers},
		updateState
	} = coeffects;
	if (footerActionLabel === TAG_FOOTER.CANCEL.label) {
		dispatch(CLOSE_MODAL);
	} else if (footerActionLabel === TAG_FOOTER.SAVE.label) {
		const showGroupsAndUsersAlert =
			tagDetails.viewableBy?.value === VIEWABLE_BY.GROUPS_AND_USERS.value &&
			!selectedGroups.length &&
			!selectedUsers.length;

		updateState([
			{
				path: 'invalidTagName',
				value: !tagDetails.name?.value,
				operation: 'set'
			},
			{
				path: 'isSaveClicked',
				value: showGroupsAndUsersAlert,
				operation: 'set'
			}
		]);
		if (!tagDetails.name?.value || showGroupsAndUsersAlert) return;
		dispatch(UPDATE_TAG_AND_SAVE, getUpdateTagDetails(tagDetails));
	}
};

const updateTagName = ({
	updateState,
	action: {
		payload: {value}
	}
}) => {
	updateState({
		path: 'tagDetails.name.value',
		value,
		operation: 'set'
	});
};

const updateTagNameInvalid = ({
	updateState,
	action: {
		payload: {fieldValue}
	}
}) => {
	updateState({
		path: 'tagDetails.name.value',
		value: fieldValue,
		operation: 'set'
	});
};

const updateUsersDetails = ({
	action: {
		payload: {name, value}
	},
	updateState
}) => {
	const listType = name === USERS ? 'userList' : 'groupList';
	const selectedType = name === USERS ? 'selectedUsers' : 'selectedGroups';
	updateState([
		{
			path: selectedType,
			value,
			operation: 'set'
		},
		{
			path: 'isSaveClicked',
			value: false,
			operation: 'set'
		},
		{
			path: `tagDetails.${listType}`,
			value: {
				displayValue: value.map(item => item.label).join(','),
				value: value.map(item => item.id).join(',')
			},
			operation: 'set'
		}
	]);
};

const loadTagEffect = createGraphQLEffect(
	EDIT_TAG_MODAL_QUERIES.GET_TAG_DETAILS,
	{
		variableList: ['tagId'],
		successActionType: LOAD_TAG_DETAILS_SUCCESSFUL,
		errorActionType: LOAD_TAG_DETAILS_FAILURE
	}
);

const loadTagDetails = coeffects => {
	const {
		dispatch,
		properties: {tagId}
	} = coeffects;
	if (!tagId) return;
	dispatch(LOAD_TAG_DETAILS, {tagId});
};

const updateTagDetails = coeffects => {
	const {updateState} = coeffects;
	const tagDetails = get(
		coeffects,
		'action.payload.data.GlideRecord_Query.label._results[0]',
		{}
	);

	const avatars = get(
		tagDetails,
		'_query.queryWithSysId.sys_user._results',
		[]
	);

	const {userList, groupList} = tagDetails;
	if (groupList?.value) {
		updateState({
			path: 'selectedGroups',
			value: getSelectedItemsList(tagDetails.groupList),
			operation: 'set'
		});
	}

	const userListValue = get(userList, 'value', '');
	tagDetails.userList.avatars = formatAvatars(avatars, userListValue);

	updateState([
		{
			path: 'tagDetails',
			value: tagDetails,
			operation: 'set'
		},
		{
			path: 'selectedUsers',
			value: getSelectedItemsList(userList),
			operation: 'set'
		}
	]);
};

const formatAvatars = (avatars = [], userValues) => {
	if (!userValues) return '';

	const userAvatars = {};

	avatars.forEach(({sysId, avatar}) => {
		userAvatars[sysId.value] = avatar.value;
	});

	return userValues
		.split(',')
		.map(userId => userAvatars[userId] || '')
		.join(',');
};

const tagsFilterApplied = coeffects => {
	const {
		dispatch,
		properties: {tagId}
	} = coeffects;

	dispatch(CLOSE_MODAL);
	dispatch(TAG_FILTER_APPLIED, {tagId});
};

const fetchUserEffect = createGraphQLEffect(EDIT_TAG_MODAL_QUERIES.GET_USERS, {
	variableList: ['queryConditions'],
	successActionType: GET_USERS_SUCCESS_ACTION
});

const fetchGroupsEffect = createGraphQLEffect(
	EDIT_TAG_MODAL_QUERIES.GET_USER_GROUPS,
	{
		variableList: ['queryConditions'],
		successActionType: GET_GROUPS_SUCCESS_ACTION
	}
);
const loadUsersSuccessHandler = coeffects => {
	const {updateState} = coeffects;
	const results = get(
		coeffects,
		'action.payload.data.GlideRecord_Query.sys_user._results',
		[]
	);

	updateState({
		path: 'users',
		value: getUserLists(results),
		operation: 'set'
	});
};

const loadGroupsSuccessHandler = coeffects => {
	const {updateState} = coeffects;
	const results = get(
		coeffects,
		'action.payload.data.GlideRecord_Query.sys_user_group._results',
		[]
	);
	updateState({
		path: 'groups',
		value: getUserLists(results),
		operation: 'set'
	});
};

const updateTagEffect = createGraphQLEffect(EDIT_TAG_MODAL_QUERIES.UPDATE_TAG, {
	variableList: ['sysId', 'name', 'userList', 'groupList', 'viewableBy'],
	successActionType: UPDATE_TAG_SUCCESSFUL
});

const updateTagSuccessHandler = ({dispatch}) => {
	dispatch(CLOSE_MODAL);
	dispatch(LIST_REFRESH_REQUESTED_INTERNAL, {timestamp: Date.now()});
};

const getGroupsAndUsers = ({dispatch, action}) => {
	const {name, value} = action.payload;
	if (value && value.trim() !== '') {
		const queryConditions = `nameLIKE${value}`;
		const dispatchAction = name === USERS ? FETCH_USERS : FETCH_GROUPS;
		dispatch(dispatchAction, {
			queryConditions
		});
	}
};

const updateViewableBy = ({action, updateState}) => {
	const {value} = action.payload;
	updateState({
		path: 'tagDetails.viewableBy.value',
		value,
		operation: 'set'
	});
};

const actionHandlers = {
	[MODAL_ACTIONS.OPENED_SET]: {
		effect: openedSetEffect,
		stopPropagation: true
	},
	[MODAL_ACTIONS.FOOTER_ACTION_CLICKED]: {
		effect: footerActionClickedEffect,
		stopPropagation: true
	},
	[COMPONENT_DOM_READY]: {
		effect: loadTagDetails,
		stopPropagation: true
	},
	[TEXT_LINK_CLICKED]: {
		effect: tagsFilterApplied,
		stopPropagation: true
	},
	[LOAD_TAG_DETAILS]: loadTagEffect,
	[LOAD_TAG_DETAILS_SUCCESSFUL]: {
		effect: updateTagDetails,
		stopPropagation: true
	},
	[NOW_TYPEAHEAD_MULTI_VALUE_SET]: {
		modifier: {
			name: 'debounce',
			delay: 300
		},
		effect: getGroupsAndUsers,
		stopPropagation: true
	},
	[FETCH_USERS]: fetchUserEffect,
	[FETCH_GROUPS]: fetchGroupsEffect,
	[GET_USERS_SUCCESS_ACTION]: {
		effect: loadUsersSuccessHandler,
		stopPropagation: true
	},
	[GET_GROUPS_SUCCESS_ACTION]: {
		effect: loadGroupsSuccessHandler,
		stopPropagation: true
	},
	[NOW_TYPEAHEAD_MULTI_SELECTED_ITEMS_SET]: {
		effect: updateUsersDetails,
		stopPropagation: true
	},
	[NOW_SELECT_SELECTED_ITEM_SET]: {
		effect: updateViewableBy,
		stopPropagation: true
	},
	[UPDATE_TAG_AND_SAVE]: updateTagEffect,
	[UPDATE_TAG_SUCCESSFUL]: {
		effect: updateTagSuccessHandler,
		stopPropagation: true
	},
	[NOW_INPUT_VALUE_SET]: {
		effect: updateTagName,
		stopPropagation: true
	},
	[NOW_INPUT_INVALID_SET]: {
		effect: updateTagNameInvalid,
		stopPropagation: true
	}
};

export default actionHandlers;
