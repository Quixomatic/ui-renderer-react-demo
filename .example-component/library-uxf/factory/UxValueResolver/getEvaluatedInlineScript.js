import {isFunction} from '@devsnc/snowdash';
import {getInlineScript} from '../../scriptLoader/registry.js';
import {isNull} from '@devsnc/snowdash';
import {t} from 'sn-translate';
import {default as console} from '../../utils/getLogger';
import getMacroponentAccessApi from '../macroponentAccessApi/getMacroponentAccessApi';
import getControllerAccessApi from '../macroponentAccessApi/getControllerAccessApi';
import getViewportApi from '../behaviorFactories/viewportRuntime/getViewportApi';
import {PRESET} from '../constants';
import {
	hasTranslation,
	getWarnMessage
} from '../../scriptedHandlerApi/apis/translate';

const runTransformFn = (macroponentSysId, lookupPath, input) => {
	const transformFn = getInlineScript(macroponentSysId, lookupPath);
	if (isFunction(transformFn)) return transformFn(input);
};

export const getHelpers = () => {
	return {
		translateSync: (str, ...rest) => {
			if (!hasTranslation(str)) {
				console.warn(getWarnMessage(str));
			}

			return t(str, ...rest);
		}
	};
};

export const getAccessApi = (
	macroponentPropertyDefinitions,
	csdbNodeId,
	pdbNodeIds,
	externalControllerDependencies,
	controllerAliasMap,
	seismicProperties,
	seismicState,
	repeaterItem = null,
	target = '',
	controllerElementId = '',
	proxydbNodes
) => {
	let api;
	let additionalProps = {};

	if (target === PRESET) {
		api = getControllerAccessApi(
			pdbNodeIds,
			externalControllerDependencies,
			controllerAliasMap,
			seismicProperties,
			controllerElementId,
			proxydbNodes
		);
	} else {
		api = getMacroponentAccessApi(
			false,
			csdbNodeId,
			pdbNodeIds,
			externalControllerDependencies,
			[],
			macroponentPropertyDefinitions,
			controllerAliasMap,
			seismicProperties,
			seismicState
		);

		additionalProps.viewports = getViewportApi(seismicState);

		if (!isNull(repeaterItem)) {
			additionalProps.item = repeaterItem;
		}
	}

	return {
		...api,
		...additionalProps
	};
};

export default function getEvaluatedInlineScript(
	macroponentSysId,
	event,
	macroponentPropertyDefinitions,
	csdbNodeId,
	pdbNodeIds,
	externalControllerDependencies,
	proxydbNodes,
	controllerAliasMap,
	seismicProperties,
	seismicState,
	lookupPath,
	repeaterItem = null,
	target = '',
	controllerElementId = ''
) {
	try {
		const api = getAccessApi(
			macroponentPropertyDefinitions,
			csdbNodeId,
			pdbNodeIds,
			externalControllerDependencies,
			controllerAliasMap,
			seismicProperties,
			seismicState,
			repeaterItem,
			target,
			controllerElementId,
			proxydbNodes
		);

		const helpers = getHelpers();

		const transformedScript = runTransformFn(macroponentSysId, lookupPath, {
			api,
			event,
			helpers
		});

		return transformedScript;
	} catch (e) {
		console.error(e);
	}
}
