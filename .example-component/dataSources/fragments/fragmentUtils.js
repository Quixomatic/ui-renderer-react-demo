import {t} from 'sn-translate';
export const createVariableString = (variables = []) => {
	if (!variables || variables.length === 0) {
		return '';
	}
	const variablesString = variables
		.map(({name = '', mapTo = ''}) => {
			mapTo = mapTo || name;
			return `${name}: $${mapTo}`;
		})
		.join(', ');
	return `(${variablesString})`;
};

export const convertToMap = (items = [], key = 'sysId') =>
	items.reduce((prev, item) => ({...prev, [item[key]]: item}), {});

export function isAttrTrue(val) {
	return val === true || val === 'true';
}
export const getActionLabelBasedOnRequestMethod = (
	requestMethod = '',
	type = 'catalog_item'
) => {
	if (type !== 'record_producer') {
		if (requestMethod === 'request') {
			return t('Request');
		} else if (requestMethod === 'submit') {
			return t('Submit');
		} else {
			return t('Order Now');
		}
	}
	return t('Submit');;
};
