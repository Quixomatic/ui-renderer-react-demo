import './subcomponents/input';
import '@servicenow/now-button';
import {t} from 'sn-translate';

import {
	APPLY,
	CLEAR,
	FILTER_APPLY_BUTTON,
	FILTER_CLEAR_BUTTON
} from '../constants';

const ColumnSearchFilter = state => {
	const {
		canClear,
		hasValidInput,
		properties: {
			displayValue,
			inputValue,
			isGroupable,
			isFilterable,
			hideColumnFiltering
		}
	} = state;

	if (!isFilterable || hideColumnFiltering) return null;

	const clearBtnDisabledAttr = canClear ? {} : {disabled: true};
	const applyBtnDisabledAttr = hasValidInput ? {} : {disabled: true};

	const getAriaConfig = elementName => {
		return {
			'aria-label': t('{0} filter on column {1}', elementName, displayValue)
		};
	};

	const renderInput = () => {
		return (
			<sn-record-list-column-filter-search-input
				name="inputValue"
				inputValue={inputValue}
			/>
		);
	};

	const renderButtons = () => {
		return (
			<div className={`filter-container-buttons filter-buttons-container`}>
				<now-button
					className="clear-button"
					config-aria={getAriaConfig(CLEAR)}
					variant="secondary"
					size="sm"
					label={CLEAR}
					component-name={FILTER_CLEAR_BUTTON}
					{...clearBtnDisabledAttr}
				/>
				<now-button
					className="apply-button"
					config-aria={getAriaConfig(APPLY)}
					variant="primary"
					size="sm"
					label={APPLY}
					component-name={FILTER_APPLY_BUTTON}
					{...applyBtnDisabledAttr}
				/>
			</div>
		);
	};

	return (
		<div className="filter-container">
			<div
				data-truncation
				className={`filter-container-filter-title header filter-text${
					isGroupable ? ' mgn-md' : ''
				}`}>
				{t('Filter')}
			</div>
			{renderInput()}
			{renderButtons()}
		</div>
	);
};

export default ColumnSearchFilter;
