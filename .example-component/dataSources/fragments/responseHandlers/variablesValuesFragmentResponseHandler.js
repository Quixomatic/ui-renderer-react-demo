import { VARIABLES_VALUES_CHANNEL, VARIABLES_VALUES_CHANNEL_VARIABLE_VALUES_PROVIDER } from '../channelConstants';

export const variablesValuesFragmentResponseHandler = async (
	response = [],
	channelService = {}
) => {
	if (!Array.isArray(response)) {
		response = [];
	}
	const variablesValues = response;
	const mappedValues = variablesValues.reduce((acc, current) => {
		/** For multi value fields like glide_list */
		if (current.valuesList.length) {
			current.display_value_list = [];
			current.valuesList.forEach(item => {
				current.display_value_list.push(item.displayValue);
			});
		} else {
			current.valuesList = [];
			current.display_value_list = [];
		}
		return {
			...acc,
			[current.name]: current
		};
	}, {});
	channelService.publish(VARIABLES_VALUES_CHANNEL)(
		VARIABLES_VALUES_CHANNEL_VARIABLE_VALUES_PROVIDER,
		mappedValues
	);
	return {
		variablesValues
	};
};
