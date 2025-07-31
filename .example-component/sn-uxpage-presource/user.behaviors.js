import get from "lodash/get";
import {
	createPreSourceBehavior,
	getBehaviorProp
} from "./createPreSourceBehavior";

const USER_DATA_KEY = "wsUserData";
const USER_ROLES_KEY = "agentRoles";
const USER_PREF_KEY = "wsUserDataPreferences";
const WS_CONFIG_SYS_ID_KEY = "wsConfigSysId";

export const preUserData = createPreSourceBehavior("sn-workspace-header", {
	name: USER_DATA_KEY,
	transform: data => get(data, "data.GlideDomain_Query.user", {})
});

export const preUserRoles = createPreSourceBehavior("sn-workspace-content", {
	name: USER_ROLES_KEY,
	transform: result => get(result, "data.GlideDomain_Query.user.roles", [])
});

export const preWsConfigSysId = createPreSourceBehavior("sn-workspace-header", {
	name: WS_CONFIG_SYS_ID_KEY,
	transform: data =>
		get(
			data,
			[
				"data",
				"GlideRecord_Query",
				"sys_aw_master_config",
				"_results",
				0,
				"sys_id",
				"value"
			],
			""
		)
});

export const preUserPrefs = (function(userData) {
	return {
		name: USER_PREF_KEY,
		initialState: userData.initialState.preferences || []
	};
})(preUserData);
