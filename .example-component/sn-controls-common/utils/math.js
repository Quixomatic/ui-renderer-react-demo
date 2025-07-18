/**
 * Cycles the elements in an array
 *
 * e.g.:
 * cycle([0, 1, 2, 3], 2) => [2, 3, 0, 1]
 */
export function cycle(array, n) {
	if (!Array.isArray(array)) {
		return [];
	}

	if (n === 0 || n === array.length) {
		return array;
	}

	const startingPoint = -n % array.length;

	return array.slice(startingPoint).concat(array.slice(0, startingPoint));
}

/**
 * Real modulo operation `%` is just a remainder operator
 * and does weird things with negative values
 */
export function mod(n, m) {
	return ((n % m) + m) % m;
}
