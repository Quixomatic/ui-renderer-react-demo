import { createQueryFragment } from '../../tf-library-catalog-form/src/dataSource/createQueryFragment';
import {glideDataLookupQueryFragmentResponseHandler} from './responseHandlers/glideDataLookupQueryFragmentResponseHandler';
import {DATA_LOOKUPS_FRAGMENT_PREFIX} from './queryConstants';
import {DATA_LOOKUPS_CHANNEL} from './channelConstants';
import {createVariableString} from './fragmentUtils';

const GlideDataLookupQueryFragment = createQueryFragment({
	prefix: DATA_LOOKUPS_FRAGMENT_PREFIX,
	variables: [
		{
			name: 'targetTable',
			mandatory: true,
			type: 'String',
			mapTo: 'table'
		},
		{
			name: 'targetId',
			mandatory: true,
			type: 'String',
			mapTo: 'sysId'
		}
	],
	queryTemplate: (children = [], variables = []) => {
		return `
			    ${DATA_LOOKUPS_FRAGMENT_PREFIX} {
                    catalogDataLookup${createVariableString(variables)} {
                        fields {
                            field
                            definitions {
                                name
                                sysId
                            }
                        }
                    }
                }
		    `;
	},
	responseHandler: glideDataLookupQueryFragmentResponseHandler,
	channels: [DATA_LOOKUPS_CHANNEL]
});
export default GlideDataLookupQueryFragment;
