import { createQueryFragment } from '../../tf-library-catalog-form/src/dataSource/createQueryFragment';
import {APP_CATALOG_FRAGMENT_PREFIX} from './queryConstants';
import {APP_CATALOG_CHANNEL} from './channelConstants';
import {appCatalogFragmentResponseHandler} from './responseHandlers/appCatalogFragmentResponseHandler';
import ItemLayoutFragment from './ItemLayoutFragment';
export default createQueryFragment({
	prefix: APP_CATALOG_FRAGMENT_PREFIX,
	variables: [],
	queryTemplate: (children = []) => {
		return `
            ${APP_CATALOG_FRAGMENT_PREFIX} {
                ${children.join('\n')}
            }
        `;
	},
	responseHandler: appCatalogFragmentResponseHandler,
	channels: [APP_CATALOG_CHANNEL],
	children: [ItemLayoutFragment]
});
