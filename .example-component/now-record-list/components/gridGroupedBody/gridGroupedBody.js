import '@servicenow/now-button';
import '@servicenow/now-text-link';
import {Fragment} from '@servicenow/ui-renderer-snabbdom';
import get from 'lodash/get';
import {t} from 'sn-translate';

import {BUTTON_GROUP_TOGGLE, LIST_OPEN_GROUP} from '../../constants';
import {renderGridRow, renderGridRowCell} from '../gridRow/gridRow';

const openGroup = (dispatch, field, value) =>
	dispatch(LIST_OPEN_GROUP, {field, value});

const renderGroup = (
	group,
	groupIndex,
	groupByDisplayValue,
	isGroupedByChoice,
	wordWrap,
	openRecordIndex,
	isRefList,
	listInstanceId,
	checkedRecords,
	allSelectedOnPage,
	bodyFeatureFlags,
	quickEditSysId,
	title,
	dispatch,
	hideLinks,
	customCellRenderer,
	columns,
	groupIsClosed,
	groupMapKey,
	liveListUpdates,
	inlineEditingEnabled,
	maxCharLimit,
	highlightContent
) => {
	const groupKey = `group_${groupIndex}_fragment`;
	const {field, value} = group;

	const possibleDisplayValue = get(group, 'displayValue') || value;
	const groupDisplayValue =
		possibleDisplayValue === 'NULL' ? t('(empty)') : possibleDisplayValue;
	const buttonAriaLabel = t('Expand/Collapse Group: {0}', groupDisplayValue);

	const extraPayload = {
		value: groupMapKey,
		isGroupedByChoice
	};

	const groupRowCount =
		group.count > group.groupRows.size
			? t('({0} of {1})', [group.groupRows.size, group.count])
			: `(${group.count})`;

	const {hideRowSelector, hideQuickEdit, cellFeatureFlags} = bodyFeatureFlags;
	const groupColSpan = 1 + !hideQuickEdit + !hideRowSelector;
	const summaryRowMap = get(group, 'summaryRow', new Map());
	const summaryRow = summaryRowMap.get(value);
	const summaryRowCells = get(summaryRow, 'rowData', new Map());
	const configAria = {
		'aria-label': buttonAriaLabel,
		'aria-expanded': `${!groupIsClosed}`
	};

	return (
		<Fragment key={groupKey}>
			<tr className="sn-list-table-grouped-header">
				<td role="gridcell" className="-grouped">
					{groupIsClosed ? (
						<now-button
							append-to-payload={extraPayload}
							config-aria={configAria}
							bare
							component-name={BUTTON_GROUP_TOGGLE + `-${groupIndex}`}
							icon-name={'chevron-right-fill'}
							size="md"
							variant="tertiary"
						/>
					) : null}
					{!groupIsClosed ? (
						<now-button
							append-to-payload={extraPayload}
							config-aria={configAria}
							bare
							component-name={BUTTON_GROUP_TOGGLE + `-${groupIndex}`}
							icon-name={'chevron-down-fill'}
							size="md"
							variant="tertiary"
						/>
					) : null}
				</td>
				{summaryRowCells.size ? (
					[
						<td role="gridcell" colSpan={groupColSpan}>
							{groupDisplayValue}
						</td>,
						[...summaryRowCells.keys()].map((cellKey, cellIndex) => {
							const cell = summaryRowCells.get(cellKey);
							const highlightRow = get(
								summaryRow,
								'highlightedData',
								new Map()
							);
							const dbViewData = get(summaryRow, 'dbViewData', new Map());
							const highlightedValue = highlightRow.get(cellKey, {});
							const column = columns.get(cell.columnName);
							if (!column) return;
							const elementSysId = dbViewData.get(
								column.columnData.elementSysId
							);
							const tableName = column.columnData.tableName;
							return renderGridRowCell({
								column,
								cell,
								dispatch,
								cellFeatureFlags,
								cellIndex,
								elementSysId,
								highlightedValue,
								isRefList,
								openRecordIndex,
								rowIndex: groupIndex,
								wordWrap,
								listInstanceId,
								hideLinks,
								row: group,
								customCellRenderer,
								tableName,
								maxCharLimit,
								highlightContent
							});
						})
					]
				) : (
					<td role="gridcell" colSpan="99">
						{groupByDisplayValue}: {groupDisplayValue} {groupRowCount}
						<now-text-link
							data-truncation
							label={t('Show all')}
							className="sn-text-link"
							href="javascript:void(0)"
							on-click={() => {
								openGroup(dispatch, field, value);
							}}></now-text-link>
					</td>
				)}
			</tr>
			{[...group.groupRows.keys()].map((sys_id, index) => {
				const checked = checkedRecords.indexOf(sys_id) > -1;
				const liveListUpdate = get(liveListUpdates, sys_id, {});
				const row = group.groupRows.get(sys_id);
				const dbViewData = get(row, 'dbViewData', new Map());
				if (row) {
					return renderGridRow({
						row,
						index,
						wordWrap,
						openRecordIndex,
						isRefList,
						listInstanceId,
						checked,
						allSelectedOnPage,
						bodyFeatureFlags,
						quickEditSysId,
						isGrouped: true,
						isHidden: groupIsClosed,
						dispatch,
						hideLinks,
						customCellRenderer,
						columns,
						dbViewData,
						liveListUpdate,
						inlineEditingEnabled,
						maxCharLimit,
						highlightContent
					});
				}
			})}
		</Fragment>
	);
};

export const renderGroupedBody = ({
	allGroupStateDefault,
	allSelectedOnPage,
	bodyFeatureFlags,
	checkedRecords = [],
	customCellRenderer,
	dispatch,
	groupState,
	groupExceptions,
	gridModel,
	hideLinks,
	isRefList,
	listInstanceId,
	liveListUpdates,
	inlineEditingEnabled,
	openRecordIndex,
	quickEditSysId,
	title,
	headerColumns,
	wordWrap,
	maxCharLimit,
	highlightContent
}) => {
	const {
		tableMetadata: {groupByDisplayValue},
		layoutQuery: {isChoiceAggregate},
		allColumns
	} = gridModel;
	const empty = get(groupState.queryRows, 'size', 0) == 0;

	if (empty) return null;

	const columns = headerColumns || allColumns;
	const hideCheckboxHover = checkedRecords.length === 0;
	const refClass = isRefList ? 'reference' : '';
	const checkboxClass = hideCheckboxHover ? 'hide-checkboxes' : '';
	const wordWrapClass = wordWrap ? 'wordwrap' : '';

	return (
		<tbody
			className={`sn-list-table--body ${refClass} ${checkboxClass} ${wordWrapClass}`}>
			{[...groupState.queryRows.keys()].map((groupKey, groupIndex) => {
				const groupIsClosed =
					groupExceptions.has(groupKey) === allGroupStateDefault;
				return renderGroup(
					groupState.queryRows.get(groupKey),
					groupIndex,
					groupByDisplayValue,
					isChoiceAggregate,
					wordWrap,
					openRecordIndex,
					isRefList,
					listInstanceId,
					checkedRecords,
					allSelectedOnPage,
					bodyFeatureFlags,
					quickEditSysId,
					title,
					dispatch,
					hideLinks,
					customCellRenderer,
					columns,
					groupIsClosed,
					groupKey,
					liveListUpdates,
					inlineEditingEnabled,
					maxCharLimit,
					highlightContent
				);
			})}
		</tbody>
	);
};
