import {
	GLIDE_CLIENT_SCRIPTING_ENVIRONMENT_CLIENT_SCRIPTS_CHANNEL,
	GLIDE_CLIENT_SCRIPTING_ENVIRONMENT_CLIENT_SCRIPTS_CHANNEL_ON_LOAD,
	GLIDE_CLIENT_SCRIPTING_ENVIRONMENT_CLIENT_SCRIPTS_CHANNEL_ON_CHANGE,
	GLIDE_CLIENT_SCRIPTING_ENVIRONMENT_CLIENT_SCRIPTS_CHANNEL_ON_SUBMIT,
} from '../channelConstants';
import * as formViewDataConstants from '../../../tf-library-catalog-form/src/environment/formViewDataConstants';

export const catalogClientScriptsFragmentResponseHandler = async (response = {}, channelService = {}) => {
	const { onLoad = [], onChange = [], onSubmit = [] } = response;
	const csProvider = channelService.listen(GLIDE_CLIENT_SCRIPTING_ENVIRONMENT_CLIENT_SCRIPTS_CHANNEL);
	const [onLoadMap = {}, onChangeMap = {}, onSubmitMap = {}] = await Promise.all([
		csProvider(GLIDE_CLIENT_SCRIPTING_ENVIRONMENT_CLIENT_SCRIPTS_CHANNEL_ON_LOAD),
		csProvider(GLIDE_CLIENT_SCRIPTING_ENVIRONMENT_CLIENT_SCRIPTS_CHANNEL_ON_CHANGE),
		csProvider(GLIDE_CLIENT_SCRIPTING_ENVIRONMENT_CLIENT_SCRIPTS_CHANNEL_ON_SUBMIT),
	]);
	return {
		formData: {
			[formViewDataConstants.CLIENT_SCRIPTS]: {
				onLoad: onLoad.map((id) => onLoadMap[id]),
				onChange: onChange.map((id) => onChangeMap[id]),
				onSubmit: onSubmit.map((id) => onSubmitMap[id]),
			},
		},
	};
};
