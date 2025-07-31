import {isAttrTrue, getActionLabelBasedOnRequestMethod} from '../fragmentUtils';
import {t} from 'sn-translate';
const CATALOG_ITEM = 'catalog_item';
const SC_CART_ITEM = 'sc_cart_item';
const QUANTITY_LABEL = t('Quantity');
const CHOICE = 'choice';
export const itemLayoutFragmentResponseHandler = async (response = {}) => {
	const {
		name,
		shortDescription,
		description,
		sysId,
		picture,
		requestMethod,
		mandatoryAttachment = false,
		hideAttachment = false,
		hideQuantity = false,
		hideDeliveryTime = false,
		quantity: quantityChoices = [],
		targetRecordTable = SC_CART_ITEM,
		targetRecordSysId = '',
		type = CATALOG_ITEM,
		deliveryAddress = ''
	} = response;
	const hidePicture = picture ? false : true;
	const catalogItemDetails = {
		name,
		shortDescription,
		description,
		sysId,
		picture,
		hidePicture,
		requestMethod,
		hideDeliveryTime,
		type
	};
	const targetRecord = {
		table: targetRecordTable,
		sysId: targetRecordSysId
	};
	const attachmentDetails = {
		mandatory: isAttrTrue(mandatoryAttachment),
		value: [],
		hideattachment: isAttrTrue(hideAttachment),
		disabled: false
	};
	const actionDetails = {
		label: getActionLabelBasedOnRequestMethod(requestMethod, type),
		disabled: false
	};
	const quantityValue =
		quantityChoices.length > 0 ? quantityChoices[0].value : 1;
	const quantityDetails = {
		label: QUANTITY_LABEL,
		value: quantityValue,
		items: quantityChoices.map(({value, label: displayValue}) => ({
			value,
			displayValue
		})),
		visible: !(isAttrTrue(hideQuantity) || type !== CATALOG_ITEM)
	};
	const deliveryInformation = {
		value: deliveryAddress,
		hidden: type !== CATALOG_ITEM
	};
	const specialInstructions = {
		value: '',
		hidden: type !== CATALOG_ITEM
	};
	return {
		actionDetails,
		attachmentDetails,
		catalogItemDetails,
		quantityDetails,
		targetRecord,
		deliveryInformation,
		specialInstructions
	};
};
