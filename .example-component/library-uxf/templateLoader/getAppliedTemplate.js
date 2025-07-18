import getTemplates from './getTemplates';
import {find} from '@devsnc/snowdash';
import {isEmpty} from '@devsnc/snowdash';
import {set} from '@devsnc/snowdash';
import {isEqual} from '@devsnc/snowdash';
import {
	getUxGlobal,
	deepFreeze,
	getPagePropertiesForApp,
	getObjectWithoutUxfProps
} from './utils';
import {META_PROP_NAME_APP_CONFIG_SYS_ID} from '../factory/constants.js';
import {getMacroponentConfigurationOverrides} from '../screenContentOverridesApi/screenMacroponentConfiguration';

const preloadedAppliedPageFragments = getUxGlobal('appliedPageFragments', []);

const getEvaluatedDataBrokers = (
	preloadedAppliedPageFragment,
	inputPropValues
) => {
	const {propValues, evaluatedDataBrokers} = preloadedAppliedPageFragment;
	// fixme: add a TTL param to evaluatedDataBrokers. if expired, ignore it
	const nonUxfPropValues = getObjectWithoutUxfProps(inputPropValues);
	return isEqual(propValues, nonUxfPropValues) ? evaluatedDataBrokers : '{}';
};

const userSessionInfo = getUxGlobal('session', '{}');
const nowAppProps = getPagePropertiesForApp();
const nowSysProps = getUxGlobal('sysprops', '{}');

function getPageRegistryToAppConfigSysIdMap(experienceConfigs) {
	return Object.values(experienceConfigs)
		.map(({experienceId, pageSettings, appConfigId}) => [
			experienceId,
			pageSettings?.sysId || appConfigId
		])
		.reduce((acc, [key, value]) => {
			acc[key] = value;
			return acc;
		}, {});
}

const APP_CONFIG_SYS_IDS_BY_PAGE_REGISTRY_SYS_IDS =
	getPageRegistryToAppConfigSysIdMap(getUxGlobal('experienceConfigs', {}));

/**
 * Gets the template macroponent
 * @param {string} macroponentSysId - The id of macroponent being requested
 * @param {Object} inputPropValues - The props key/val pair to be applied to fetched macroponent
 * @param {string} pageRegistrySysId - Optional, sys_ux_page_registry sys_id of the experience , this macroponent being requested belongs to
 * @returns the template macroponent
 */
export default async function getAppliedTemplate(
	macroponentSysId,
	inputPropValues,
	pageRegistrySysId = ''
) {
	// Telemetry marker boundary for beforeLoad and afterLoad.
	const currTime = window.performance.now();
	const timing_data = {
		time: currTime,
		macroponentSysId
	};
	set(window, ['uxf_timing', 'applied_template'], timing_data);

	const inputPropValuesOverrides =
		getMacroponentConfigurationOverrides(macroponentSysId);
	const inputPropVals =
		Object.keys(inputPropValuesOverrides).length > 0
			? inputPropValuesOverrides
			: inputPropValues;

	//fixme: ideally do this on the java side to freeze the ux global and not the session object here
	deepFreeze(userSessionInfo);
	const preloadedAppliedPageFragment = find(preloadedAppliedPageFragments, [
		'pageFragmentSysId',
		macroponentSysId
	]);
	const appIdProp = pageRegistrySysId ? {appId: pageRegistrySysId} : null;
	const propValues = {
		...inputPropVals,
		userSessionInfo,
		nowAppProps: {...nowAppProps(pageRegistrySysId), ...appIdProp},
		nowSysProps,
		[META_PROP_NAME_APP_CONFIG_SYS_ID]:
			APP_CONFIG_SYS_IDS_BY_PAGE_REGISTRY_SYS_IDS[pageRegistrySysId]
	};

	if (!isEmpty(preloadedAppliedPageFragment)) {
		const {dependentPageFragmentSysIds} = preloadedAppliedPageFragment;

		const fragmentGenerators = await getTemplates([
			macroponentSysId,
			...dependentPageFragmentSysIds
		]);

		// Only pass input prop values to getEvaluatedDataBrokers() to avoid unnecessary data refreshes.
		return fragmentGenerators[macroponentSysId]({
			...propValues,
			evaluatedDataBrokers: getEvaluatedDataBrokers(
				preloadedAppliedPageFragment,
				inputPropVals
			)
		});
	}

	const fragmentGenerators = await getTemplates([macroponentSysId]);
	return fragmentGenerators[macroponentSysId](propValues);
}
