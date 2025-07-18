import resolveWith from './resolveWith.js';
import getResolvers from './getResolvers.js';

export default function resolveForActionPayload(
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
	repeaterItem
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
