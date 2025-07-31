import {
	GLIDE_CLIENT_SCRIPTING_ENVIRONMENT_UI_POLICY_CHANNEL,
	GLIDE_CLIENT_SCRIPTING_ENVIRONMENT_UI_POLICY_CHANNEL_ALL_POLICIES,
} from '../channelConstants';
import * as formViewDataConstants from '../../../tf-library-catalog-form/src/environment/formViewDataConstants';

export const catalogUIPoliciesFragmentResponseHandler = async (policies = [], channelService = {}) => {
	if (!Array.isArray(policies)) {
		policies = [];
	}
	const uiPolicyProvider = channelService.listen(GLIDE_CLIENT_SCRIPTING_ENVIRONMENT_UI_POLICY_CHANNEL);
	const allPolicies = await uiPolicyProvider(
		GLIDE_CLIENT_SCRIPTING_ENVIRONMENT_UI_POLICY_CHANNEL_ALL_POLICIES
	);
	return {
		formData: {
			[formViewDataConstants.UI_POLICIES]: policies.map((id) => allPolicies[id]),
		},
	};
};
