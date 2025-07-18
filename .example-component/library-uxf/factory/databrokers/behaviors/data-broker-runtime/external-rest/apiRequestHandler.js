import {buildAttributes} from './attributeResolver';
import {buildOutputResult} from './outputResultBuilder';
import {dispatchInternalAction} from '../../../../getInternalEffect';
import {handleApiError} from './apiErrorHandler';
import {computeHash, fetchFromCache, storeInCache} from './apiCache';

/**
 * Makes an API request and dispatches actions based on the request's outcome.
 *
 * @async
 * @param {object} externalRESTDataBroker - Data broker for external REST API.
 * @param {object} resolvedHeaders - Resolved headers for the API request.
 * @param {object} resolvedInputValues - Resolved input values for endpoint and body.
 * @param {Function} dispatch - Dispatch function for Redux actions.
 * @param {string} startActionType - Action type for start of API call.
 * @param {string} successActionType - Action type for successful API call.
 * @param {string} errorActionType - Action type for failed API call.
 * @param {string} pipelineSysId - Data broker SysId.
 * @param {string} pipelineId - Element Id of the data broker.
 * @param {string} origin - Origin of the API request.
 * @returns {Promise<void>} - Promise representing the API request.
 */
export const makeApiRequest = async (
	externalRESTDataBroker,
	resolvedHeaders,
	resolvedInputValues,
	dispatch,
	startActionType,
	successActionType,
	errorActionType,
	pipelineSysId,
	pipelineId,
	origin
) => {
	const {
		definitionAttributes: {
			httpmethod: method,
			endpoint,
			requestBody,
			parameters
		},
		cachePolicy
	} = externalRESTDataBroker;

	// Default values in absence of cachePolicy
	const isCacheActive = cachePolicy?.active || false;
	const policy = cachePolicy?.policy || null;
	const ttl = cachePolicy?.ttl || null;

	const resolvedEndpoint = buildAttributes(
		endpoint,
		parameters,
		resolvedInputValues
	);
	const resolvedRequestBody = buildAttributes(
		requestBody,
		parameters,
		resolvedInputValues
	);

	const configOptions = {
		method: method,
		...(Object.keys(resolvedHeaders || {}).length > 0 && {
			headers: resolvedHeaders
		}),
		...(method !== 'GET' && resolvedRequestBody && {body: resolvedRequestBody})
	};

	const startTime = performance.now();
	dispatchInternalAction(dispatch, startActionType);

	// Concatenate resolvedEndpoint and computed hash to generate a unique cache key.
	const cacheKey = `${resolvedEndpoint}:${computeHash(externalRESTDataBroker)}`;

	try {
		let executionResult = null;

		// Fetch from cache if the cache policy is active and set to CACHE_ONLY.
		if (isCacheActive && policy === 'CACHE_ONLY') {
			executionResult = await fetchFromCache(cacheKey, ttl);
		}

		if (!executionResult) {
			const response = await fetch(resolvedEndpoint, configOptions);
			const endTime = performance.now();
			const executionTime = endTime - startTime;

			if (response.ok) {
				executionResult = await response.json();
				dispatchInternalAction(
					dispatch,
					successActionType,
					{
						result: buildOutputResult(
							pipelineSysId,
							[],
							executionResult,
							response.status,
							executionTime
						)
					},
					{pipelineId, origin}
				);

				// Store in cache if the cache policy is active.
				if (isCacheActive) {
					await storeInCache(
						cacheKey,
						pipelineSysId,
						executionResult,
						ttl,
						cacheKey
					);
				}
			} else {
				await handleApiError(
					response,
					pipelineId,
					resolvedEndpoint,
					pipelineSysId,
					executionTime
				);
			}
		}
	} catch (e) {
		dispatchInternalAction(
			dispatch,
			errorActionType,
			{pipelineResults: e.errors},
			{pipelineId, origin}
		);
	}
};
