import '@devsnc/sn-record-input';
import '@servicenow/now-record-date-picker';
import '@servicenow/now-record-number';

import {t} from 'sn-translate';

import {
	BOOLEAN_FILTER,
	DATE_FILTER,
	DATE_TIME_FILTER,
	GENERIC_FILTER,
	NUMERIC_FILTER,
	REFERENCE_FILTER
} from '../../../../constants';
import {
	BOOLEAN_FILTER_CHOICES,
	COL_FILTER_APPLY_BUTTON_CLICKED,
	ENTER_KEY,
	FILTER_APPLY_BUTTON,
	FILTER_VALUE
} from '../../constants';
import {getLocale} from '../../localeHelper';

const FilterInputView = ({properties}, {dispatch}) => {
	const {
		inputValue,
		type,
		dateTimeFormat,
		messages,
		isRange,
		filterIndex,
		requiresInput,
		name,
		hasValidInput
	} = properties;
	const COL_FILTER_INPUT_TYPE_UPDATED = `COL_FILTER_INPUT_${type.toUpperCase()}_UPDATED`;

	const getViewFromType = type => {
		switch (type) {
			case DATE_FILTER:
			case DATE_TIME_FILTER:
				return getDatePicker();
			case NUMERIC_FILTER:
				return getNumberInput();
			case BOOLEAN_FILTER:
				return getBooleanInput();
			case GENERIC_FILTER:
			case REFERENCE_FILTER:
				return getGenericInput();
		}
	};

	const getDatePicker = () => {
		const isDateTime = type === DATE_TIME_FILTER;
		const hasTime = isDateTime ? {hasTimePicker: true} : {};
		const label = isDateTime ? t('Pick a date and time') : t('Pick a date');

		return (
			<now-record-date-picker
				label={label}
				value={inputValue}
				format={dateTimeFormat}
				{...hasTime}
				onValueChange={e => {
					dispatch(COL_FILTER_INPUT_TYPE_UPDATED, e.value);
				}}
			/>
		);
	};

	const getNumberInput = () => {
		const userLocale = getLocale();

		return (
			<now-record-number
				initialValue={inputValue}
				onStagedValueChange={e =>
					dispatch(COL_FILTER_INPUT_TYPE_UPDATED, e.value)
				}
				messages={messages}
				locale={userLocale}
				onValueChange={e => {
					e.event.stopPropagation();
				}}
			/>
		);
	};

	const getGenericInput = () => {
		return (
			<sn-record-input
				value={inputValue}
				aria-label={FILTER_VALUE}
				onValueChange={e => {
					dispatch(COL_FILTER_INPUT_TYPE_UPDATED, e.value);
				}}
				onKeyPress={e => {
					if (e.key === ENTER_KEY && name === 'inputValue1' && hasValidInput) {
						dispatch(COL_FILTER_APPLY_BUTTON_CLICKED, {
							isRange,
							filterIndex,
							requiresInput,
							componentName: FILTER_APPLY_BUTTON
						});
						e.stopPropagation();
					}
				}}
			/>
		);
	};

	const getBooleanInput = () => {
		return (
			<sn-record-choice
				className="filter-select snchoice"
				value={inputValue}
				choices={BOOLEAN_FILTER_CHOICES}
				onValueChange={e => dispatch(COL_FILTER_INPUT_TYPE_UPDATED, e.value)}
				config-aria={{'aria-label': FILTER_VALUE}}
			/>
		);
	};

	return <div className="input-container">{getViewFromType(type)}</div>;
};

export default FilterInputView;
