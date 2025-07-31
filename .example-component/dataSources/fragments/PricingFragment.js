import { createQueryFragment } from '../../tf-library-catalog-form/src/dataSource/createQueryFragment';
import { pricingFragmentResponseHandler } from './responseHandlers/pricingFragmentResponseHandler';
import { PRICING_FRAGMENT_PREFIX } from './queryConstants';
import { PRICING_CHANNEL } from './channelConstants';

export default createQueryFragment({
	prefix: PRICING_FRAGMENT_PREFIX,
	variables: [],
	queryTemplate: () => {
		return `
                ${PRICING_FRAGMENT_PREFIX} {
                    price
                    displayPrice
                    recurringPrice
                    recurringDisplayPrice
                    recurringFrequencyDisplay
                    recurringFrequency
                    showPrices
                    currencyCode
                    currencySymbol
                }
            `;
	},
	responseHandler: pricingFragmentResponseHandler,
	channels: [PRICING_CHANNEL],
	children: []
});
