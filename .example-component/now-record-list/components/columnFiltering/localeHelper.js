import {getProperty, preUserData} from 'sn-uxpage-presource';

const getLocaleFromUser = () => {
	const user = preUserData.initialState || {};
	if (!user) return null;
	const language = user.language;
	const country = user.country;
	if (!language || !country) {
		return null;
	}
	return `${language}-${country}`;
};

const getLocaleFromSysProp = () => {
	let sysLocale = getProperty(`glide.system.locale`);
	if (!sysLocale || typeof sysLocale !== 'string') return null;
	const localeStrArr = sysLocale.split('.');
	if (localeStrArr.length !== 2) return null;
	return `${localeStrArr[0]}-${localeStrArr[1]}`;
};

const getBrowserLocale = () => {
	return window?.navigator?.language || null;
};

const isValidLocale = locale => {
	let length;
	try {
		length = Intl.NumberFormat.supportedLocalesOf([locale]).length;
	} catch (err) {
		return false;
	}
	return length > 0;
};

const getLocale = () => {
	const locale =
		getLocaleFromUser() || getLocaleFromSysProp() || getBrowserLocale();
	return isValidLocale(locale) ? locale : 'en-US';
};

// Convert if any persian/arabic number chars present in the given number string
const parseArabicAndPersianNums = value => {
	if (typeof value !== 'string') return value;

	return (
		value
			// Convert Arabic numbers
			.replace(/[\u0660-\u0669]/g, d => d.charCodeAt(0) - 1632)
			// Convert Persian numbers
			.replace(/[\u06F0-\u06F9]/g, d => d.charCodeAt(0) - 1776)
	);
};

const parseSeparator = (regex, replacement) => {
	return value =>
		typeof value === 'string' ? value.replace(regex, replacement) : value;
};

const unformatValue = value => {
	if (!value) return '';

	const locale = getLocale();
	// Fetching thousand and decimal separator characters of given locale
	const numWithThousands = new Intl.NumberFormat(locale).format('1111');
	const numWithFractions = new Intl.NumberFormat(locale).format('1.11');

	const thousandSeparator =
		numWithThousands.length === 4 ? '' : numWithThousands.slice(1, 2);
	const decimalSeparator = numWithFractions.slice(1, 2);

	let sanitizers = [];
	// Sanitize if any arabic/persian characters present in the given number string
	sanitizers.push(parseArabicAndPersianNums);

	// Sanitize thousand separator with '' character
	thousandSeparator &&
		sanitizers.push(
			parseSeparator(new RegExp(`\\${thousandSeparator}`, 'g'), '')
		);

	// Sanitize decimal separator with '.' character
	decimalSeparator &&
		sanitizers.push(
			parseSeparator(new RegExp(`\\${decimalSeparator}`, 'g'), '.')
		);

	// Sanitize if any spaces present
	sanitizers.push(parseSeparator(/[\s\u00A0]/g, ''));

	// Processing all the sanitizers by applying one by one
	const processedValue = sanitizers.reduce(
		(sanatizedValue, sanitizer) => sanitizer(sanatizedValue),
		value
	);
	return Number.isNaN(processedValue) ? ' ' : processedValue;
};
/* Todo => It will be nice to export these unformatValue related functions from
           controls-mono repo instead of writing here again for cleaner way */
export {getLocale, unformatValue};
