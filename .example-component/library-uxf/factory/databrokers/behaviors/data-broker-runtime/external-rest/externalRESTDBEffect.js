import {resolveAttributesUxValue} from './attributeResolver';
import {makeApiRequest} from './apiRequestHandler';
import getResolversForView from '../../../../UxValueResolver/getResolversForView';

/**
 * Calls the external API based on the given options and coeffects.
 *
 * @param {object} options - Options for controlling the API call's flow.
 * @param {object} coeffects - Coeffects for managing state, properties, action, and dispatch.
 * @async
 * @function
 */
async function callExternalApiEffect(options, coeffects) {
	const {startActionType, successActionType, errorActionType} = options;
	const {
		state,
		properties,
		action: {payload, meta},
		dispatch
	} = coeffects;
	const {
		pipelineId,
		origin,
		pipelineSysId,
		pipelineResolverDependencies: {
			mcpSysId,
			csdbNodeId,
			pdbNodeIds,
			proxyDataBrokerNodes,
			externalControllerDependencies,
			controllerAliasMap
		}
	} = meta;

	const externalRESTDataBroker = payload.data.find(
		(data) => data.definitionSysId === pipelineSysId
	);
	const {inputValues = {}, headers = {}} = externalRESTDataBroker;

	const resolversForExternalRESTAttributes = getResolversForView(
		mcpSysId,
		properties,
		csdbNodeId,
		pdbNodeIds,
		externalControllerDependencies,
		proxyDataBrokerNodes,
		controllerAliasMap
	);

	const resolvedInputValues = resolveAttributesUxValue(
		{...inputValues},
		resolversForExternalRESTAttributes,
		properties,
		state
	);
	const resolvedHeaders = resolveAttributesUxValue(
		{headers},
		resolversForExternalRESTAttributes,
		properties,
		state
	);

	await makeApiRequest(
		externalRESTDataBroker,
		{...resolvedHeaders['headers']},
		{...resolvedInputValues},
		dispatch,
		startActionType,
		successActionType,
		errorActionType,
		pipelineSysId,
		pipelineId,
		origin
	);
}

/**
 * Function with effect and args based on options.
 *
 * @param {object} options - Options for controlling the API call's flow.
 * @returns {object} - Object with effect function and args array.
 */
export default function externalRESTDBEffect(options) {
	return {
		effect: callExternalApiEffect,
		args: [options]
	};
}
