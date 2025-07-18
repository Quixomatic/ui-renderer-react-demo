import '@servicenow/now-button';
import '@servicenow/now-text-link';
import {renderTemplate} from '@servicenow/now-grid';
import {Fragment} from '@servicenow/ui-renderer-snabbdom';
import get from 'lodash/get';
import {t} from 'sn-translate';

import {BUTTON_GROUP_TOGGLE, LIST_OPEN_GROUP} from '../../../constants';
import {getRowSelectionClass} from '../rowSelection/rowSelection';
/*
{
  "displayValue": "NULL",
  "value": "",
  "field": "category",
  "aggregateQuery": "category=",
  "groupChoiceTable": "incident",
  "count": 4,
  "groupRows": []
}
*/

const getGroupedRowStyle = (isCollapsed, rowIndex) => {
	const rowBackgroundStyle =
		rowIndex % 2 === 0 ? 'primary-row' : 'secondary-row';
	const collapsedStyle = isCollapsed ? 'is-hidden' : '';
	return `${rowBackgroundStyle} ${collapsedStyle}`;
};

const groupedRowTemplateRenderer = context => {
	const {row: group, properties, dispatch, templates, isCollapsed} = context;

	const {field, value, groupKey} = group;

	const possibleDisplayValue = get(group, 'displayValue') || value;
	const groupDisplayValue =
		possibleDisplayValue === 'NULL' ? t('(empty)') : possibleDisplayValue;
	const buttonAriaLabel = t('Expand/Collapse Group: {0}', groupDisplayValue);

	const groupRowCount =
		group.count > group.groupRows.size
			? t('({0} of {1})', [group.groupRows.length, group.count])
			: `(${group.count})`;

	const configAria = {
		'aria-label': buttonAriaLabel,
		'aria-expanded': `${!isCollapsed}`
	};

	const groupByDisplayValue = get(
		properties,
		'options.recordData.listModel.tableMetadata.groupByDisplayValue',
		''
	);

	return (
		<Fragment>
			<tr className="grouped-header">
				<td role="gridcell" className="-grouped">
					{isCollapsed ? (
						<now-button
							config-aria={configAria}
							bare
							append-to-payload={{
								groupToggleType: BUTTON_GROUP_TOGGLE,
								groupKey,
								isCollapsed: !isCollapsed
							}}
							icon-name={'chevron-right-fill'}
							size="md"
							variant="tertiary"
						/>
					) : (
						<now-button
							config-aria={configAria}
							bare
							append-to-payload={{
								groupToggleType: BUTTON_GROUP_TOGGLE,
								groupKey,
								isCollapsed: !isCollapsed
							}}
							icon-name={'chevron-down-fill'}
							size="md"
							variant="tertiary"
						/>
					)}
				</td>
				<td role="gridcell" colSpan="99">
					{groupByDisplayValue}: {groupDisplayValue} {groupRowCount}
					<now-text-link
						data-truncation
						label={t('Show all')}
						className="sn-text-link"
						href="javascript:void(0)"
						variant="secondary"
						on-click={() => {
							dispatch(LIST_OPEN_GROUP, {field, value});
						}}></now-text-link>
				</td>
			</tr>
			{group.groupRows.map((groupRow, groupRowIndex) => {
				const dataId = get(groupRow, 'rowMetaData.uniqueId');
				const groupedRowStyle = getGroupedRowStyle(isCollapsed, groupRowIndex);
				const recordSelectionClass = getRowSelectionClass(context, dataId);
				const rowStyle = `${groupedRowStyle} ${recordSelectionClass}`;

				return renderTemplate('bodyRow', templates, {
					...context,
					properties: {
						...context.properties,
						style: {className: rowStyle}
					},
					row: groupRow,
					rowIndex: groupRowIndex,
					dataId
				});
			})}
		</Fragment>
	);
};

export default groupedRowTemplateRenderer;
