import '../checkbox/checkbox';
import '@servicenow/now-button';
import get from 'lodash/get';
import {t} from 'sn-translate';

import {BUTTON_GROUP_ALL_TOGGLE, SN_GRID_CHECKBOX_ALL} from '../../constants';
import {renderHeaderRowCell} from '../gridHeaderRowCell/gridHeaderRowCell';
import {renderSelectAllCell} from '../gridSelectAllStatusBar/gridSelectAllStatusBar';

import {checkIfFiltered} from './gridHeaderHelper';

const renderGridHeaderRowCell = ({
	column,
	isSorted,
	isDescending,
	index,
	dispatch,
	headerFeatureFlags,
	isFiltered,
	nowTableReturnFocus,
	gridModel,
	columnWidths,
	hideColumnResizing,
	initialWidths,
	isGrouped,
	columnProps
}) => {
	const col = get(column, 'column', column);
	return renderHeaderRowCell({
		column: col,
		isDescending,
		isSorted,
		isGrouped,
		cellIndex: index,
		dispatch,
		headerFeatureFlags,
		isFiltered,
		nowTableReturnFocus,
		gridModel,
		columnWidths,
		hideColumnResizing,
		initialWidths,
		columnProps
	});
};

const renderColumnGroups = ({
	hasQuickEditColumn,
	hasRowSelectorColumn,
	filteredColumnNames,
	headerRows,
	focusHandler,
	dispatch,
	allSysIdsOnPage,
	allSelectedOnPage,
	headerFeatureFlags,
	isGrouped,
	defaultGroupToggleState,
	isGridEmpty,
	nowTableReturnFocus,
	gridModel,
	columnWidths,
	hideColumnResizing,
	initialWidths,
	isGridGrouped,
	groupedColumn,
	columnProps
}) => {
	const rowSpan = headerRows.length;

	return headerRows.map((headerRow, idx) => {
		const row = get(headerRow, 'row', []);
		return (
			<tr role="row">
				{idx == 0
					? renderRowButtons({
							isGrouped,
							defaultGroupToggleState,
							hasQuickEditColumn,
							hasRowSelectorColumn,
							allSysIdsOnPage,
							allSelectedOnPage,
							isGridEmpty,
							rowSpan
					  })
					: null}
				{[...row.keys()].map((columnKey, index) => {
					const column = row.get(columnKey);
					const {columnName, isSorted, isDescending} = column;

					return renderGridHeaderRowCell({
						column,
						isSorted,
						isDescending,
						index,
						focusHandler,
						dispatch,
						headerFeatureFlags,
						isFiltered: checkIfFiltered(filteredColumnNames, columnName),
						nowTableReturnFocus,
						gridModel,
						columnWidths,
						hideColumnResizing,
						initialWidths,
						isGrouped: isGridGrouped && groupedColumn === columnName,
						columnProps: columnProps.get(column)
					});
				})}
			</tr>
		);
	});
};

const renderRowButtons = ({
	isGrouped,
	defaultGroupToggleState,
	hasQuickEditColumn,
	hasRowSelectorColumn,
	allSysIdsOnPage,
	allRecordsSelected,
	allSelectedOnPage,
	isGridEmpty,
	rowSpan
}) => {
	const buttonAriaLabel = t('Expand/Collapse All Groups');
	const selectAllLabel = t('Select all');
	const allLabel = t(`All Rows`);
	const configAria = {
		'aria-label': buttonAriaLabel,
		'aria-expanded': `${defaultGroupToggleState}`
	};

	return [
		isGrouped ? (
			<th
				key={'sn_grid_toggle_group_cell_header'}
				className="-grouped"
				rowSpan={rowSpan}>
				<div className="sn-grid-header-btn">
					{defaultGroupToggleState ? (
						<now-button
							config-aria={configAria}
							bare
							component-name={BUTTON_GROUP_ALL_TOGGLE}
							icon-name={'chevron-down-fill'}
							variant="inherit"
							size="sm"
						/>
					) : null}
					{!defaultGroupToggleState ? (
						<now-button
							config-aria={configAria}
							bare
							component-name={BUTTON_GROUP_ALL_TOGGLE}
							icon-name={'chevron-right-fill'}
							variant="inherit"
							size="sm"
						/>
					) : null}
				</div>
			</th>
		) : null,
		hasQuickEditColumn ? (
			<th
				key={'sn_grid_quick_edit_cell_header'}
				className="-quickedit"
				rowSpan={rowSpan}>
				<span className="now-a11y-label sn-grid-header-btn">
					{t('Quick Edit')}
				</span>
			</th>
		) : null,
		hasRowSelectorColumn ? (
			<th key="sn_grid_checkbox_all" className="-checkbox" rowSpan={rowSpan}>
				<div className="sn-grid-header-btn">
					<now-table-checkbox
						label={allLabel}
						aria-label={selectAllLabel}
						all-records-selected={allRecordsSelected}
						checked-value={allSelectedOnPage}
						value={SN_GRID_CHECKBOX_ALL}
						data={{value: allSysIdsOnPage}}
						disabled={isGridEmpty}
					/>
				</div>
				<span className="sr-only">Row Selection</span>
			</th>
		) : null
	];
};

export const renderGridHeader = ({
	allRecordsSelected,
	recordCount,
	focusHandler,
	dispatch,
	allSysIdsOnPage,
	selectedRecords,
	exceptedRecords,
	allSelectedOnPage,
	parsedQueryModel,
	headerFeatureFlags,
	hasSelectAllStatusBar,
	isGrouped,
	defaultGroupToggleState,
	isGridEmpty,
	isGlideQuery,
	nonGlideFilterProps,
	nowTableReturnFocus,
	gridModel,
	columnWidths,
	hideColumnResizing,
	initialWidths,
	headerRows,
	columnProps
}) => {
	const {allColumns} = gridModel;
	const {hideRowSelector, hideQuickEdit} = headerFeatureFlags;

	const areColumnsVisible = allColumns.size > 0;
	const hasQuickEditColumn = !hideQuickEdit && areColumnsVisible;
	const hasRowSelectorColumn = !hideRowSelector && areColumnsVisible;
	const comparison_field_count_map = get(
		parsedQueryModel,
		'glideQuery.comparison_field_count_map',
		{}
	);
	const groupedColumn = get(gridModel, 'tableMetadata.groupedColumn', '');
	const isGridGrouped = get(gridModel, 'tableMetadata.isGrouped', false);

	const filteredColumnNames = isGlideQuery
		? Object.keys(comparison_field_count_map)
		: Object.keys(get(nonGlideFilterProps, 'comparison_field_count_map', {}));

	return (
		<thead>
			{headerRows.length > 1 ? (
				renderColumnGroups({
					hasQuickEditColumn,
					hasRowSelectorColumn,
					filteredColumnNames,
					headerRows,
					focusHandler,
					dispatch,
					allSysIdsOnPage,
					allSelectedOnPage,
					headerFeatureFlags,
					isGrouped,
					defaultGroupToggleState,
					isGridEmpty,
					nowTableReturnFocus,
					gridModel,
					columnWidths,
					hideColumnResizing,
					initialWidths,
					isGridGrouped,
					groupedColumn,
					columnProps
				})
			) : (
				<tr role="row">
					{renderRowButtons({
						isGrouped,
						defaultGroupToggleState,
						hasQuickEditColumn,
						hasRowSelectorColumn,
						allRecordsSelected,
						allSysIdsOnPage,
						allSelectedOnPage,
						isGridEmpty,
						rowSpan: 1
					})}
					{[...allColumns.keys()].map((columnKey, index) => {
						const column = allColumns.get(columnKey);
						const {columnName, isSorted, isDescending} = column;

						const isGrouped = isGridGrouped && groupedColumn === columnName;
						return renderGridHeaderRowCell({
							column,
							isSorted,
							isDescending,
							index,
							focusHandler,
							dispatch,
							headerFeatureFlags,
							isFiltered: checkIfFiltered(filteredColumnNames, columnName),
							nowTableReturnFocus,
							gridModel,
							columnWidths,
							hideColumnResizing,
							initialWidths,
							isGrouped
						});
					})}
				</tr>
			)}
			{hasSelectAllStatusBar ? (
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
			) : null}
		</thead>
	);
};
