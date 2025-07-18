/**
 * Converts a string to `snake_case` format.
 * If the input string is already in `snake_case` format, returns it as-is.
 *
 * @param {string} str - The input string to convert.
 * @returns {string} The input string in `snake_case` format.
 */
export default function snakeCase(str) {
	if (!str) return '';

	return str
		.toString()
		.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
		.replace(/([a-zA-Z])(\d)/g, '$1-$2')
		.replace(/(\d)([a-zA-Z])/g, '$1-$2')
		.replace(/[^a-zA-Z0-9]+/g, '_')
		.toLowerCase()
		.replace(/(^_|_$)/g, '');
}
