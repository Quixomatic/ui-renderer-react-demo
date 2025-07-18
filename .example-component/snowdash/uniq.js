/**
 * This method returns an array with unique elements
 * @param array - An array which is the input to the uniq() function. It can be List or null or undefined
 * @returns {Array} - The modified destination object
 */
export default function uniq(array) {
	if (!Array.isArray(array)) {
		throw new Error('uniq: expects an array as input');
	}
	return [...new Set(array)];
}
