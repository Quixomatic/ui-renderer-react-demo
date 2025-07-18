const screenEventMappingsOverrides = new Map();
/**
 * loads the overridden rtEventMappings of screen corresponding to inline macroponent
 * @param {string} screenId : sys_id of screen record
 * @param {Array} eventMappings : list consisting overridden rtEventMappings
 * @return void
 */
export const loadOverriddenScreenEventMappings = (screenId, eventMappings) => {
	screenEventMappingsOverrides.set(screenId, eventMappings);
};

export const getEventMappingOverrides = (screenId) =>
	screenEventMappingsOverrides.get(screenId) || [];
