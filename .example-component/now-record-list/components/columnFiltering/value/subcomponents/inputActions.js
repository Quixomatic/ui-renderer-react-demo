import {t} from 'sn-translate';

import {PROPERTIES_SET} from '../../../../constants';
import {
	COL_FILTER_INPUT_DATE_TIME_UPDATED,
	COL_FILTER_INPUT_DATE_UPDATED,
	COL_FILTER_INPUT_GENERIC_UPDATED,
	COL_FILTER_INPUT_NUMERIC_UPDATED,
	COL_FILTER_INPUT_REFERENCE_UPDATED,
	COL_FILTER_INPUT_BOOLEAN_UPDATED,
	COL_FILTER_INPUT_UPDATED,
	FIELD_TYPE_ERROR
} from '../../constants';
import {isValidDate} from '../../helpers';
import {unformatValue} from '../../localeHelper';

const genericEffectHandler = ({state, action, dispatch}) => {
	const inputValue = action.payload;
	const name = state.properties.name;
	dispatch(COL_FILTER_INPUT_UPDATED, {[name]: inputValue});
};

const numericEffectHandler = ({state, action, dispatch}) => {
	const inputValue = action.payload;
	const name = state.properties.name;
	const numericRegExp = /^[+-]?([0-9]*[.])?[0-9]*$/;

	const processedValue = unformatValue(inputValue);
	const isNumeric = !!processedValue.match(numericRegExp);

	if (isNumeric) {
		dispatch(COL_FILTER_INPUT_UPDATED, {[name]: processedValue});
	} else {
		dispatch(PROPERTIES_SET, {
			messages: [{message: t('Numeric values only'), type: FIELD_TYPE_ERROR}]
		});
	}
};

const dateEffectHandler = ({state, action, dispatch}) => {
	const inputValue = action.payload;
	const {name, dateTimeFormat} = state.properties;

	if (isValidDate(inputValue, dateTimeFormat)) {
		dispatch(COL_FILTER_INPUT_UPDATED, {[name]: inputValue});
	}
};

export default {
	[COL_FILTER_INPUT_GENERIC_UPDATED]: {
		effect: genericEffectHandler
	},
	[COL_FILTER_INPUT_NUMERIC_UPDATED]: {
		effect: numericEffectHandler
	},
	[COL_FILTER_INPUT_DATE_UPDATED]: {
		effect: dateEffectHandler
	},
	[COL_FILTER_INPUT_DATE_TIME_UPDATED]: {
		effect: dateEffectHandler
	},
	[COL_FILTER_INPUT_REFERENCE_UPDATED]: {
		effect: genericEffectHandler
	},
	[COL_FILTER_INPUT_BOOLEAN_UPDATED]: {
		effect: genericEffectHandler
	}
};
