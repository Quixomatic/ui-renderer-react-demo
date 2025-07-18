import {createRef} from '@servicenow/ui-renderer-snabbdom';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import {t} from 'sn-translate';

import {renderCheckBox} from '../checkbox/checkboxRender';
import {actionHandler} from '../grid/gridUtils';
import {renderGridRowCellContents} from '../gridRowCell/gridRowCell';
import {renderQuickEdit} from '../quickEdit/quickEditRender';

export const renderGridRowCell = ({
	cell,
	column,
	cellFeatureFlags,
	cellIndex,
	elementSysId,
	hideLinks,
	hideHighlightedValues,
	hideCellFilter,
	hideLiveList,
	highlightedValue,
	highlightContent,
	dispatch,
	isRefList,
	liveListUpdate,
	maxCharLimit,
	isDBView,
	dbViewData,
	row,
	rowIndex,
	wordWrap,
	customCellRenderer,
	tableName
}) => {
	const isFirstNonReference = get(column, 'columnData.isFirstNonRef', false);
	const isFirstIndex = cellIndex === 0;

	const cellContentsProps = {
		actionHandler,
		cell,
		cellIndex,
		column,
		dbViewData,
		elementSysId,
		hideLinks,
		hideHighlightedValues,
		hideCellFilter,
		hideLiveList,
		highlightedValue,
		highlightContent,
		dispatch,
		isFirstIndex,
		isFirstNonReference,
		isRefList,
		isDBView,
		liveListUpdate,
		maxCharLimit,
		row,
		rowCellIndex: rowIndex + '' + cellIndex,
		...cellFeatureFlags,
		wordWrap,
		customCellRenderer,
		tableName
	};

	const customCellRendererParams = {
		...cell
	};

	const customRenderer = isFunction(
		customCellRenderer.get(customCellRendererParams)
	)
		? customCellRenderer.get(customCellRendererParams)
		: false;
	const renderer = customRenderer || renderGridRowCellContents;
	const cellFilterClass = !hideCellFilter ? 'filter-enabled' : '';

	return (
		<td
			className={cellFilterClass}
			key={`row_${rowIndex}_cell_${cellIndex}`}
			role="gridcell"
			title={cell.columnData.displayValue}>
			{renderer(cellContentsProps)}
		</td>
	);
};

export const renderGridRow = ({
	row,
	columns,
	index,
	wordWrap,
	openRecordIndex,
	isRefList,
	isDBView,
	dbViewData,
	listInstanceId,
	liveListUpdate,
	maxCharLimit,
	checked,
	hasSelectAllStatusBar,
	bodyFeatureFlags,
	quickEditSysId,
	isGrouped,
	isHidden,
	dispatch,
	checkedRowIndex,
	hideHighlightedValues,
	hideLinks,
	hideLiveList,
	hideCellFilter,
	highlightContent,
	customCellRenderer
}) => {
	const {hideRowSelector, hideQuickEdit, cellFeatureFlags} = bodyFeatureFlags;
	// Screenreaders start counting rows at 1 (not 0)
	// and start counting with header rows so 2 is added.
	// 3 is added when the select all dialogue header row is active.
	const checkboxSRLabel = hasSelectAllStatusBar
		? t('Row {0}', `${index + 3}`)
		: t('Row {0}', `${index + 2}`);
	const sysId = get(row, 'uniqueId');
	const cells = get(row, 'rowData', new Map());

	const classes = [
		!hideQuickEdit && quickEditSysId && quickEditSysId === sysId && 'is-focus',
		isHidden ? 'is-hidden' : '',
		index % 2 ? 'is-even' : 'is-odd',
		checked ? 'is-checked' : ''
	].join(' ');

	const checkboxID = sysId + '_row_checkbox';

	const checkboxClasses = [
		'sn-grid-checkbox-label',
		checked ? 'is-selected' : '',
		index === checkedRowIndex ? 'checkbox-shift' : ''
	];

	const rowDisplayValue = get(row, 'displayValue', '');
	const highlightRow = get(row, 'highlightedData', {});

	const rowKey = `row_${get(row, 'uniqueId', Date.now())}`;
	const rowRef = createRef();
	const isHoverBtnCls = ' is-hover-button';
	return (
		<tr key={rowKey} role="row" ref={rowRef} className={classes}>
			{isGrouped ? (
				<td
					className="-grouped"
					key={'sn_grid_group_toggle_cell_' + index}
					on-mouseover={() => (rowRef.current.className += isHoverBtnCls)}
					on-mouseout={() => (rowRef.current.className = classes)}>
					<span
						data-truncation
						data-truncationignoretabindex
						className="now-a11y-label">
						t{'Not Expandable'}
					</span>
				</td>
			) : null}
			{!hideQuickEdit ? (
				<td
					className="-quickedit"
					key={'sn_grid_quick_edit_cell_' + index}
					on-mouseover={() => (rowRef.current.className += isHoverBtnCls)}
					on-mouseout={() => (rowRef.current.className = classes)}>
					{renderQuickEdit({
						dispatch,
						rowDisplayValue,
						rowSysId: sysId
					})}
				</td>
			) : null}
			{!hideRowSelector ? (
				<td
					role="gridcell"
					className="-checkbox"
					key={'sn_grid_checkbox_cell_' + index}
					on-mouseover={() => (rowRef.current.className += isHoverBtnCls)}
					on-mouseout={() => (rowRef.current.className = classes)}>
					{renderCheckBox({
						checkboxClasses,
						checkboxID,
						checkboxSRLabel,
						checked,
						rowIndex: index,
						checkedRowIndex,
						dispatch,
						sysId
					})}
				</td>
			) : null}
			{[...columns.keys()].map((columnName, cellIndex) => {
				const cell = cells.get(columnName);
				const highlightedValue = highlightRow.get(columnName, {});
				const column = cell && columns.get(cell.columnName);
				if (!column)
					return (
						<td key={`row_${index}_cell_${cellIndex}`} role="gridcell"></td>
					);
				const elementSysId = dbViewData.get(column.columnData.elementSysId);
				const tableName = column.columnData.tableName;
				return renderGridRowCell({
					column,
					cell,
					cellFeatureFlags,
					cellIndex,
					elementSysId,
					hideLinks,
					hideHighlightedValues,
					hideCellFilter,
					hideLiveList,
					highlightedValue,
					highlightContent,
					dispatch,
					rowIndex: index,
					isRefList,
					isDBView,
					listInstanceId,
					liveListUpdate,
					maxCharLimit,
					openRecordIndex,
					row,
					wordWrap,
					customCellRenderer,
					tableName
				});
			})}
		</tr>
	);
};
