import resolveWith from './resolveWith.js';
import getResolvers from './getResolvers.js';

export default function resolveForConditional(
	macroponentSysId,
	macroponentPropertyDefinitions,
	csdbNodeId,
	pdbNodeIds,
	externalControllerDependencies,
	proxydbNodes,
	controllerAliasMap,
	seismicProperties,
	seismicState,
	sourceAction,
	uxValue,
	repeaterItem = null
) {
	return resolveWith(
		getResolvers(
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
		),
		uxValue,
		repeaterItem
	);
}
