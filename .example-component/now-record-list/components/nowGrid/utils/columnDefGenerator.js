import get from 'lodash/get';
import has from 'lodash/get';

import {ColType} from '../columnTypes/colType';
import {quickEditColDef} from '../quickEdit/quickEditColDef';
import {rowSelectorColDef} from '../rowSelection/rowSelection';

export const columnTypes = {};

export const generateColumnDef = ({
	listLayout,
	hideQuickEdit,
	shouldHideRowSelectors,
	hideCheckboxHover
}) => {
	const {
		allColumns = new Map(),
		layoutQuery: {allSysIds},
		tableMetadata: {groupedColumn}
	} = listLayout;
	const colDefs = [...allColumns.keys()].map((columnKey, index) => {
		const column = allColumns.get(columnKey);
		const colType = new ColType(column);
		const field = colType.field();
		const isGrouped = field === groupedColumn;
		return {
			field,
			textAlign: colType.textAlign(),
			verticalAlign: colType.verticalAlign(),
			type: colType.type(),
			accessor: colType.accessor(),
			columnData: column.columnData,
			columnMetadata: column,
			index,
			isGrouped
		};
	});

	const isGrouped = get(listLayout, 'tableMetadata.isGrouped');

	if (!shouldHideRowSelectors)
		colDefs.unshift(rowSelectorColDef(allSysIds, hideCheckboxHover));

	if (!hideQuickEdit) colDefs.unshift(quickEditColDef(allSysIds));

	if (isGrouped) colDefs.unshift({type: 'group_toggle', field: 'group_toggle'});

	return colDefs;
};

export const generateDataFromModel = ({
	listLayout,
	listInstanceId,
	cellOverrides,
	listCount = {}
}) => {
	const queryRows = get(listLayout, 'layoutQuery.queryRows', new Map());

	const isGrouped = get(listLayout, 'tableMetadata.isGrouped', false);
	return isGrouped
		? getGroupedRowDefinitions(
				queryRows,
				listInstanceId,
				cellOverrides,
				listCount
		  )
		: getSingleRowDefinitions(queryRows, listInstanceId, cellOverrides);
};

export const getSingleRowDefinitions = (
	listModelRows,
	listInstanceId,
	cellOverrides
) => {
	const {UPDATES = {}} = cellOverrides;
	return [...listModelRows.values()].map(row => {
		const {rowData = new Map(), uniqueId} = row;
		const rowMetaData = {...row, listInstanceId};

		if (has(UPDATES, uniqueId)) {
			Object.entries(UPDATES[uniqueId].columns).forEach(
				([columnName, columnData]) => {
					if (rowData.has(columnName)) {
						const column = rowData.get(columnName);
						rowData.set(columnName, {
							...column,
							columnData: {
								...column.columnData,
								...columnData
							}
						});
					}
				}
			);
			rowMetaData.tags = get(UPDATES[uniqueId], 'rowMetaData.tags', []);
			rowMetaData.highlightedData = get(
				UPDATES[uniqueId],
				'rowMetaData.highlightedData',
				[]
			);
		}

		return {
			...Object.fromEntries(rowData.entries()),
			rowMetaData
		};
	});
};

export const getGroupedRowDefinitions = (
	listModelRows,
	listInstanceId,
	cellOverrides,
	listCount = {}
) => {
	return [...listModelRows.entries()].map(([groupKey, row]) => {
		const {groupRows = new Map()} = row;
		const subRows = getSingleRowDefinitions(
			groupRows,
			listInstanceId,
			cellOverrides
		);
		const groupedRow = {
			...row,
			groupRows: subRows,
			groupKey
		};

		const groupCount = get(listCount, `groupedRowCounts[${groupKey}]`);
		if (groupCount) {
			groupedRow.count = groupCount;
		}

		return groupedRow;
	});
};
