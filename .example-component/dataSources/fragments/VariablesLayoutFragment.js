import { createQueryFragment } from '../../tf-library-catalog-form/src/dataSource/createQueryFragment';
import {variablesLayoutFragmentResponseHandler} from './responseHandlers/variablesLayoutFragmentResponseHandler';
import {VARIABLES_LAYOUT_FRAGMENT_PREFIX} from './queryConstants';
import {VARIABLES_LAYOUT_CHANNEL} from './channelConstants';

export default createQueryFragment({
	prefix: VARIABLES_LAYOUT_FRAGMENT_PREFIX,
	variables: [],
	queryTemplate: () => {
		return `
                ${VARIABLES_LAYOUT_FRAGMENT_PREFIX} {
                    name
                    type
                    parent
                    ... on AppCatalog_ContainerVariableFieldLayoutType {
                    caption
                    captionDisplay
                    layout
                    columns {
                        fields {
                            name
                            type
                        }
                    }
                    }
                    ... on AppCatalog_VariableFieldLayoutType {
                        name
                        type
                        parent
                    }
                }
            `;
	},
	responseHandler: variablesLayoutFragmentResponseHandler,
	channels: [VARIABLES_LAYOUT_CHANNEL],
	children: []
});
