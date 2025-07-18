import {partial} from '@devsnc/snowdash';
import getResolvedBindingWithState from './getResolvedBindingWithState.js';
import getEvaluatedInlineScript from './getEvaluatedInlineScript.js';
import {propertyTypes} from '../constants.js';
import basicResolvers from './basicResolvers.js';

const {RUNTIME_INLINE_SCRIPT} = propertyTypes;

export default function getResolvers(
	macroponentSysId,
	macroponentPropertyDefinitions,
	csdbNodeId,
	pdbNodeIds,
	externalControllerDependencies = [],
	proxydbNodes,
	controllerAliasMap
) {
	return {
		...basicResolvers,
		[RUNTIME_INLINE_SCRIPT]: partial(
			getEvaluatedInlineScript,
			macroponentSysId,
			null,
			macroponentPropertyDefinitions,
			csdbNodeId,
			pdbNodeIds,
			[], //TODO: Get external controller dependencies here
			proxydbNodes,
			controllerAliasMap
		),
		binding: partial(
			getResolvedBindingWithState,
			csdbNodeId,
			pdbNodeIds,
			externalControllerDependencies,
			controllerAliasMap
		)
	};
}
