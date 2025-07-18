import {getControllerDataWrapper} from './getControllerDataWrapper';
import {getSessionWrapper} from './getContextWrapper';
import {default as console} from '../../utils/getLogger';

import {
	CONTEXT_PROPS_IDENTIFIER,
	APP_PROPS_IDENTIFIER,
	ELEMENTS_IDENTIFIER,
	STATE_IDENTIFIER
} from '../constants';

const unsupportedApiMessage = (fieldName) => {
	return new Proxy(
		{},
		{
			get(_, propName) {
				const prop =
					typeof propName === 'string' ? ` '${String(propName)}' ` : ' ';
				console.warn(
					`Prop${prop}will not resolve as 'api.${fieldName}' is not supported in component preset client transform scripts`
				);
			}
		}
	);
};

export default function getControllerAccessApi(
	pdbNodeIds,
	externalControllerDependencies,
	controllerAliasMap,
	seismicProperties,
	controllerElementId,
	proxydbNodes
) {
	return {
		context: {
			props: unsupportedApiMessage(CONTEXT_PROPS_IDENTIFIER),
			app: unsupportedApiMessage(APP_PROPS_IDENTIFIER),
			session: getSessionWrapper(seismicProperties)
		},
		elements: unsupportedApiMessage(ELEMENTS_IDENTIFIER),
		data: getControllerDataWrapper(
			pdbNodeIds,
			externalControllerDependencies,
			seismicProperties,
			controllerElementId,
			proxydbNodes,
			controllerAliasMap
		),
		state: unsupportedApiMessage(STATE_IDENTIFIER)
	};
}
