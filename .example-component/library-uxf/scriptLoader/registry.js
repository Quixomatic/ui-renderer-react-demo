import {sandboxEvaluator, compatibilityEvaluator} from './evaluator';
import getUxfSysProp from '../utils/getUxfSysProp.js';

const V1 = '1.0.0';

const Registry = new Map();
const IncludesRegistry = new Map();
const InlineScriptRegistry = new Map();
const ALLOW_COMPAT_MODE =
	getUxfSysProp(
		'glide.uxf.lib._restricted_.ux_scripts.allow_compat_mode',
		'false'
	) !== 'false';

const scriptIncludesCompatibilityModeAllowlist = [
	'sn_cwf_wrkspc.appRoutesMapping',
	'global.mergePARFilters',
	'sn_component_filte.mergePARFilters',
	'sn_vtb.notificationHandler',
	'sn_fsm_wrkspc.moment-timezone@v0.5.5',
	'sn_km_uib.Article actions include',
	'global.replaceWithTranslationBlock'
];

function getEvaluator(apiVersion) {
	if (ALLOW_COMPAT_MODE)
		return apiVersion === V1 ? compatibilityEvaluator : sandboxEvaluator;
	return sandboxEvaluator;
}

function getEvaluatorForScriptInclude(apiVersion, apiName) {
	return apiVersion === V1 &&
		scriptIncludesCompatibilityModeAllowlist.includes(apiName)
		? compatibilityEvaluator
		: sandboxEvaluator;
}

export function registerClientScript(
	apiVersion,
	scriptSysId,
	scriptIncludesApiNames,
	src
) {
	const evaluator = getEvaluator(apiVersion);
	Registry.set(scriptSysId, {
		fn: evaluator(src, scriptSysId),
		includes: scriptIncludesApiNames
	});
}

export function getClientScript(scriptSysId) {
	return Registry.get(scriptSysId);
}

export function registerClientScriptInclude(
	apiVersion,
	apiName,
	scriptIncludesApiNames,
	src
) {
	const evaluator = ALLOW_COMPAT_MODE
		? getEvaluator(apiVersion)
		: getEvaluatorForScriptInclude(apiVersion, apiName);
	IncludesRegistry.set(apiName, {
		fn: evaluator(src, apiName),
		includes: scriptIncludesApiNames
	});
}

export function getClientScriptInclude(apiName) {
	return IncludesRegistry.get(apiName);
}

function getMacroponentInlineScript(sysId, lookupPath) {
	return `${sysId}_${lookupPath}`;
}

export function registerInlineScript(
	apiVersion,
	macroponentSysId,
	lookupPath,
	src
) {
	const evaluator = getEvaluator(apiVersion);
	InlineScriptRegistry.set(
		getMacroponentInlineScript(macroponentSysId, lookupPath),
		evaluator(src, macroponentSysId)
	);
}

export function getInlineScript(macroponentSysId, lookupPath) {
	return InlineScriptRegistry.get(
		getMacroponentInlineScript(macroponentSysId, lookupPath)
	);
}
