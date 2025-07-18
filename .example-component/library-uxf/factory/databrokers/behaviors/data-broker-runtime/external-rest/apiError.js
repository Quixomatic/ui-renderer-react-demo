/**
 * Extends the built-in Error class to provide additional functionality
 * for handling external Data broker API-related errors.
 */
export default class ApiError extends Error {
	/**
	 * Create a new ApiError.
	 * @param {string} message - The error message.
	 * @param {number} [code=500] - The HTTP status code.
	 * @param {object|null} [errors=null] - Any additional error details.
	 * @param {Response|null} [response=null] - The fetch API Response object.
	 */
	constructor(message, code = 500, errors = null, response = null) {
		super(message);
		this.code = code;
		this.errors = errors;
		this.response = response;
	}
}
