import './subcomponents/input';
import '@devsnc/sn-form-controls';
import '@servicenow/now-button';
import {Fragment} from '@servicenow/ui-renderer-snabbdom';
import {t} from 'sn-translate';

import {DATE_FILTER, DATE_TIME_FILTER} from '../../../constants';
import {
	APPLY,
	CLEAR,
	COL_FILTER_SELECTED,
	FILTER_APPLY_BUTTON,
	FILTER_CLEAR_BUTTON
} from '../constants';
import {
	renderFilterDivider,
	renderGroupBy,
	renderFilterCloseButton,
	shouldRenderColumnFilter,
	shouldRenderGroupBy
} from '../helpers';

const ColumnValueFilter = (state, {dispatch}) => {
	const {
		COL_TYPE_FILTERS,
		canClear,
		hasValidInput,
		isRange,
		requiresInput,
		filterIndex,
		properties,
		properties: {
			dateTimeFormat,
			displayValue,
			inputValue1,
			inputValue2,
			operator,
			type,
			isGroupable,
			isFilterable,
			hideColumnFiltering,
			hideColumnGrouping
		}
	} = state;
	const applyBtnDisabledAttr = hasValidInput ? {} : {disabled: true};

	const renderInputs = () => {
		const filterInputTitle = t('Value');
		return (
			<Fragment>
				<sn-record-list-column-filter-value-input
					date-time-format={dateTimeFormat}
					name="inputValue1"
					type={type}
					inputValue={inputValue1}
					hasValidInput={hasValidInput}
					isRange={isRange}
					filterIndex={filterIndex}
					requiresInput={requiresInput}
					aria-labelledby="filterHeaderTitle"
					title={filterInputTitle}
				/>
				{isRange ? (
					<sn-record-list-column-filter-value-input
						date-time-format={dateTimeFormat}
						name="inputValue2"
						type={type}
						inputValue={inputValue2}
						hasValidInput={hasValidInput}
						isRange={isRange}
						filterIndex={filterIndex}
						requiresInput={requiresInput}
						aria-labelledby="filterHeaderTitle"
						title={filterInputTitle}
					/>
				) : null}
			</Fragment>
		);
	};

	const getAriaConfig = elementName => {
		return {
			'aria-label': t(
				'{0} filter {1} on column {2}',
				elementName,
				operator,
				displayValue
			)
		};
	};

	const renderFilter = () => {
		if (!shouldRenderColumnFilter(hideColumnFiltering, isFilterable))
			return null;

		const filterLabel = t('Filter');
		const filterChoiceTitle = t('Operator');
		return (
			<Fragment>
				{renderFilterDivider(
					shouldRenderGroupBy(hideColumnGrouping, isGroupable)
				)}

				<h3
					data-truncation
					className={`filter-container-filter-title header filter-text${
						isGroupable ? ' mgn-md' : ''
					}`}
					id="filterHeaderTitle">
					{filterLabel}
				</h3>
				<sn-record-choice
					className="filter-select snchoice"
					value={filterIndex}
					display-value={
						COL_TYPE_FILTERS[filterIndex].label[
							type === DATE_TIME_FILTER ? DATE_FILTER : type
						]
					}
					choices={COL_TYPE_FILTERS.map(filter => ({
						value: filter.operator,
						displayValue:
							filter.label[type === DATE_TIME_FILTER ? DATE_FILTER : type]
					}))}
					onValueChange={e => dispatch(COL_FILTER_SELECTED, e.value)}
					config-aria={{'aria-label': filterLabel}}
					aria-labelledby="filterHeaderTitle"
					title={filterChoiceTitle}
				/>
				{requiresInput ? renderInputs() : null}
				<div
					className={`filter-container-buttons filter-buttons-container ${
						requiresInput ? 'mgn-lg' : 'mgn-md'
					}`}>
					{canClear ? (
						<div className="remove-filter">
							<now-button-bare
								className="clear-button"
								config-aria={getAriaConfig(CLEAR)}
								variant="secondary"
								size="sm"
								label={CLEAR}
								component-name={FILTER_CLEAR_BUTTON}
							/>
						</div>
					) : null}
					<now-button
						className="apply-button"
						config-aria={getAriaConfig(APPLY)}
						variant="primary"
						size="sm"
						label={APPLY}
						append-to-payload={{requiresInput, isRange, filterIndex}}
						component-name={FILTER_APPLY_BUTTON}
						{...applyBtnDisabledAttr}
					/>
				</div>
			</Fragment>
		);
	};

	return (
		<div className="filter-container">
			{renderFilterCloseButton(hasValidInput)}
			{renderGroupBy(properties)}
			{renderFilter()}
		</div>
	);
};

export default ColumnValueFilter;
