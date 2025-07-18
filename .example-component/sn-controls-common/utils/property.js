import { getProperty as presourceGetProperty } from 'sn-uxpage-presource';

export const getProperty = (key, defaultValue) => {
	const sysPropValue = presourceGetProperty(key);
	if (
		defaultValue !== undefined &&
		(sysPropValue === undefined || sysPropValue === null)
	) {
		return defaultValue;
	} else {
		return sysPropValue;
	}
};
