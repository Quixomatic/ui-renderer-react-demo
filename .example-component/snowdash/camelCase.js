/**
 * Converts a string to camel case.
 *
 * This function converts the input string to camel case by removing any non-word characters
 * and capitalizing the first ltetter of each word, except for the first word which
 * is always lowercase. The resulting string has no spaces or punctuation and the first letter
 * is always lowercase.
 *
 * @param {string} str - The string to convert to camel case.
 * @returns {string} - The converted string in camel case.
 */
export default function camelCase(str) {
	if (!str) str = '';
	if (typeof str != 'string') str = str.toString();

	if (str.search(/[^a-zA-Z0-9]/) > -1) {
		str = str.toLowerCase();
	} else if (str && str[0] == str[0].toUpperCase()) {
		str = str[0].toLowerCase() + str.slice(1);
	}

	const camelCaseStr = str
		.replace(/[\W_]+(.|$)/g, (_m, p1) => p1.toUpperCase())
		.replace(/([0-9]+)([a-z])/g, (_m, p1, p2) => p1 + p2.toUpperCase());

	return camelCaseStr.charAt(0).toLowerCase() + camelCaseStr.slice(1);
}
