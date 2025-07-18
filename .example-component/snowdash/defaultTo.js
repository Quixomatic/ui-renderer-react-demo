/**
 * Checks if a value is null, undefined, or NaN, and returns a default value if it is.
 *
 * @param {*} value - The value to check.
 * @param {*} defaultValue - The default value to return if `value` is null, undefined, or NaN.
 * @returns {*} The original value if it is not null, undefined, or NaN, or `defaultValue` otherwise.
 */
export default function defaultTo(value, defaultValue) {
	return value != null && value === value ? value : defaultValue;
}
