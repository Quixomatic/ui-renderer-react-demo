import {has} from '@devsnc/snowdash';
import {get} from '@devsnc/snowdash';
import {default as console} from '../../utils/getLogger.js';
import {META_PROP_NAME_APP_CONFIG_SYS_ID} from '../constants.js';
import {
	EXPERIENCE_IDS_BY_APP_CONFIG_SYS_IDS,
	getPagePropertiesForApp
} from '../../templateLoader/utils.js';
import {getMacroponentNodes} from '../../utils/macroponent';

const getPropsWrapper = (stateProperties, macroponentProperties) =>
	new Proxy(macroponentProperties, {
		get(target, property) {
			if (has(target, [property])) return get(stateProperties, [property]);
			console.warn(`Invalid property access for ${property}`);
		}
	});

export const getSessionWrapper = (stateProperties) =>
	get(stateProperties, ['userSessionInfo', 'output']);

const nowAppProps = getPagePropertiesForApp();

/**
 * getNowAppProps: Returns application properties for an experience.
 * @param stateProperties
 * @returns {{[p: string]: *}|*}
 */
const getNowAppProps = (stateProperties) => {
	const rootMacroponent = get(getMacroponentNodes(), [0], null);
	const nowUxfAppConfigSysId = rootMacroponent
		? rootMacroponent[META_PROP_NAME_APP_CONFIG_SYS_ID]
		: null;
	if (nowUxfAppConfigSysId) {
		const experienceId =
			EXPERIENCE_IDS_BY_APP_CONFIG_SYS_IDS[nowUxfAppConfigSysId];
		const appProps = {...nowAppProps(experienceId)};
		return appProps;
	}
	return get(stateProperties, ['nowAppProps']);
};

export default function getContextWrapper(
	stateProperties,
	macroponentProperties
) {
	return {
		props: getPropsWrapper(stateProperties, macroponentProperties),
		app: getNowAppProps(stateProperties),
		session: getSessionWrapper(stateProperties)
	};
}
