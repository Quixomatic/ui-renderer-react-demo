import utc from 'dayjs/plugin/utc';
import relativeTime from 'dayjs/plugin/relativeTime';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import advanceFormat from 'dayjs/plugin/advancedFormat';
import timezone from 'dayjs/plugin/timezone';
import localizedFormat from 'dayjs/plugin/localizedFormat';

export const registerPlugins = (dayjs) => {
	/**
	 * Register plugin modules to add new features
	 * Complete list of dayjs plugins:  https://day.js.org/docs/en/plugin/plugin
	 */
	dayjs.extend(utc);
	dayjs.extend(timezone);
	dayjs.extend(relativeTime);
	dayjs.extend(advanceFormat);
	dayjs.extend(customParseFormat);
	dayjs.extend(localizedFormat);
};
