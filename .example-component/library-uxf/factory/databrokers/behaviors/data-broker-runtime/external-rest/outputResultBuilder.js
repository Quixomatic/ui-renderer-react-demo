/**
 * Constructs the output result object based on the provided parameters.
 *
 * @param {string} pipelineSysId - Data broker SysId.
 * @param {Array} [errors=[]] - Array of error objects.
 * @param {Array} [result=[]] - Array of result objects.
 * @param {number} [status=200] - HTTP status code (optional, default is 200).
 * @param {number} [executionTime=0] - Execution time in milliseconds.
 * @returns {Array} - Array containing the constructed output result object.
 */
export const buildOutputResult = (
	pipelineSysId,
	errors = [],
	result = [],
	status = 200,
	executionTime = 0
) => [
	{
		errors,
		executionResult: {output: result},
		executionTime,
		parentResourceId: null,
		status: status,
		sysId: pipelineSysId
	}
];
