import get from 'lodash/get';

import {SHOW_HIDDEN_CONTROLS_USER_PREF} from '../../../constants';

export const getValueForUserPreference = (
	userPreferences,
	prefName,
	defValue
) => {
	const prefNameInPreferencesList = userPreferences.find(
		pref => pref.name === prefName
	);
	return get(prefNameInPreferencesList, 'value', defValue);
};

export const userPrefSelectors = {
	showHiddenControls: userPrefs =>
		getValueForUserPreference(
			userPrefs,
			SHOW_HIDDEN_CONTROLS_USER_PREF,
			'false'
		)
};
