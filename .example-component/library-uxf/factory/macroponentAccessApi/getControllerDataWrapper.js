import getResolvedBindingWithState from '../UxValueResolver/getResolvedBindingWithState';
import {default as console} from '../../utils/getLogger';
import {propertyTypes} from '../constants.js';

const {DATA_OUTPUT_BINDING} = propertyTypes;

export const getControllerDataWrapper = (
	pdbNodeIds,
	externalControllerDependencies,
	seismicProperties,
	controllerElementId,
	proxydbNodes,
	controllerAliasMap
) => {
	return new Proxy(
		{},
		{
			get(_, dataOutputProp) {
				if (!controllerElementId) {
					console.error(
						`Prop 'api.data.${dataOutputProp}' in client transform script cannot be resolved because the controllerElementId prop ` +
							'is missing from the preset in the page definition composition.'
					);
					return;
				}

				//check for dependency controller
				const dependencyElementId = proxydbNodes?.filter(
					(db) => db.nodeId === controllerElementId
				)?.[0]?.dependencies?.[dataOutputProp]?.controllerElementId;
				if (dependencyElementId) {
					return getControllerDataWrapper(
						pdbNodeIds,
						externalControllerDependencies,
						seismicProperties,
						dependencyElementId,
						[] //only support one level dependency
					);
				}

				return getResolvedBindingWithState(
					null,
					pdbNodeIds,
					externalControllerDependencies,
					controllerAliasMap,
					seismicProperties,
					null,
					DATA_OUTPUT_BINDING,
					{address: [controllerElementId, dataOutputProp]}
				);
			}
		}
	);
};
