const EMAIL_VALIDATION_LOCALCHARS_REGEX =
	"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%*/?|^{}`~&'+-=_.";
const EMAIL_VALIATION_DOMAIN_REGEX =
	'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.';

const containsOnlyChars = (validChars, sText) => {
	if (!sText) return true;

	for (let i = 0; i < sText.length; i++) {
		const c = sText.charAt(i);
		if (validChars.indexOf(c) === -1)
			// not a match
			return false;
	}
	return true;
};

// determine if the current character is a alpha or digit character (A-Za-z0-9)
const isAlphaNum = thchar => {
	return isAlpha(thchar) || isDigit(thchar);
};

// determine if the current character is a alpha character (A-Za-z)
const isAlpha = thchar => {
	return (
		(thchar >= 'a' && thchar <= 'z\uffff') ||
		(thchar >= 'A' && thchar <= 'Z\uffff') ||
		thchar === '_'
	);
};

// determine if the current character is a digit (0-9)
const isDigit = thchar => {
	return thchar >= '0' && thchar <= '9';
};

export function validateEmail(value) {
	const localPartChars = EMAIL_VALIDATION_LOCALCHARS_REGEX;
	const domainChars = EMAIL_VALIATION_DOMAIN_REGEX;
	if (!value) return false;
	// break into local part and domain
	if (value.indexOf('@') === -1) return false;
	const s = value.split('@');
	if (s.length != 2) return false;

	// check the local part of the address
	if (
		!containsOnlyChars(localPartChars, s[0]) ||
		s[0].length < 1 ||
		s[0].substr(0, 1) === '.' ||
		s[0].substr(s[0].length - 1, 1) === '.'
	)
		return false;

	// check the domain part of the address
	if (!containsOnlyChars(domainChars, s[1])) return false;
	const periodIndex = s[1].indexOf('.');
	if (periodIndex === -1 || periodIndex === 0) return false;

	const periods = s[1].split('.');
	const lastPeriod = periods[periods.length - 1];
	if (
		lastPeriod.length < 1 ||
		!isAlphaNum(s[1].substr(0, 1)) ||
		!isAlphaNum(s[1].substr(s[1].length - 1, 1))
	)
		return false;

	return true; // address is OK
}
