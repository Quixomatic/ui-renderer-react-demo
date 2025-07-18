import '@servicenow/now-text-link';
import isEmpty from 'lodash/isEmpty';
import {t} from 'sn-translate';

import {LIST_SELECTION_RESET, SELECT_ALL_RECORDS} from '../../constants';

export const renderSelectAllCell = (
	selectedRecords = [],
	exceptedRecords = [],
	recordCount,
	allRecordsSelected,
	dispatch
) => {
	return allRecordsSelected ? (
		<th colSpan={99} className="sn_grid_header_select_all_status_bar_row">
			<div className="sn_grid_header_select_all_status_bar_container">
				<div className="sn_grid_header_select_all_status_bar_text">
					{isEmpty(exceptedRecords)
						? t('All {0} item(s) in this list are selected.', recordCount)
						: t(
								'{0} item(s) in this list are selected.',
								recordCount - exceptedRecords.length
						  )}
					&nbsp;
					<now-text-link
						href="javascript:void(0)"
						label={t('Clear selection')}
						on-click={() => {
							dispatch(SELECT_ALL_RECORDS, LIST_SELECTION_RESET);
						}}></now-text-link>
				</div>
			</div>
		</th>
	) : (
		<th colSpan={99} className="sn_grid_header_select_all_status_bar_row">
			<div className="sn_grid_header_select_all_status_bar_container">
				<div className="sn_grid_header_select_all_status_bar_text">
					{t('{0} item(s) are selected.', selectedRecords.length)}&nbsp;
					<now-text-link
						href="javascript:void(0)"
						label={t('Select all {0} item(s) in this list', recordCount)}
						on-click={() => {
							dispatch(SELECT_ALL_RECORDS, {
								...LIST_SELECTION_RESET,
								allRecordsSelected: true,
								selectionCount: recordCount
							});
						}}></now-text-link>
				</div>
			</div>
		</th>
	);
};
