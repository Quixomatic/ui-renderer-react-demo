import get from 'lodash/get';

import {renderGridRow} from '../gridRow/gridRow';

const renderBodyCells = ({
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
	dispatch,
	checkedRowIndex,
	hideLinks,
	hideLiveList,
	hideHighlightedValues,
	hideCellFilter,
	hideCheckboxHover,
	highlightContent,
	customCellRenderer
}) => {
	if (row) {
		return renderGridRow({
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
			isGrouped: false,
			isHidden: false,
			dispatch,
			checkedRowIndex,
			highlightContent,
			hideLinks,
			hideLiveList,
			hideHighlightedValues,
			hideCellFilter,
			hideCheckboxHover,
			customCellRenderer
		});
	}
};

export const renderBody = ({
	allRecordsSelected,
	gridModel,
	wordWrap,
	openRecordIndex,
	highlightContent,
	inlineEditingEnabled,
	isRefList,
	listInstanceId,
	liveListUpdates,
	maxCharLimit,
	hasSelectAllStatusBar,
	selectedRecords = [],
	exceptedRecords = [],
	bodyFeatureFlags,
	quickEditSysId,
	dispatch,
	checkedRowIndex,
	hideLinks,
	hideLiveList,
	hideHighlightedValues,
	hideCheckboxHover,
	hideCellFilter,
	customCellRenderer,
	headerColumns
}) => {
	const data = get(gridModel, 'layoutQuery.queryRows', new Map());
	const columns = headerColumns || get(gridModel, 'allColumns', new Map());
	const isDBView = get(gridModel, 'tableMetadata.isDBView', false);

	if (data.length === 0) return null;

	const checkboxVisibility =
		!hideCheckboxHover || allRecordsSelected || selectedRecords.length !== 0;
	const refClass = isRefList ? 'reference' : '';
	const checkboxClass = checkboxVisibility ? '' : 'hide-checkboxes';
	const wordWrapClass = wordWrap ? 'wordwrap' : '';

	return (
		<tbody
			className={`sn-list-table--body ${refClass} ${checkboxClass} ${wordWrapClass}`}>
			{[...data.keys()].map((key, index) => {
				const liveListUpdate = get(liveListUpdates, key, {});
				const row = data.get(key);
				const sys_id = get(row, 'uniqueId');
				const dbViewData = get(row, 'dbViewData', new Map());

				const checked = allRecordsSelected
					? exceptedRecords.indexOf(sys_id) == -1
					: selectedRecords.indexOf(sys_id) > -1;

				return renderBodyCells({
					row,
					columns,
					index,
					wordWrap,
					openRecordIndex,
					inlineEditingEnabled,
					isRefList,
					isDBView,
					dbViewData,
					listInstanceId,
					liveListUpdate,
					maxCharLimit,
					hasSelectAllStatusBar,
					checked,
					allRecordsSelected,
					bodyFeatureFlags,
					quickEditSysId,
					dispatch,
					checkedRowIndex,
					hideLinks,
					hideLiveList,
					hideHighlightedValues,
					hideCellFilter,
					highlightContent,
					customCellRenderer
				});
			})}
		</tbody>
	);
};
