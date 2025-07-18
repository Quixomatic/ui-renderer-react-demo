import '@servicenow/now-text-link';
import {Fragment} from '@servicenow/ui-renderer-snabbdom';
import {t} from 'sn-translate';

import {OPEN_PANEL} from '../../../constants';
import {
	renderFilterDivider,
	renderFilterCloseButton,
	renderGroupBy,
	shouldRenderColumnFilter,
	shouldRenderGroupBy
} from '../helpers';

const AdvancedChoiceFilter = ({properties}) => {
	const {
		displayValue,
		isFilterable,
		isGroupable,
		hideColumnFiltering,
		hideColumnGrouping,
		parsedQueryCount
	} = properties;

	const extraPayload = {actionName: OPEN_PANEL};

	return (
		<div className="filter-container">
			{renderFilterCloseButton()}
			{renderGroupBy(properties)}
			{shouldRenderColumnFilter(hideColumnFiltering, isFilterable) ? (
				<Fragment>
					{renderFilterDivider(
						shouldRenderGroupBy(hideColumnGrouping, isGroupable)
					)}
					<h3
						data-truncation
						className={`filter-container-filter-title header filter-text${
							isGroupable ? ' mgn-md' : ''
						}`}>
						{t('Filter')}
					</h3>
					<div
						data-truncation
						className="filter-container-filter-text filter-text advanced">
						{!parsedQueryCount
							? t('Use Advanced Filters to filter by {0}.', displayValue)
							: t('Advanced filters applied.')}
					</div>
					<now-text-link
						data-truncation
						href="javascript:void(0)"
						label={t('Make changes')}
						variant="primary"
						append-to-payload={extraPayload}
					/>
				</Fragment>
			) : null}
		</div>
	);
};

export default AdvancedChoiceFilter;
