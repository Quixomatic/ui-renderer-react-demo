import {CATALOG_CLIENT_SCRIPTS_CHANNEL} from './channelConstants';
import { createQueryFragment } from '../../tf-library-catalog-form/src/dataSource/createQueryFragment';
import {CATALOG_CLIENT_SCRIPTS_FRAGMENT_PREFIX} from './queryConstants';
import {catalogClientScriptsFragmentResponseHandler} from './responseHandlers/catalogClientScriptsFragmentResponseHandler';
const CatalogClientScriptsFragment = createQueryFragment({
	prefix: CATALOG_CLIENT_SCRIPTS_FRAGMENT_PREFIX,
	variables: [],
	queryTemplate: () => {
		return `
            ${CATALOG_CLIENT_SCRIPTS_FRAGMENT_PREFIX} {
                onLoad
                onChange
                onSubmit
            }
        `;
	},
	responseHandler: catalogClientScriptsFragmentResponseHandler,
	channels: [CATALOG_CLIENT_SCRIPTS_CHANNEL],
	children: []
});
export default CatalogClientScriptsFragment;
