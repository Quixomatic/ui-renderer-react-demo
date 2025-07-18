import {getClientScriptInclude} from '../../../scriptLoader/registry';
import {default as console} from '../../../utils/getLogger';
import {partial} from '@devsnc/snowdash';
import {getThirdPartyAPIs} from '../../thirdpartyLibs';
import {
	LIBRARY_INTENT_CHANNEL_PACKAGE_NAME,
	getIntentChannelClientScriptApi
} from '@devsnc/library-intent-channel';

const createImportsProxyHandlers = (macroponentProperties) => ({
	get(includesObj, apiName) {
		if (apiName === 'sn_uxf.core_libraries') return getThirdPartyAPIs;
		else if (apiName === LIBRARY_INTENT_CHANNEL_PACKAGE_NAME)
			return getIntentChannelClientScriptApi(macroponentProperties);
		if (!(apiName in includesObj))
			throw Error(
				`Attempted to import undeclared client script include: ${apiName}`
			);

		const scriptInclude = getClientScriptInclude(apiName);
		if (!scriptInclude)
			throw Error(`Unable to load client script include: ${apiName}`);

		const {fn, includes: includeApiNames} = scriptInclude;

		const scriptIncludeApi = {
			imports: getImports(macroponentProperties, includeApiNames)
		};

		return partial(fn, scriptIncludeApi);
	},

	set() {
		console.error('Operation not allowed');
	}
});

export default function getImports(macroponentProperties, includes) {
	const includesObj = includes.reduce(
		(obj, include) => {
			obj[include] = true;
			return obj;
		},
		{'sn_uxf.core_libraries': true},
		{[LIBRARY_INTENT_CHANNEL_PACKAGE_NAME]: true}
	);

	return new Proxy(
		includesObj,
		createImportsProxyHandlers(macroponentProperties)
	);
}
