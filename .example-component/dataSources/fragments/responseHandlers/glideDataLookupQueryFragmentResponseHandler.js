import _ from 'lodash';
export const glideDataLookupQueryFragmentResponseHandler = (data = {}) => {
	const data_lookups = _.get(data, 'catalogDataLookup.fields', []).reduce(
		(acc, lookup) => {
			acc[lookup.field] = (lookup.definitions || []).map((def) => def.sysId);
			return acc;
		},
		{}
	);
	return {
		formData: {
			data_lookups
		}
	};
};
