import {buildOutputResult} from './outputResultBuilder';
import ApiError from './apiError';

/**
 * Attempts to extract and return JSON from a response object.
 * @async
 * @param {Response} response - The external data broker API Response object.
 * @returns {Promise<object|null>} - Returns the extracted JSON or null.
 */
async function extractAdditionalInfo(response) {
	let additionalInfo = null;
	if (response) {
		try {
			additionalInfo = await response.json();
		} catch (jsonError) {
			console.error('Error parsing JSON from response:', jsonError);
		}
	}
	return additionalInfo;
}

/**
 * Handles an API error by extracting information from the API response,
 * constructing an error message, and throwing a custom ApiError.
 *
 * @param {Object} response - The API response object.
 * @param {string} pipelineId - The element ID of the data broker.
 * @param {string} resolvedEndpoint - The API endpoint that was called.
 * @param {string} pipelineSysId - Data broker sysId.
 * @param {number} executionTime - The execution time.
 */
export async function handleApiError(
	response,
	pipelineId,
	resolvedEndpoint,
	pipelineSysId,
	executionTime
) {
	const errorMsg = `Failed to fetch data for pipelineId: ${pipelineId} with endpoint: ${resolvedEndpoint}`;
	let additionalInfo = await extractAdditionalInfo(response);

	const errorOutputResult = buildOutputResult(
		pipelineSysId,
		[
			{
				status: response.status,
				success: response.ok,
				statusText: response.statusText,
				additionalInfo
			}
		],
		[],
		response.status,
		executionTime
	);

	throw new ApiError(errorMsg, response.status, errorOutputResult, response);
}
