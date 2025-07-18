/**
 * Converts a string to kebab case, i.e. all words are separated by hyphens.
 * If the input string is already in kebab case, it is returned unchanged.
 *
 * @param {string} str - The input string to convert to kebab case.
 * @returns {string} The input string converted to kebab case, or the input string itself if it is already in kebab case.
 */
export default function kebabCase(str) {
	if (!str) return '';

	return str
		.toString()
		.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
		.replace(/([a-zA-Z])(\d)/g, '$1-$2')
		.replace(/(\d)([a-zA-Z])/g, '$1-$2')
		.replace(/[^a-zA-Z0-9]+/g, '-')
		.toLowerCase()
		.replace(/(^-|-$)/g, '');
}
