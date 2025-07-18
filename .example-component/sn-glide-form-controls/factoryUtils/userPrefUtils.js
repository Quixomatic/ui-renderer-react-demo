import { memoize, get, isNumber } from 'lodash';
import { isAttrTrue } from '@devsnc/sn-controls-common';
import { adjustPropsForTimezone } from './fieldPropUtils';
import { getFirstDayOfTheWeek } from './syspropUtils';

/**
 * Get the user preferences according to whether it is legacy workspace or new workspace
 * @param {object}} formData passed from forms, contains userSession
 * @returns {object} object containing all the user preferences for the current user.
 */
const getCurrentUser = (formData = {}) => {
	return (
		formData != null && formData.classicForm
			? memoize(() =>
					get(
						window,
						'ux_globals.presource["sn-workspace-header:wsUserData"].data.GlideDomain_Query.user',
						formData.userSession || {}
					)
			  )
			: () =>
					get(formData, 'userSession', {
						countryCallingCode: '',
						dateFormat: 'yyyy-MM-dd',
						dateTimeFormat: 'yyyy-MM-dd HH:mm:ss',
						language: 'en',
						timeFormat: 'HH:mm:ss',
						timeZone: 'US/Pacific',
						timeZoneOffset: -28800000
					})
	)();
};

/**
 * Flag to determine whether to enable helper content or not based on user preference accessibility settings.
 * @param {object} currentUser object created from getCurrentUser()
 * @returns {boolean} Whether both sys preferences are true
 */
const isAccessibilityTooltipsEnabled = currentUser => {
	const preferences = get(currentUser, 'preferences', []) || [];

	const userA11yPrefs = preferences.filter(
		preference =>
			get(preference, 'name') === 'glide.ui.accessibility.accessible.tooltips'
	);
	return userA11yPrefs.length
		? userA11yPrefs.every(({ value }) => isAttrTrue(value))
		: false;
};

const getHelperContent = (field, currentUser) =>
	isAccessibilityTooltipsEnabled(currentUser) || field.showFieldHint
		? get(field, 'dictionary.fieldHint', '')
		: '';

const getTimezoneOffset = user => {
	let millisecondsToHours = ms => ms / 1000 / 60 / 60;

	return isNumber(user.timeZoneOffset)
		? millisecondsToHours(user.timeZoneOffset)
		: undefined;
};

const getUserLanguage = user => {
	const fallback = get(
		navigator,
		'languages[0]',
		navigator.language || navigator.userLanguage
	);

	return user.language || fallback;
};

const getTimeProps = controlProps => {
	const { formData } = controlProps;

	return adjustPropsForTimezone({
		...controlProps,
		firstDayOfWeek: getFirstDayOfTheWeek(),
		language: getUserLanguage(getCurrentUser(formData)),
		utcOffset: getTimezoneOffset(getCurrentUser(formData))
	});
};

const isSupportedLocal = locale => {
	let length;
	try {
		length = Intl.NumberFormat.supportedLocalesOf([locale]).length;
	} catch (err) {
		return false;
	}
	return length > 0;
};

const normalizeFormat = locale => {
	switch (locale) {
		case 'pb':
			return 'pt-BR';
		case 'fq':
			return 'fr-CA';
		case 'zt':
			return 'zh-Hant';
		case 'xl':
			return 'en';
		default:
			return locale ? locale.replace(/[._]/, '-') : document.documentElement.lang;
	}
};

const fixLocale = locale => {
	const formatedLocale = normalizeFormat(locale);
	return isSupportedLocal(formatedLocale)
		? formatedLocale
		: document.documentElement.lang;
};

const resolveLanguage = (
	userLanguage,
	systemLanguage,
	supportedLanguages = ''
) => {
	const supportedLanguagesArr = supportedLanguages.split(',');
	if (userLanguage && supportedLanguagesArr.includes(userLanguage))
		return userLanguage;
	if (systemLanguage && supportedLanguagesArr.includes(systemLanguage))
		return systemLanguage;
	return 'en';
};

export {
	isAccessibilityTooltipsEnabled,
	getCurrentUser,
	getHelperContent,
	getTimeProps,
	fixLocale,
	getUserLanguage,
	resolveLanguage
};
