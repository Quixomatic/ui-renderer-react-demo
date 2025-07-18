import isEmpty from 'lodash/isEmpty';
import isUndefined from 'lodash/isUndefined';
import moment from 'moment';

import {DEFAULT_DATE_FORMAT} from '../components/columnFiltering/constants';
import {
	AFTER,
	AT_DELIMITER,
	AT_OR_AFTER,
	AT_OR_BEFORE,
	BEFORE,
	BETWEEN,
	DATE_FILTER,
	DATE_TIME_FILTER,
	ISEMPTY,
	ISNOTEMPTY,
	NOTON,
	ON,
	REQUIRES_RANGE,
	SCRIPT_DATE_GENERATE,
	SINGLE_QUOTE,
	TIME_END,
	TIME_START,
	_END,
	_START
} from '../constants';

const getDateTimeString = props => {
	const {
		type,
		field,
		operator,
		dateTimeFormat,
		inputValue1: one,
		inputValue2: two
	} = props;
	if (_validation(type, field, operator, one)) return;

	if (_isEmptyOperator(operator)) return `${field + operator}`;

	const startDate = moment(one, dateTimeFormat).format(DEFAULT_DATE_FORMAT);

	if (REQUIRES_RANGE.indexOf(operator) === -1)
		return getScript(startDate, _getWhen(type, operator));

	const endDate = moment(two, dateTimeFormat).format(DEFAULT_DATE_FORMAT);
	return _isOnOperator(operator)
		? `${startDate + AT_DELIMITER + getStartAndEnd(startDate, startDate)}`
		: getStartAndEnd(startDate, isEmpty(endDate) ? '' : endDate);
};

const getScript = (value, when) =>
	`${SCRIPT_DATE_GENERATE}('${value}', '${when}')`;

const getStartAndEnd = (valueOne, valueTwo) =>
	`${getScript(valueOne, _START) + AT_DELIMITER + getScript(valueTwo, _END)}`;

const parseDateTimeString = (
	operator,
	value,
	getValues,
	dateTimeFormatValue
) => {
	if (operator === BETWEEN) {
		const splitValues = value.split(AT_DELIMITER);
		return getValues([
			parseSingle(splitValues[0], SINGLE_QUOTE, dateTimeFormatValue),
			parseSingle(splitValues[1], SINGLE_QUOTE, dateTimeFormatValue)
		]);
	}
	return getValues([], parseSingle(value, SINGLE_QUOTE, dateTimeFormatValue));
};

const parseSingle = (value, delimiter, dateTimeFormatValue) => {
	const splitValue = value.split(delimiter);
	const dateTimeTostring = moment(splitValue[1], DEFAULT_DATE_FORMAT).format(
		dateTimeFormatValue
	);
	return isUndefined(splitValue[1]) ? undefined : dateTimeTostring;
};

const _getWhen = (type, operator) => {
	if (type === DATE_FILTER) {
		if (operator === BEFORE || operator === AT_OR_AFTER) return _START;
		if (operator === AFTER || operator === AT_OR_BEFORE) return _END;
	}
	if (type === DATE_TIME_FILTER) {
		if (operator === BEFORE || operator === AT_OR_AFTER) return TIME_START;
		if (operator === AFTER || operator === AT_OR_BEFORE) return TIME_END;
	}
};

const _isOnOperator = operator => operator === ON || operator === NOTON;

const _isEmptyOperator = operator =>
	operator === ISEMPTY || operator === ISNOTEMPTY;

const _validation = (type, field, operator, inputValue1) =>
	isEmpty(type) || isEmpty(field) || isEmpty(operator) || isEmpty(inputValue1);

export {getDateTimeString, getScript, parseDateTimeString, parseSingle};
