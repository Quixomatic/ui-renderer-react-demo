import '@servicenow/now-typeahead';
import {Fragment} from '@servicenow/ui-renderer-snabbdom';
import {isEmpty} from 'lodash';

import {
	GROUPS,
	INVALID_GROUPS_AND_USERS_ALERT,
	USERS,
	VIEWABLE_BY,
	VIEWABLE_BY_DROPDOWN,
	VIEWABLE_BY_LABEL
} from '../../tags/constants';

const selectedGroupsOrUsersView = (label, usersList, selectedEntities) => {
	return (
		<now-typeahead-multi
			className="edit-tag-modal-typeahead"
			name={label}
			label={label}
			items={usersList}
			selected-items={selectedEntities}
			manage-selected-items
		/>
	);
};

const usersAndGroupsView = state => {
	const {groups, selectedGroups, users, selectedUsers} = state;

	return (
		<div>
			<div className="tag-groups">
				{selectedGroupsOrUsersView(GROUPS, groups, selectedGroups)}
			</div>
			<div className="tag-users">
				{selectedGroupsOrUsersView(USERS, users, selectedUsers)}
			</div>
		</div>
	);
};

export const viewableByView = state => {
	const {tagDetails, isSaveClicked} = state;
	const {viewableBy, userList, groupList} = tagDetails;
	const isGroupsAndUsers =
		viewableBy?.value === VIEWABLE_BY.GROUPS_AND_USERS.value;
	const showAlert =
		isSaveClicked && isEmpty(userList.value) && isEmpty(groupList.value);

	return (
		<Fragment>
			<now-select
				className="edit-tag-modal-select-viewableby"
				search="none"
				items={Object.values(VIEWABLE_BY_DROPDOWN)}
				label={VIEWABLE_BY_LABEL}
				selected-item={viewableBy.value}
				messages={showAlert ? INVALID_GROUPS_AND_USERS_ALERT : []}
			/>
			{isGroupsAndUsers && usersAndGroupsView(state)}
		</Fragment>
	);
};
