import {get} from '@devsnc/snowdash';
import {META_PROP_NAME_APP_CONFIG_SYS_ID} from '../factory/constants';
import {getMacroponentNodes} from './macroponent';

export default function setAppConfigToRootMacroponent(path) {
	const rootMacroponent = get(getMacroponentNodes(), [0], null);
	if (rootMacroponent) {
		rootMacroponent[META_PROP_NAME_APP_CONFIG_SYS_ID] = get(
			window,
			`ux_globals.experienceConfigs[${path}].pageSettings.sysId`,
			undefined
		);
	}
}
