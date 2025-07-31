import { createQueryFragment } from '../../tf-library-catalog-form/src/dataSource/createQueryFragment';
import {appCatalogViewFragmentResponseHandler} from './responseHandlers/appCatalogViewFragmentResponseHandler';
import {APP_CATALOG_VIEW_FRAGMENT_PREFIX} from './queryConstants';
import {APP_CATALOG_VIEW_CHANNEL} from './channelConstants';
import ItemViewLayoutFragment from './ItemViewLayoutFragment';

export default createQueryFragment({
	prefix: APP_CATALOG_VIEW_FRAGMENT_PREFIX,
	variables: [],
	queryTemplate: (children = []) => {
		return `
                ${APP_CATALOG_VIEW_FRAGMENT_PREFIX} {
                    ${children.join('\n')}
                }
            `;
	},
	responseHandler: appCatalogViewFragmentResponseHandler,
	channels: [APP_CATALOG_VIEW_CHANNEL],
	children: [ItemViewLayoutFragment]
});
