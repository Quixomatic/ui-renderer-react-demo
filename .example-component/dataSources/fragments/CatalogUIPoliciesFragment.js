export const CATALOG_UI_POLICIES_CHANNEL = 'CatalogUIPolicies';
import { catalogUIPoliciesFragmentResponseHandler } from './responseHandlers/catalogUIPoliciesFragmentResponseHandler';
import { createQueryFragment } from '../../tf-library-catalog-form/src/dataSource/createQueryFragment';
const CatalogUIPoliciesFragment = createQueryFragment({
	prefix: 'catalogUIPolicies',
	variables: [],
	queryTemplate: () => {
		return `
			catalogUIPolicies
        `;
	},
	responseHandler:  catalogUIPoliciesFragmentResponseHandler,
	channels: [CATALOG_UI_POLICIES_CHANNEL],
	children: []
});
export default CatalogUIPoliciesFragment;
