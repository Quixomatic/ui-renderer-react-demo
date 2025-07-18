import {renderTemplate} from '@servicenow/now-grid';
import difference from 'lodash/difference';

import {renderSelectAllCell} from '../../gridSelectAllStatusBar/gridSelectAllStatusBar';
import {
	OPTIONS_PATH,
	rowSelectionSelectors
} from '../rowSelection/rowSelection';
export const renderHeaderRow = context => {
	const {dispatch} = context;
	const head = [renderCell(context)];
	const allRecordsSelected = rowSelectionSelectors.getAllRecordsSelected(
		context.properties,
		OPTIONS_PATH
	);
	const selRecords = rowSelectionSelectors.getSelectedRecords(
		context.properties,
		OPTIONS_PATH
	);
	const allSysIdsOnPage = rowSelectionSelectors.getAllSysIdsOnPage(
		context.properties,
		OPTIONS_PATH
	);
	const hideSelectAll = rowSelectionSelectors.getHideSelectAll(
		context.properties,
		OPTIONS_PATH
	);
	const recordCount = rowSelectionSelectors.getRecordCount(
		context.properties,
		OPTIONS_PATH
	);
	const exceptedRecords = rowSelectionSelectors.getExceptedRecords(
		context.properties,
		OPTIONS_PATH
	);

	const selectedRecords = Object.keys(selRecords);
	const allSelectedOnPage =
		allRecordsSelected ||
		(selectedRecords.length > 0 &&
			difference(allSysIdsOnPage, selectedRecords).length === 0);
	const hasSelectAllStatusBar =
		allSelectedOnPage && !hideSelectAll && recordCount > allSysIdsOnPage.length;
	//second row to be added for select all.
	if (hasSelectAllStatusBar) {
		head.push(
			<tr
				role="row"
				className="sn_grid_header_select_all_status_bar_row"
				aria-live="polite">
				{renderSelectAllCell(
					selectedRecords,
					exceptedRecords,
					recordCount,
					allRecordsSelected,
					dispatch
				)}
			</tr>
		);
	}

	return head;
};

const renderCell = context => {
	const {templates, columns} = context;
	return (
		<tr>
			{columns.map((column, columnIndex) => {
				return renderTemplate('headCell', templates, {
					...context,
					column,
					columnIndex
				});
			})}
		</tr>
	);
};
