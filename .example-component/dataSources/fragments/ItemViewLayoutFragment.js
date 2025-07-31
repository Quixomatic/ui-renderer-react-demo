import {createVariableString} from './fragmentUtils';
import { createQueryFragment } from '../../tf-library-catalog-form/src/dataSource/createQueryFragment';
import {ITEM_VIEW_LAYOUT_FRAGMENT_PREFIX} from './queryConstants';
import {ITEM_VIEW_LAYOUT_CHANNEL} from './channelConstants';
import {itemViewLayoutFragmentResponseHandler} from './responseHandlers/itemViewLayoutFragmentResponseHandler';
import AppCatalogFragment from './AppCatalogFragment';
import GlideClientScriptingEnvironmentFragment from './GlideClientScriptingEnvironmentFragment';
import GlideDataLookupQueryFragment from './GlideDataLookupQueryFragment';
const ItemViewLayoutFragment = createQueryFragment({
	prefix: ITEM_VIEW_LAYOUT_FRAGMENT_PREFIX,
	variables: [
		{
			name: 'sourceTable',
			mandatory: true,
			type: 'String',
			mapTo: 'table'
		},
		{
			name: 'sourceId',
			mandatory: true,
			type: 'String',
			mapTo: 'sysId'
		},
		{
			name: 'requestedFor',
			mandatory: false,
			type: 'String',
			mapTo: 'requestedFor'
		},
		{
			name: 'variablesData',
			mandatory: false,
			type: '[AppCatalog_variablesData!]',
			mapTo: 'variablesData'
		},
		{
			name: 'noGuideEvaluate',
			mandatory: false,
			type: 'Boolean',
			mapTo: 'noGuideEvaluate'
		}
	],
	queryTemplate: (children = [], variables = []) => {
		return `
			itemViewLayout${createVariableString(variables)} {
                    _query {
                        ${children.join('\n')}
                    }
                }
            `;
	},
	responseHandler: itemViewLayoutFragmentResponseHandler,
	channels: [ITEM_VIEW_LAYOUT_CHANNEL],
	children: [
		AppCatalogFragment,
		GlideClientScriptingEnvironmentFragment,
		GlideDataLookupQueryFragment
	]
});
export default ItemViewLayoutFragment;
