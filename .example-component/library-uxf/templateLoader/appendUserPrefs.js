import {getUxGlobal} from './utils';

const USER_PREFS = getUxGlobal('userPrefs', {});

export default function appendUserPrefs(userPrefs) {
	for (const k in userPrefs) USER_PREFS[k] = userPrefs[k];
}
