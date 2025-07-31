import {
	GLIDE_CLIENT_SCRIPTING_ENVIRONMENT_CLIENT_SCRIPTS_CHANNEL,
	GLIDE_CLIENT_SCRIPTING_ENVIRONMENT_CLIENT_SCRIPTS_CHANNEL_ON_LOAD,
	GLIDE_CLIENT_SCRIPTING_ENVIRONMENT_CLIENT_SCRIPTS_CHANNEL_ON_CHANGE,
	GLIDE_CLIENT_SCRIPTING_ENVIRONMENT_CLIENT_SCRIPTS_CHANNEL_ON_SUBMIT
} from '../channelConstants';
import {convertToMap} from '../fragmentUtils';
export const glideClientScriptingEnvironmentClientScriptsFragmentResponseHandler = async (
	response = {},
	channelService
) => {
	const {onLoad = [], onChange = [], onSubmit = []} = response;
	const channel = channelService.publish(
		GLIDE_CLIENT_SCRIPTING_ENVIRONMENT_CLIENT_SCRIPTS_CHANNEL
	);
	channel(
		GLIDE_CLIENT_SCRIPTING_ENVIRONMENT_CLIENT_SCRIPTS_CHANNEL_ON_LOAD,
		convertToMap(onLoad)
	);
	channel(
		GLIDE_CLIENT_SCRIPTING_ENVIRONMENT_CLIENT_SCRIPTS_CHANNEL_ON_CHANGE,
		convertToMap(onChange)
	);
	channel(
		GLIDE_CLIENT_SCRIPTING_ENVIRONMENT_CLIENT_SCRIPTS_CHANNEL_ON_SUBMIT,
		convertToMap(onSubmit)
	);
	return {};
};
