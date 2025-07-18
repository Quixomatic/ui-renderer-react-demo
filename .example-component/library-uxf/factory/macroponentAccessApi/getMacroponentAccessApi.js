import getContextWrapper from './getContextWrapper';
import getDataWrapper from './getDataWrapper';
import getStateWrapper from './getStateWrapper';
import getElementsWrapper from './getElementsWrapper';

import {mapValues} from '@devsnc/snowdash';

export default function getMacroponentAccessApi(
	withOperations,
	csdbNodeId,
	pdbNodeIds,
	externalControllerDependencyNames,
	externalControllerDependencies,
	macroponentPropertyDefinitions,
	controllerAliasMap,
	seismicProperties,
	seismicState,
	dataBrokerDefinitionIdByElementId,
	dataBrokerOperationFunctions,
	uxfEmitFn
) {
	const macroponentProperties = mapValues(
		macroponentPropertyDefinitions,
		() => undefined
	);
	const elementsWrapper = getElementsWrapper(seismicProperties);
	return {
		context: getContextWrapper(seismicProperties, macroponentProperties),
		elements: elementsWrapper,
		data: getDataWrapper(
			withOperations,
			csdbNodeId,
			pdbNodeIds,
			externalControllerDependencyNames,
			externalControllerDependencies,
			controllerAliasMap,
			seismicProperties,
			elementsWrapper,
			uxfEmitFn,
			dataBrokerDefinitionIdByElementId,
			dataBrokerOperationFunctions
		),
		state: getStateWrapper(seismicState)
	};
}
