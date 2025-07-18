/*
 * View Adapter connecting UI Builder stage to UX Framework renderer
 */
const macroponenViewAdapters = new Map();

/**
 * sets the adapterMap with UXF macroponent's view renderer
 * @param {string} macroponentId : sys_id of macroponent record
 * @param {Function} viewAdapterFn : adapter function connecting to macroponent view
 * @return void
 */
export const setMacroponentViewAdapter = (macroponentId, viewAdapterFn) => {
	macroponenViewAdapters.set(macroponentId, viewAdapterFn);
};

/**
 * gets the view adapter function for a given macroponent to the other party (e.g. UI Builder)
 * @param {string} macroponentId : sys_id of macroponent record
 * @return {Function} adapter function connecting to macroponent view. The function takes in following arguments
 * @argument rootNode { import("../types/generatedTypescript/UxFrameworkTypes").RTMacroponent }
 * @argument descendants { {[index: string]: import("../types/generatedTypescript/UxFrameworkTypes").RTMacroponent[]} }
 *
 */
export const getMacroponentViewAdapter = (macroponentId) =>
	macroponenViewAdapters.get(macroponentId);
