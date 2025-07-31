import {t} from 'sn-translate';
const PRICE_LABEL = t('Price');
export const pricingFragmentResponseHandler = async (response = {}) => {
	const {
		price,
		recurringPrice,
		displayPrice,
		recurringDisplayPrice,
		recurringFrequency,
		recurringFrequencyDisplay,
		showPrices = false
	} = response;
	const priceDetails = {
		label: PRICE_LABEL,
		price: price > 0 ? displayPrice : '',
		recurringPrice:
			recurringPrice >= 0 && recurringFrequency
				? recurringDisplayPrice + ' ' + recurringFrequencyDisplay
				: '',
		visible: showPrices
	};
	return {
		priceDetails
	};
};
