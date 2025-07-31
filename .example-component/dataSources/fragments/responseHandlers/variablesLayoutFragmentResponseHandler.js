import {
	VARIABLES_LAYOUT_CHANNEL,
	VARIABLES_LAYOUT_CHANNEL_VARIABLES_LAYOUT_PROVIDER,
} from '../channelConstants';
import * as formViewDataConstants from '../../../tf-library-catalog-form/src/environment/formViewDataConstants';

export const variablesLayoutFragmentResponseHandler = async (response = [], channelService = {}) => {
	channelService.publish(VARIABLES_LAYOUT_CHANNEL)(
		VARIABLES_LAYOUT_CHANNEL_VARIABLES_LAYOUT_PROVIDER,
		response
	);
	return {
		formData: {
			[formViewDataConstants.VARIABLES_LAYOUT]: response,
		},
	};
};
