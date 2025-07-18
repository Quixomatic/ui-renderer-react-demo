import moment from 'moment';

// wrapper around moment to force need for language when using
// empty string defaults to moment global locale
export default (language = '') =>
	(...args) => {
		moment.locale(language);
		return moment(...args);
	};

export const weekdays = (language = '', isoWeek = false) => {
	const momentLocale = moment.localeData(language);
	if (isoWeek)
		return momentLocale ? momentLocale.isoWeekdays() : moment.isoWeekdays();
	return momentLocale ? momentLocale.weekdays() : moment.weekdays();
};

export const monthsShort = (language = '') => {
	const momentLocale = moment.localeData(language);
	return momentLocale ? momentLocale.monthsShort() : moment.monthsShort();
};

export const isTimeZoneEnabledField = format => {
	if (!format) return false;
	return !format.toLowerCase().endsWith('z');
};
