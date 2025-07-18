/**
 * Escapes the characters in a string for use in HTML.
 *
 * Replaces '&', '<', '>', '"', and "'" with their corresponding HTML counterparts in the input string
 * @param {string} string - The string to escape
 * @returns {string} - The escaped string
 */
export default function escape(string) {
	if (!string) return '';
	const htmlEscapes = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#39;'
	};
	const escapePattern = new RegExp(
		`[${Object.keys(htmlEscapes).join('')}]`,
		'g'
	);
	return string
		.toString()
		.replace(escapePattern, (match) => htmlEscapes[match]);
}
