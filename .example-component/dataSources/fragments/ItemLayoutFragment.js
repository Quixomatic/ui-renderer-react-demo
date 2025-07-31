import { createQueryFragment } from '../../tf-library-catalog-form/src/dataSource/createQueryFragment';
import {ITEM_LAYOUT_FRAGMENT_PREFIX} from './queryConstants';
import {ITEM_LAYOUT_CHANNEL} from './channelConstants';
import {itemLayoutFragmentResponseHandler} from './responseHandlers/itemLayoutFragmentResponseHandler';
import {createVariableString} from './fragmentUtils';
import PricingFragment from './PricingFragment';
import VariablesLayoutFragment from './VariablesLayoutFragment';
import VariablesFragment from './VariablesFragment';
import VariablesValuesFragment from './VariablesValuesFragment';
import CatalogClientScriptsFragment from './CatalogClientScriptsFragment';
import CatalogUIPoliciesFragment from './CatalogUIPoliciesFragment';
export default createQueryFragment({
	prefix: ITEM_LAYOUT_FRAGMENT_PREFIX,
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
		}
	],
	queryTemplate: (children = [], variables = []) => {
		return `
            ${ITEM_LAYOUT_FRAGMENT_PREFIX}${createVariableString(variables)} {
				__typename
                name
                shortDescription
                description
                sysId
				picture
				requestMethod
				mandatoryAttachment
				hideQuantity
				hideAttachment
				hideDeliveryTime
				deliveryAddress
				quantity {
					label
					value
				}
				type
				targetRecordTable
				targetRecordSysId
                ${children.join('\n')}
            }
        `;
	},
	responseHandler: itemLayoutFragmentResponseHandler,
	channels: [ITEM_LAYOUT_CHANNEL],
	children: [
		PricingFragment,
		VariablesLayoutFragment,
		VariablesValuesFragment,
		VariablesFragment,
		CatalogClientScriptsFragment,
		CatalogUIPoliciesFragment
	]
});
