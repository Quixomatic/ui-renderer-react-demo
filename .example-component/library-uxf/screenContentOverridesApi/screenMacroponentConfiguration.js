const screenMacroponentConfigOverrides = new Map();

/**
 * loads the overridden macroponentConfiguration of screen and test values corresponding to inline macroponent
 * @param {string} macroponentSysId : sys_id of the macroponent for which macroponentConfiguration need to load
 * @param {object} macroponentConfiguration : object (key/uxValue pair) consisting overridden macroponentConfiguration and UIB test values for url params from inline_macroponent_driver API
 * @return void
 */
export const loadOverriddenMacroponentConfiguration = (
	macroponentSysId,
	macroponentConfiguration
) => {
	screenMacroponentConfigOverrides.set(
		macroponentSysId,
		macroponentConfiguration
	);
};

export const getMacroponentConfigurationOverrides = (macroponentSysId) =>
	screenMacroponentConfigOverrides.get(macroponentSysId) || [];
