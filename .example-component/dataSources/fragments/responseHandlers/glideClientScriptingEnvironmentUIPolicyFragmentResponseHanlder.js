import {
	GLIDE_CLIENT_SCRIPTING_ENVIRONMENT_UI_POLICY_CHANNEL,
	GLIDE_CLIENT_SCRIPTING_ENVIRONMENT_UI_POLICY_CHANNEL_ALL_POLICIES
} from '../channelConstants';
import _ from 'lodash';
import {convertToMap} from '../fragmentUtils';
function convertFields(o) {
	let result = {};
	_.forEach(o, (val, key) => {
		result[_.snakeCase(key)] = val;
	});
	delete result.typename;
	return result;
}

function parseGraphQLPolicyActions(actions) {
	let results = [];
	_.forEach(actions, (action) => {
		if (action.name !== null) {
			let result = convertFields(action);
			results.push(result);
		}
	});
	return results;
}

function parseGraphQLPolicyConditions(conditions) {
	let results = [];
	_.forEach(conditions, (condition) => {
		let result = convertFields(condition);
		// Remap some field values
		result.pre_evaluated_term = String(result.pre_evaluated_term) === 'true';
		result.pre_evaluated_term_result =
			String(result.pre_evaluated_term_result) === 'true';

		// ignore endquery for now
		if (result.term !== 'EQ') {
			results.push(result);
		}
	});
	return results;
}

function parseGraphQLPolicy(policy) {
	let result = convertFields(policy);
	result.actions = parseGraphQLPolicyActions(policy.actions);
	result.conditions = parseGraphQLPolicyConditions(policy.conditions);
	result.onload = result.on_load;
	result.script_true = policy.scriptTrue;
	result.script_false = policy.scriptFalse;
	result.pre_evaluated = false;
	result.table = "(catalog)";
	return result;
}
export const glideClientScriptingEnvironmentUIPolicyFragmentResponseHanlder = async (
	uiPolicies = [],
	channelService
) => {
	if (!Array.isArray(uiPolicies)) {
		uiPolicies = [];
	}
	let results = [];
	_.forEach(uiPolicies, (policy) => {
		results.push(parseGraphQLPolicy(policy));
	});
	const channel = channelService.publish(
		GLIDE_CLIENT_SCRIPTING_ENVIRONMENT_UI_POLICY_CHANNEL
	);
	channel(
		GLIDE_CLIENT_SCRIPTING_ENVIRONMENT_UI_POLICY_CHANNEL_ALL_POLICIES,
		convertToMap(results, 'sys_id')
	);
	return {};
};
