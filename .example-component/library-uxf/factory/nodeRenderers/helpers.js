import {getUxGlobal} from '../../templateLoader/utils';
import {META_PROP_NAME_APP_CONFIG_SYS_ID} from '../../factory/constants';

// object keys
const EXPERIENCE_CONFIGS_KEY = 'experienceConfigs';
const PAGE_PROPERTIES_KEY = 'pageProperties';

/**
 * Get app props from a viewport for a given experience ID
 *
 * @param {string} experienceId
 * @returns {object}
 */
export const getNowAppPropsForViewportRenderer = (experienceId) => {
	const experienceConfigs = getUxGlobal(EXPERIENCE_CONFIGS_KEY, {});
	const experienceConfigsObject = Object.keys(experienceConfigs).reduce(
		(acc, path) => {
			const configKey = experienceConfigs[path].experienceId;
			acc[configKey] =
				experienceConfigs[path][PAGE_PROPERTIES_KEY] || experienceId;
			return acc;
		},
		{}
	);
	const pagePropertiesForApp = Object.freeze(experienceConfigsObject);
	return (
		pagePropertiesForApp[experienceId] ?? getUxGlobal(PAGE_PROPERTIES_KEY, {})
	);
};

export const getExperienceName = (properties) => {
	const nowUxfAppConfigSysId = properties[META_PROP_NAME_APP_CONFIG_SYS_ID];
	const experienceConfigs = getUxGlobal(EXPERIENCE_CONFIGS_KEY) || {};
	const experienceObject = Object.values(experienceConfigs).filter(
		(config) =>
			config.pageSettings?.sysId === nowUxfAppConfigSysId ||
			config.appConfigId === nowUxfAppConfigSysId
	)[0];

	return experienceObject?.experienceName || '';
};
