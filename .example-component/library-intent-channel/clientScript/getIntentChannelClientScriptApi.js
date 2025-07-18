export const LIBRARY_INTENT_CHANNEL_PACKAGE_NAME = 'sn_uxf.uiIntentLib';

import {getNowAssistApiWrapper} from './getNowAssistApiWrapper';

export function getIntentChannelClientScriptApi(macroponentProperties) {
	return () => ({
		nowAssist: getNowAssistApiWrapper(macroponentProperties)
	});
}
