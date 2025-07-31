import { createQueryFragment } from '../../tf-library-catalog-form/src/dataSource/createQueryFragment';
import { VARIABLES_VALUES_CHANNEL } from './channelConstants';
import { VARIABLES_VALUES_FRAGMENT_PREFIX } from './queryConstants';
import { variablesValuesFragmentResponseHandler } from './responseHandlers/variablesValuesFragmentResponseHandler';

const VariablesValuesFragment = createQueryFragment({
	prefix: VARIABLES_VALUES_FRAGMENT_PREFIX,
	variables: [],
	queryTemplate: () => {
		return `
				${VARIABLES_VALUES_FRAGMENT_PREFIX} {
					name
					value
					displayValue
					valuesList {
						value
						displayValue
					}
				}
            `;
	},
	responseHandler: variablesValuesFragmentResponseHandler,
	channels: [VARIABLES_VALUES_CHANNEL],
	children: []
});
export default VariablesValuesFragment;
