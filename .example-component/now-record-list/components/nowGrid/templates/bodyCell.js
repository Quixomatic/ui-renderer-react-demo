import '../../tags/tagCell';
import '@servicenow/now-text-link';
import {NOW_GRID_OPEN_POPOVER} from '@servicenow/now-grid';
import {createRef} from '@servicenow/ui-renderer-snabbdom';
import get from 'lodash/get';
import has from 'lodash/has';
import isEmpty from 'lodash/isEmpty';
import merge from 'lodash/merge';
import truncate from 'lodash/truncate';
import moment from 'moment';
import {SnTimeAgo} from 'sn-component-timeago';
import {t} from 'sn-translate';

import {UPDATE_BULK_EDIT_CLICK} from '../../../behaviors/constants';
import {
	CELL_FILTERING,
	CELL_URL_CLICKED,
	DATE_FORMAT_USER_PREFERENCE,
	INLINE_EDITING_FAILED_STATUS,
	KEY_ENTER,
	LIVE_LIST_ITEM_CHANGED,
	LIVE_LIST_ITEM_ENTERED,
	SHORT_DATE_FORMAT_USER_PREFERENCE
} from '../../../constants';
import * as FieldType from '../../../fieldType';
import {
	handleRemoveTooltip,
	handleShowTooltip,
	handleShowTooltipOnFocus
} from '../../../utils/tooltipUtil';
import {renderCheckBox} from '../../checkbox/checkboxRender';
import {
	getColumnType,
	shouldHideFilterFromInternalType,
	getHiddenControlsClass,
	getShowHiddenControls
} from '../../grid/gridUtils';
import {
	buildLiveIndicator,
	buildMultiEditFailedIndicator,
	checkIsLink,
	generateInnerContents,
	getHighlightedDisplayValue,
	getHref,
	isReference,
	isURLField
} from '../../gridRowCell/gridRowCell';
import {isFieldTypeSupported} from '../../inlineEditor/tooltip';
import {renderQuickEdit} from '../../quickEdit/quickEditRender';
import {getTagCell} from '../../tags/tagCell';
import {
	CELL_POPOVER_POSITIONS,
	INLINE_CELL_POPOVER_POSITIONS,
	OVERFLOWING_CELL_INLINE_POSITIONS,
	ROW_POPOVER_POSITIONS,
	TOOLTIP_POSITIONS
} from '../columnTypes/constants';
import {
	GROUP_TOGGLE,
	QUICK_EDIT,
	RELATED_TAGS,
	ROW_SELECTOR
} from '../constants';
import {featureFlagSelectors} from '../featureFlags/featureFlags';
import {selectors} from '../recordDataTransform/recordDataTransform';
import {
	OPTIONS_PATH,
	rowSelectionSelectors
} from '../rowSelection/rowSelection';
import {
	getColumnDragDropClass,
	getHideColumnReorderFlagValue,
	getSelectedColumnIndicatorStyleClass,
	isRTL
} from '../utils/columnDragDropUtil';
import {getValueForUserPreference} from '../utils/userPreferenceUtils';

import {cellFilteringTemplateName} from './cellFilteringPopoverTemplate';
import {inlineDependentTemplateName} from './inlineDependentPopoverTemplate';
import {inlineEditTemplateName} from './inlineEditPopoverTemplate';
import {inlineTagsTemplateName} from './inlineTagsTemplate';
import {inlineTooltipTemplateName} from './inlineTooltipPopoverTemplate';

export const renderBodyCell = context => {
	const {properties = {}, column, row, rowIndex, dispatch} = context;

	const {tableMetadata} = properties.options.recordData.listModel;
	const {rowMetaData = {}} = row;
	const {uniqueId, displayValue} = rowMetaData;
	const {highlightedData, tags = []} = rowMetaData;
	const {index, field, type} = column;

	const userPreferences = selectors.getUserPreferences(properties);
	const invisibleControlClass = getHiddenControlsClass(properties);

	if (type === QUICK_EDIT)
		return renderQuickEditBodyCell(
			uniqueId,
			dispatch,
			displayValue,
			invisibleControlClass
		);
	if (type === ROW_SELECTOR)
		return renderRowSelector(
			column,
			properties,
			uniqueId,
			rowIndex,
			dispatch,
			displayValue
		);

	if (type === GROUP_TOGGLE) {
		return renderGroupCell();
	}

	const contextButtonRef = createRef();
	const contextCellRef = createRef();
	const gridCellRef = createRef();

	const internalType = get(column, 'columnData.internalType', '');
	const href = getHref({cell: get(row, [field], {}), internalType});

	const rowCell = get(row, [field, 'columnData'], {});

	let rowCellData = row[column.field];

	const inlineEditingEnabled = get(
		properties.options.recordData,
		'inlineEditingEnabled',
		false
	);
	const inlineMultiEditFailed = rowCell.status === INLINE_EDITING_FAILED_STATUS;

	const focusedSysIds = get(properties, 'options.bulkFocus.focusedSysIds', []);
	const allSysIdsOnPage = get(
		properties,
		'options.gridRowSelection.allSysIdsOnPage',
		[]
	);
	const allColumns = get(
		properties,
		'options.recordData.listModel.allColumns',
		{}
	);

	const wordWrap = selectors.getWordWrap(properties);
	let cellDisplayValue = get(rowCell, 'displayValue', '');

	const {bodyCellFlags = {}} = featureFlagSelectors.getFeatureFlags(properties);

	const {
		hideLinks,
		hideLiveList,
		hideHighlightContent,
		hideHighlightedValues,
		hideInlineEditing
	} = bodyCellFlags;

	const hideCellFilter = !rowCellData || bodyCellFlags.hideCellFilter;

	const cellMetaData = {
		wordWrap,
		context,
		cellDisplayValue,
		inlineEditingEnabled,
		gridCellRef,
		hideInlineEditing
	};

	if (type === RELATED_TAGS) {
		const tagContainerWidth = get(
			properties,
			`options.colResizing.columnSizesArray[${index}]`,
			-1
		);

		const tagCell = getTagCell(
			tags,
			uniqueId,
			wordWrap,
			tagContainerWidth,
			dispatch
		);

		return renderCell(
			cellMetaData,
			focusedSysIds,
			allSysIdsOnPage,
			allColumns,
			tableMetadata,
			tagCell
		);
	}

	const highlightedValue = !isEmpty(highlightedData)
		? highlightedData.get(field)
		: {};
	const {value, status, showIcon, iconName, variantName, colorName} =
		highlightedValue || {};

	let boldRow = false;

	let hasCellChange = false;

	if (!hideLiveList) {
		const liveListData = selectors.getLiveListUpdates(properties);
		if (!isEmpty(liveListData)) {
			const {
				boldRow: boldRowData,
				cellDisplayValue: cellDisplayValueData,
				hasCellChange: hasCellChangeData
			} = getLiveListData(liveListData, uniqueId, field, rowCell);

			boldRow = boldRowData;
			cellDisplayValue = cellDisplayValueData;
			hasCellChange = hasCellChangeData;
		}
	}

	const isFirstNonReference = get(column, 'columnData.isFirstNonRef', false);

	const isFirstCell = index === 0;
	const isRefList = selectors.getIsRefList(properties);
	const isLink = checkIsLink({
		rowCell,
		cellDisplayValue,
		isRefList,
		isFirstCell,
		internalType,
		isFirstNonReference,
		hideLinks
	});

	// process empty display value()
	if (!cellDisplayValue && (isFirstNonReference || isReference(internalType))) {
		cellDisplayValue = `${t('(empty)')}`;
	}

	const maxCharLimit = selectors.getMaxCharLimit(properties);
	const highlightContent = selectors.getHighlightContent(properties);
	const highlightContentPatterns = get(highlightContent, 'patterns', []);

	// DEF0208579 - Removing newlines from the start of text only on ui
	if (cellDisplayValue && cellDisplayValue.length > 0) {
		cellDisplayValue = cellDisplayValue.replace(/(^\s*(?!.+)\n+)/g, '');
	}

	const truncatedDisplayValue = truncate(cellDisplayValue, {
		length: maxCharLimit
	});

	const classes =
		'cell-content-container' +
		(boldRow && !hideLiveList ? ' content-changed' : '') +
		(inlineEditingEnabled && inlineMultiEditFailed ? ' edit-failed' : '');

	const isMultiText = get(column, 'columnData.isMultiText', false);
	const wordWrapClassName = getWordWrapClasses({wordWrap, isMultiText});

	//creating link props for first cells with no cell data due to security block
	if (!rowCellData && isFirstCell) {
		rowCellData = {name: column.columnName, rowData: column.columnData};
	}

	const createLinkProps = {
		isLink,
		hideLinks,
		rowMetaData: {...rowMetaData, rowIndex},
		rowCellData,
		classes,
		dispatch,
		href
	};

	const isDateType = internalType === 'glide_date_time';
	let truncatedValue = truncatedDisplayValue;

	// we are checking for the value empty as sn-component-timeago returns unknown if the date/time value is empty
	if (isDateType === true && truncatedDisplayValue !== '') {
		const options = {
			timeAgo: true,
			dateBoth: false,
			systemTime: false,
			dateOnly: false
		};

		const dateTimeUserPreferenceJSON = getValueForUserPreference(
			userPreferences,
			DATE_FORMAT_USER_PREFERENCE,
			'{}'
		);
		const dateTimeUserPreference = JSON.parse(dateTimeUserPreferenceJSON);
		const shortDateUserPreference = getValueForUserPreference(
			userPreferences,
			SHORT_DATE_FORMAT_USER_PREFERENCE,
			'false'
		);

		if (shortDateUserPreference === 'true') {
			const date = new Date();
			const presentYear = date.getFullYear().toString();
			const year = truncatedDisplayValue.substring(0, 4);

			truncatedValue = truncatedDisplayValue.substring(0, 16);
			if (year === presentYear) {
				truncatedValue = truncatedValue.substring(5);
			}
		}

		/**
		 * DEF0296536 - Handle an alternate date or time format being used
		 * since SnTimeAgo doesn't account for a non-default user pref format.
		 * The date format needs to be capitalized due to the difference
		 * between ServiceNow and moment format specs
		 */

		/**
		 * DEF0364395 - Issue: timeZone is not being considered while calculating timeAgo,
		 * Fix: getting the correct time stamp from value (which is in UTC) and sending it to SnTimeAgo for correct calculation
		 */
		const unixTimestamp = moment
			.utc(rowCell.value, `YYYY-MM-DD hh:mm:ss`)
			.valueOf();

		const timeAgo = new SnTimeAgo(
			{timestampLong: unixTimestamp},
			cellDisplayValue,
			options
		);
		const time = timeAgo.getTickTime().time;

		if (dateTimeUserPreference?.timeAgo === true) {
			truncatedValue = time;
		} else if (dateTimeUserPreference?.dateBoth === true) {
			truncatedValue = (
				<div>
					<span className="calendar-date">{truncatedValue}</span>
					<span className="time-ago">{time}</span>
				</div>
			);
		}
	}

	const innerContentsPayload = {
		buildLiveIndicator,
		buildMultiEditFailedIndicator,
		displayValue: truncatedValue,
		hasCellChange,
		hideHighlightedValues,
		inlineMultiEditFailed,
		isLink,
		createLinkProps,
		showIcon,
		status,
		value,
		variantName,
		iconName,
		colorName,
		wordWrapClassName
	};

	if (
		!hideHighlightContent &&
		highlightContentPatterns.length &&
		highlightContentPatterns.join() !== ''
	) {
		const {didStringChange, highlightedElement} = getHighlightedDisplayValue({
			highlightContent,
			truncatedDisplayValue,
			cellDisplayValue,
			wordWrapClassName
		});
		innerContentsPayload.didStringChange = didStringChange;
		innerContentsPayload.highlightedElement = highlightedElement;
	}
	innerContentsPayload.cellDisplayValue = cellDisplayValue;
	const contents = generateInnerContents(innerContentsPayload);

	const content = isURLField(internalType) ? (
		<now-text-link
			label={href}
			href={href || 'javascript:void(0)'}
			opensWindow
			underlined
			appendToPayload={{
				type: CELL_URL_CLICKED,
				rowIndex,
				column: column.field,
				sysId: uniqueId
			}}
		/>
	) : (
		<div className={classes}>{contents}</div>
	);

	const hideFilter = shouldHideFilterFromInternalType(internalType);

	const className =
		getColumnType(column) === 'numeric'
			? 'sn-text-link -number'
			: 'sn-text-link';

	const innerContent = (
		<div
			className={className}
			ref={contextCellRef}
			on-click={event => {
				if (!inlineEditingEnabled) return;
				dispatch(UPDATE_BULK_EDIT_CLICK, {
					colIndex: index,
					rowIndex,
					shiftKey: event.shiftKey,
					metaKey: event.metaKey
				});
			}}>
			{content}
			{!hideCellFilter && !hideFilter ? (
				<button
					ref={contextButtonRef}
					type="button"
					data-ancillary="true"
					className={`sn-grid-popover-trigger ${invisibleControlClass}`}
					aria-expanded="false"
					aria-haspopup="menu"
					aria-label={t('Cell Filter')}
					data-tooltip={t('Filter')}
					data-ariadescribedby={t('Filter')}
					on-click={() => {
						dispatch(NOW_GRID_OPEN_POPOVER, {
							popoverContext: {
								componentProps: {
									popover: {
										type: CELL_FILTERING,
										context: row[column.field]
									},
									listInstanceId: selectors.getInstanceId(properties)
								}
							},
							popoverPositions: ROW_POPOVER_POSITIONS,
							popoverTargetRef: contextButtonRef,
							popoverTemplateName: cellFilteringTemplateName
						});
					}}
				/>
			) : null}
		</div>
	);

	return renderCell(
		cellMetaData,
		focusedSysIds,
		allSysIdsOnPage,
		allColumns,
		tableMetadata,
		innerContent
	);
};

const getWordWrapClasses = ({wordWrap, isMultiText}) => {
	const wordWrapClasses = [];

	const worWrapClass = wordWrap ? '-wordwrap' : '-truncated';
	wordWrapClasses.push(worWrapClass);

	const multiLineClass = isMultiText ? '-multi-line' : '-single-line';
	wordWrapClasses.push(multiLineClass);

	return wordWrapClasses.join(' ');
};

const renderInlineEditing = ({
	column,
	dispatch,
	gridCellRef,
	hideInlineEditing,
	properties,
	row,
	row: {
		rowMetaData: {uniqueId}
	},
	width,
	height,
	allColumns,
	tableMetadata,
	inlineEditingEnabled
}) => {
	const tableRef = gridCellRef.current.closest('table');
	const focusedSysIds = get(tableRef, 'dataset.quickEditIds', '').split(',');
	if (!row[column.field]) {
		return dispatch(NOW_GRID_OPEN_POPOVER, {
			popoverTargetRef: gridCellRef,
			popoverTemplateName: inlineTooltipTemplateName,
			popoverContext: {
				componentProps: {
					message: t('Inline Editing is disabled for this column.')
				}
			},
			popoverHideTail: true,
			popoverPositions: TOOLTIP_POSITIONS
		});
	}

	const isCellOverflowing = height > 700;

	const style = {
		minWidth: width + 'px',
		minHeight: isCellOverflowing ? 700 : height + 'px',
		paddingLeft: '12px',
		paddingRight: '12px'
	};

	if (column.columnData.internalType === RELATED_TAGS) {
		const selectedSysIds = inlineEditingEnabled ? focusedSysIds : [uniqueId];
		return dispatch(NOW_GRID_OPEN_POPOVER, {
			popoverTargetRef: gridCellRef,
			popoverTemplateName: inlineTagsTemplateName,
			popoverContext: {
				componentProps: {
					fieldName: column.field,
					fieldType: column.columnData.internalType,
					tableName: selectors.getTable(properties),
					selectedSysIds,
					popoverStyle: {...style, minWidth: '100%'},
					recordSysId: uniqueId
				}
			},
			popoverHideTail: false,
			popoverPositions: ROW_POPOVER_POSITIONS,
			popoverDismissOnPropertyChanged: false
		});
	}

	const isBoolean = column.columnData.internalType == FieldType.BOOLEAN;

	if (hideInlineEditing) {
		return dispatch(NOW_GRID_OPEN_POPOVER, {
			popoverTargetRef: gridCellRef,
			popoverTemplateName: inlineTooltipTemplateName,
			popoverContext: {
				componentProps: {
					message: t('Inline Editing is disabled for this list.')
				}
			},
			popoverHideTail: true,
			popoverPositions: TOOLTIP_POSITIONS
		});
	}
	if (!isFieldTypeSupported(column.columnData.internalType)) {
		return dispatch(NOW_GRID_OPEN_POPOVER, {
			popoverTargetRef: gridCellRef,
			popoverTemplateName: inlineTooltipTemplateName,
			popoverContext: {
				componentProps: {
					message: t('Editing this field type is not supported.')
				}
			},
			popoverHideTail: true,
			popoverPositions: TOOLTIP_POSITIONS
		});
	}

	if (column.columnData.isChoice || isBoolean) {
		return dispatch(NOW_GRID_OPEN_POPOVER, {
			popoverTargetRef: gridCellRef,
			popoverTemplateName: inlineDependentTemplateName,
			popoverContext: {
				componentProps: {
					recordSysId: uniqueId,
					selectedSysIds: focusedSysIds,
					tableName: selectors.getTable(properties),
					fieldName: column.field,
					allColumns: allColumns,
					gridCellRef: gridCellRef,
					style: style
				}
			},
			popoverHideTail: true,
			popoverPositions: CELL_POPOVER_POSITIONS
		});
	}

	return dispatch(NOW_GRID_OPEN_POPOVER, {
		popoverTargetRef: gridCellRef,
		popoverTemplateName: inlineEditTemplateName,
		popoverContext: {
			componentProps: {
				style: style,
				recordSysId: row.rowMetaData.uniqueId,
				selectedSysIds: focusedSysIds,
				tableName: selectors.getTable(properties),
				fieldName: column.field,
				fieldType: column.columnData.internalType,
				label: column.columnData.label,
				displayValue: row[column.field].columnData.displayValue,
				value: row[column.field].columnData.value,
				allColumns: allColumns,
				tableMetadata: tableMetadata
			}
		},
		popoverHideTail: true,
		popoverPositions: isCellOverflowing
			? OVERFLOWING_CELL_INLINE_POSITIONS
			: INLINE_CELL_POPOVER_POSITIONS
	});
};

const getLiveListData = (liveListUpdates, uniqueId, field, rowCell) => {
	const liveListUpdate = get(liveListUpdates, uniqueId, {});
	const liveListUpdateType = get(liveListUpdate, 'liveListType', '');
	const boldRow =
		liveListUpdateType === LIVE_LIST_ITEM_ENTERED ||
		liveListUpdateType === LIVE_LIST_ITEM_CHANGED;

	const liveListColumn = get(liveListUpdate, `${field}`);

	const hasCellChange =
		!isEmpty(liveListUpdate) &&
		!isEmpty(liveListColumn) &&
		liveListUpdateType !== LIVE_LIST_ITEM_ENTERED;

	const cell = hasCellChange
		? merge(rowCell, {columnData: {...liveListColumn}})
		: rowCell;
	const {displayValue: cellDisplayValue = ''} = cell;

	return {boldRow, cellDisplayValue, hasCellChange};
};

const renderQuickEditBodyCell = (
	uniqueId,
	dispatch,
	displayValue,
	invisibleControlClass
) => {
	const contents = renderQuickEdit({
		dispatch,
		rowDisplayValue: displayValue,
		rowSysId: uniqueId,
		invisibleControlClass
	});

	return (
		<td
			data-truncation
			on-mouseover={evt => evt.target.closest('tr').classList.add('is-focus')}
			on-mouseout={evt =>
				evt.target.closest('tr').classList.remove('is-focus')
			}>
			{contents}
		</td>
	);
};

const renderGroupCell = () => {
	return (
		<td className="-grouped">
			<span data-truncation className="now-a11y-label">
				t{'Not Expandable'}
			</span>
		</td>
	);
};

const renderRowSelector = (
	column,
	properties,
	uniqueId,
	rowIndex,
	dispatch,
	displayValue
) => {
	const {allSysIds} = column;

	const checkboxID = uniqueId + '_row_checkbox';
	const exceptedRecords = rowSelectionSelectors.getExceptedRecords(
		properties,
		OPTIONS_PATH
	);
	const selectedRecords = rowSelectionSelectors.getSelectedRecords(
		properties,
		OPTIONS_PATH
	);
	const allRecordsSelected = rowSelectionSelectors.getAllRecordsSelected(
		properties,
		OPTIONS_PATH
	);
	const isHidecbHover = rowSelectionSelectors.getHideCheckboxHover(
		properties,
		OPTIONS_PATH
	);

	const checked = allRecordsSelected
		? exceptedRecords.indexOf(uniqueId) == -1
		: has(selectedRecords, uniqueId);

	const showHiddenControls = getShowHiddenControls(properties);
	const checkboxVisibility =
		showHiddenControls ||
		!isHidecbHover ||
		allRecordsSelected ||
		!isEmpty(selectedRecords);

	const checkboxClass = checkboxVisibility ? '' : 'hide-checkboxes';

	const checkboxClasses = [
		'sn-grid-checkbox-label',
		checkboxClass,
		checked ? 'is-selected' : '',
		uniqueId === get(properties, 'options.bulkFocus.previousSysId', '')
			? 'is-focus'
			: ''
	];

	// Screenreaders start counting rows at 1 (not 0)
	// and start counting with header rows so 2 is added.
	// 3 is added when the select all dialogue header row is active.
	// const checkboxSRLabel = hasSelectAllStatusBar
	// ? t('Row {0}', `${index + 3}`)
	// : t('Row {0}', `${index + 2}`); // TODO: once select all is implemented honor the flag

	const checkboxSRLabel = t('Row {0}', `${rowIndex + 2}`);

	const contents = renderCheckBox({
		checkboxClasses,
		checkboxID,
		checkboxSRLabel,
		checked,
		rowIndex,
		dispatch,
		sysId: uniqueId,
		allSysIds,
		rowDisplayValue: displayValue
	});

	return (
		<td
			data-truncation
			on-mouseover={evt => evt.target.closest('tr').classList.add('is-focus')}
			on-mouseout={evt =>
				evt.target.closest('tr').classList.remove('is-focus')
			}>
			{contents}
		</td>
	);
};

const renderCell = (
	cellMetaData = {},
	focusedSysIds,
	allSysIdsOnPage,
	allColumns,
	tableMetadata,
	innerContent = ''
) => {
	const {
		wordWrap,
		context,
		cellDisplayValue,
		inlineEditingEnabled,
		gridCellRef,
		hideInlineEditing
	} = cellMetaData;
	const tdClass = wordWrap ? ' wordwrap ' : ' ';
	const {properties = {}, column, row, rowIndex, dispatch} = context;
	const {index: cellIndex, type} = column;

	// Column personalization
	const {headerCellFlags = {}} = featureFlagSelectors.getFeatureFlags(
		properties
	);

	// If the flag is not available in the particular list, hide personalization will be true
	const hideColumnReorder = getHideColumnReorderFlagValue(headerCellFlags);
	const columnDragDropClass = getColumnDragDropClass({
		properties,
		hideColumnReorder,
		column
	});
	const selectedColumnIndicatorClass = getSelectedColumnIndicatorStyleClass({
		properties,
		hideColumnReorder,
		column
	});

	const documentDirection = isRTL() ? 'rtl' : 'ltr';

	const isRelatedTags = type === RELATED_TAGS;
	const className = `sn-list-grid-cell ${isRelatedTags ? 'sn-tag-cell' : ''}`;
	return (
		<td
			className={`${tdClass} ${columnDragDropClass} ${selectedColumnIndicatorClass}`}
			role="gridcell"
			dir={documentDirection}
			key={`row_${rowIndex}_cell_${cellIndex}`}
			data-ariadescribedby={cellDisplayValue}
			data-test={`${cellDisplayValue}`}
			data-tooltip={cellDisplayValue}
			on-mouseover={(/** @type {MouseEvent} */ e) =>
				handleShowTooltip(dispatch, e)
			}
			on-mouseout={(/** @type {MouseEvent} */ e) =>
				handleRemoveTooltip(dispatch, e)
			}
			on-focusin={(/** @type {FocusEvent} */ e) => {
				handleShowTooltipOnFocus(dispatch, e);
			}}
			on-focusout={(/** @type {FocusEvent} */ e) => {
				handleRemoveTooltip(dispatch, e);
			}}
			on-mousedown={event => {
				if (event.shiftKey) event.preventDefault();
			}}
			on-dblclick={event => {
				if (event.metaKey) return;
				if (!inlineEditingEnabled && !isRelatedTags) return;
				const {width, height} = gridCellRef.current.getBoundingClientRect();
				renderInlineEditing({
					column,
					dispatch,
					event,
					gridCellRef,
					hideInlineEditing,
					properties,
					row,
					focusedSysIds,
					allSysIdsOnPage,
					width,
					height,
					allColumns,
					tableMetadata,
					inlineEditingEnabled
				});
			}}
			on-keypress={event => {
				if (!inlineEditingEnabled && !isRelatedTags) return;
				if (event.key !== KEY_ENTER) return;
				if (!event.shiftKey) return;
				const {width, height} = gridCellRef.current.getBoundingClientRect();
				renderInlineEditing({
					column,
					dispatch,
					event,
					gridCellRef,
					hideInlineEditing,
					properties,
					row,
					focusedSysIds,
					allSysIdsOnPage,
					width,
					height,
					allColumns,
					tableMetadata,
					inlineEditingEnabled
				});
			}}>
			<div ref={gridCellRef} className={className}>
				{innerContent}
			</div>
		</td>
	);
};
