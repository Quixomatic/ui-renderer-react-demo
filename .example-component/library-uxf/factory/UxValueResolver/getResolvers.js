import {partial} from '@devsnc/snowdash';
import getResolvedBindingWithState from './getResolvedBindingWithState.js';
import getEvaluatedInlineScript from './getEvaluatedInlineScript.js';
import getResolvedPayloadBinding from './getResolvedPayloadBinding.js';
import {propertyTypes} from '../constants.js';
import {isObject} from '@devsnc/snowdash';
import basicResolvers from './basicResolvers.js';

const {EVENT_PAYLOAD_BINDING, RUNTIME_INLINE_SCRIPT} = propertyTypes;

export default function getResolvers(
	macroponentSysId,
	macroponentPropertyDefinitions,
	csdbNodeId,
	pdbNodeIds,
	externalControllerDependencies,
	proxydbNodes,
	controllerAliasMap,
	seismicProperties,
	seismicState,
	sourceAction
) {
	return {
		...basicResolvers,
		[RUNTIME_INLINE_SCRIPT]: partial(
			getEvaluatedInlineScript,
			macroponentSysId,
			sourceAction,
			macroponentPropertyDefinitions,
			csdbNodeId,
			pdbNodeIds,
			externalControllerDependencies,
			proxydbNodes,
			controllerAliasMap,
			seismicProperties,
			seismicState
		),
		binding: partial(
			getResolvedBindingWithState,
			csdbNodeId,
			pdbNodeIds,
			externalControllerDependencies,
			controllerAliasMap,
			seismicProperties,
			seismicState
		),
		...(isObject(sourceAction)
			? {
					[EVENT_PAYLOAD_BINDING]: partial(
						getResolvedPayloadBinding,
						sourceAction.payload
					)
			  }
			: {})
	};
}
