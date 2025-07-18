import getResolvedBindingWithState from './getResolvedBindingWithState.js';
import {propertyTypes} from '../constants.js';

const {DATA_OUTPUT_BINDING} = propertyTypes;

export default function getScreenConditionResolver(
	csdbNodeId,
	pdbNodeIds,
	externalControllerDependencies,
	controllerAliasMap
) {
	return (uxValue, seismicProperties) => {
		const {
			binding: {address = []}
		} = uxValue;

		return getResolvedBindingWithState(
			csdbNodeId,
			pdbNodeIds,
			externalControllerDependencies,
			controllerAliasMap,
			seismicProperties,
			undefined,
			DATA_OUTPUT_BINDING,
			{address}
		);
	};
}
