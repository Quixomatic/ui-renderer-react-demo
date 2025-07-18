import {VIEWABLE_BY} from '../../tags/constants';

const getImageUrl = avatar => (avatar ? `/${avatar}.iix?t=small` : '');
const splitString = (value, delimeter) => (value ? value.split(delimeter) : []);

export const getSelectedItemsList = list => {
	const values = splitString(list.value, ',');
	const displayValues = splitString(list.displayValue, ',');
	const avatars = splitString(list.avatars, ',');

	return values.map((value, index) => ({
		id: value,
		label: displayValues[index],
		avatarProps: {
			userName: displayValues[index],
			imageSrc: getImageUrl(avatars[index])
		}
	}));
};

export const getUserLists = list =>
	list.map(item => ({
		id: item.sysId.value,
		label: item.name.value,
		subLabel: item.email?.value,
		avatarProps: {
			userName: item.name.value,
			imageSrc: getImageUrl(item.avatar?.value)
		}
	}));

export const getUpdateTagDetails = tagDetails => {
	const {
		sysId: {value: sysId},
		name: {value: name},
		userList: {value: userList},
		groupList: {value: groupList},
		viewableBy: {value: viewableBy}
	} = tagDetails;
	return viewableBy === VIEWABLE_BY.GROUPS_AND_USERS.value
		? {
				sysId,
				name,
				viewableBy,
				userList,
				groupList
		  }
		: {sysId, name, viewableBy};
};
