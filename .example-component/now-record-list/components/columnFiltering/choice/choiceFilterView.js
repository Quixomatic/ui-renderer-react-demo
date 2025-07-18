import '../../listbox/listbox';
import './subcomponents/input';
import '@servicenow/now-button';
import '@servicenow/now-loader';
import {Fragment} from '@servicenow/ui-renderer-snabbdom';
import isEmpty from 'lodash/isEmpty';
import {t} from 'sn-translate';

import {
	APPLY,
	CLEAR,
	FILTER_APPLY_BUTTON,
	FILTER_CLEAR_BUTTON,
	FILTER_SELECT_ALL_BUTTON,
	FILTER_SELECT_NONE_BUTTON,
	MIN_CHOICES_FOR_CHOICE_FILTERING
} from '../constants';
import {
	renderFilterDivider,
	renderGroupBy,
	renderFilterCloseButton,
	shouldRenderColumnFilter,
	shouldRenderGroupBy
} from '../helpers';

const ColumnChoiceFilter = state => {
	const {
		defaultSelected,
		initialChoices,
		inputValue,
		originalSelected,
		filteredChoices,
		properties: {
			loading,
			comparisonMap,
			displayValue,
			isGroupable,
			isFilterable,
			hideColumnFiltering,
			hideColumnGrouping,
			selectedChoices
		}
	} = state;
	const isChoiceFilterDirty =
		originalSelected !== [...selectedChoices].sort().join();
	const applyBtnDisabledAttr =
		selectedChoices.length === 0 || !isChoiceFilterDirty
			? {disabled: true}
			: {};

	const availableChoices =
		!inputValue || inputValue.length === 0 ? initialChoices : filteredChoices;

	const getButtonAriaConfig = elementName => {
		return {
			'aria-label': t('{0} filter on column {1}', elementName, displayValue)
		};
	};

	const selectAllLabel = t('All');
	const selectNoneLabel = t('None');
	const listboxLabel = t('Choices for {0}', displayValue);

	const selectAriaConfig = {
		'aria-controls': 'choicebox'
	};

	const listBoxProps = {
		choices: availableChoices,
		selectedChoices:
			isEmpty(comparisonMap) && !isChoiceFilterDirty
				? defaultSelected
				: selectedChoices,
		highlightValue: inputValue,
		label: listboxLabel
	};

	const shouldRenderFilter = shouldRenderColumnFilter(
		hideColumnFiltering,
		isFilterable
	);

	const renderFilterHeader = shouldRenderFilter ? (
		<Fragment>
			{renderFilterDivider(
				shouldRenderGroupBy(hideColumnGrouping, isGroupable)
			)}
			<h3
				data-truncation
				className={`filter-container-filter-title header filter-text${
					isGroupable ? ' mgn-md' : ''
				}`}
				id="choiceFilterTitle">
				{t('Filter')}
			</h3>
		</Fragment>
	) : null;

	const renderLoader = loading ? (
		<div className="choice-loader">
			<now-loader size={'lg'} />
		</div>
	) : null;

	return (
		<div className="filter-container">
			{renderFilterCloseButton(isChoiceFilterDirty)}
			{renderGroupBy(state.properties)}
			{renderFilterHeader}
			{renderLoader}
			{shouldRenderFilter ? (
				<Fragment>
					{initialChoices &&
					initialChoices.length >= MIN_CHOICES_FOR_CHOICE_FILTERING ? (
						<sn-record-list-column-filter-choice-input
							name="inputValue"
							inputValue={inputValue}
							aria-labelledby="choiceFilterTitle"
						/>
					) : null}
					<div className="select-links">
						<span>{t('Select')}</span>
						<now-button-bare
							config-aria={{...selectAriaConfig, 'aria-label': selectAllLabel}}
							variant="secondary"
							size="sm"
							label={selectAllLabel}
							component-name={FILTER_SELECT_ALL_BUTTON}
							aria-labelledby="choiceFilterTitle"
						/>
						<span className="horizontal-separator">｜</span>
						<now-button-bare
							config-aria={{...selectAriaConfig, 'aria-label': selectNoneLabel}}
							variant="secondary"
							size="sm"
							label={selectNoneLabel}
							component-name={FILTER_SELECT_NONE_BUTTON}
							aria-labelledby="choiceFilterTitle"
						/>
					</div>
					<sn-record-list-column-filter-choice-listbox
						{...listBoxProps}
						aria-labelledby="choiceFilterTitle"
					/>
					<div className={`filter-container-buttons filter-buttons-container`}>
						{!isEmpty(comparisonMap) ? (
							<div className="remove-filter">
								<now-button-bare
									className="clear-button"
									config-aria={getButtonAriaConfig(CLEAR)}
									variant="secondary"
									size="sm"
									label={CLEAR}
									component-name={FILTER_CLEAR_BUTTON}
								/>
							</div>
						) : null}
						<now-button
							className="apply-button"
							config-aria={getButtonAriaConfig(APPLY)}
							variant="primary"
							size="sm"
							label={APPLY}
							component-name={FILTER_APPLY_BUTTON}
							{...applyBtnDisabledAttr}
						/>
					</div>
				</Fragment>
			) : null}
		</div>
	);
};

export default ColumnChoiceFilter;
