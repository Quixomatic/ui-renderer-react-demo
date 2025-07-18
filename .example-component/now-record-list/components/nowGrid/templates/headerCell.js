import '@servicenow/now-button';
import {NOW_GRID_OPEN_POPOVER} from '@servicenow/now-grid';
import '@servicenow/now-icon';
import {Fragment, createRef} from '@servicenow/ui-renderer-snabbdom';
import difference from 'lodash/difference';
import get from 'lodash/get';
import {t} from 'sn-translate';
import '../../checkbox/checkbox';

import {KEY} from '../../../behaviors/constants';
import {
	ASCENDING,
	BUTTON_GROUP_ALL_TOGGLE,
	DESCENDING,
	GRID_A11Y_COLUMN_REORDER,
	GRID_COLUMN_SELECT,
	GRID_UPDATE_SORT,
	NONE,
	SN_GRID_CHECKBOX_ALL
} from '../../../constants';
import getTooltip from '../../../utils/tooltipUtil';
import {getHiddenControlsClass} from '../../grid/gridUtils';
import {checkIfFiltered} from '../../gridHeader/gridHeaderHelper';
import {shouldHideColumnButton} from '../../gridHeaderRowCell/gridHeaderRowCell';
import {getDefaultSortDirection} from '../../list/listModifierUtils';
import {getTotalColumns} from '../a11yColumnReorder/a11yAriaLiveMessage';
import {
	COL_RESIZE_INITIAL,
	COL_RESIZE_MIN_WIDTH,
	keyDownHandler,
	mouseDownHandler
} from '../columnResizing/colResizing';
import {COLUMN_POPOVER_POSITIONS} from '../columnTypes/constants';
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

import {columnFilteringTemplateName} from './columnFilteringPopoverTemplate';

export const renderHeaderCell = context => {
	const {properties = {}, column, columns, dispatch} = context;

	const {type} = column;

	if (type === 'quick_edit') return renderQuickEditHeader();
	if (type === 'row_selector')
		return renderRowSelectorHeader(properties, column);
	if (type === 'group_toggle') return renderGroupToggleHeaderCell(context);

	const {
		columnData: {isSortable = true, referenceDisplayName},
		columnMetadata,
		field,
		index,
		isGrouped
	} = column;
	const totalColumns = getTotalColumns(columns);
	const columnLabel = get(columnMetadata, 'columnData.fullLabel', '');

	const headingRef = createRef();
	const resizeRef = createRef();
	const contextButtonRef = createRef();
	const colResizeGuideRef = createRef();

	let hideColumnReorderToggleClass = '';
	const HIDE_COLUMNREORDER_OFF_CLASS = 'hide-columnreorder-off';

	const {
		nextDirection,
		showAscendingIcon,
		showDescendingIcon,
		sortDirection,
		sortLabel
	} = getSortingData(columnMetadata);

	const {headerCellFlags = {}} = featureFlagSelectors.getFeatureFlags(
		properties
	);
	const {
		hideColumnGrouping,
		hideColumnFiltering,
		hideColumnResizing
	} = headerCellFlags;

	const count = selectors.getCount(properties);

	const hideColumnButton = shouldHideColumnButton(
		column,
		headerCellFlags,
		count
	);

	const parsedQueryModel = selectors.getParsedQueryModel(properties);
	const glideQueryPath = selectors.getIsRefList(properties)
		? 'glideQuery'
		: 'concatenatedGlideQuery';

	const comparison_field_count_map = get(
		parsedQueryModel,
		`${glideQueryPath}.comparison_field_count_map`,
		{}
	);

	const tableMetadata = get(properties, 'options.tableMetadata', {
		dateFormat: 'yyyy-MM-dd',
		dateTimeFormat: 'yyyy-MM-dd HH:mm:ss'
	});
	const filteredColumnNames = Object.keys(comparison_field_count_map);
	const isFiltered = checkIfFiltered(
		filteredColumnNames,
		field,
		referenceDisplayName
	);

	const hideColumnSorting =
		!isSortable || get(headerCellFlags, 'hideColumnSorting', false);

	const initialWidth = get(
		properties,
		`options.colResizing.columnSizesArray[${index}]`,
		-1
	);

	const tableName = selectors.getIsRefList(properties)
		? selectors.getRefTable(properties)
		: selectors.getTable(properties);
	const {tableLayout} = properties;
	const width = initialWidth > 0 ? `${initialWidth}px` : 'auto';
	const styles = {
		width: width
	};

	const columnResizingClass = hideColumnResizing
		? 'column-resizing-disabled'
		: 'column-resizing-enabled';
	const headerClass = hideColumnResizing ? '' : 'list-column-header';
	const thId = field + '_' + index;

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

	hideColumnReorderToggleClass = !hideColumnReorder
		? HIDE_COLUMNREORDER_OFF_CLASS
		: '';

	const getPath = event =>
		event.composedPath ? event.composedPath() : event.path;

	const documentDirection = isRTL() ? 'rtl' : 'ltr';

	const headerIcons = (
		<Fragment>
			{showAscendingIcon ? <now-icon icon="caret-up-fill" size="sm" /> : null}
			{showDescendingIcon ? (
				<now-icon icon="caret-down-fill" size="sm" />
			) : null}
			{isFiltered ? <now-icon icon="filter-outline" size="sm" /> : null}
			{isGrouped ? <now-icon icon="folder-outline" size="sm" /> : null}
		</Fragment>
	);

	const hookColumnResizeHelper = node => {
		const initialWidth = get(
			properties,
			`options.colResizing.columnSizesArray[${index}]`,
			-1
		);

		if (initialWidth < 0) {
			dispatch(COL_RESIZE_INITIAL, {
				col: field,
				index,
				vnode: node
			});
		}
	};

	const invisibleControlClass = getHiddenControlsClass(properties);
	const filteredLabel = text => (isFiltered ? t('{0}. Filtered', text) : text);
	const groupedLabel = text => (isGrouped ? t('{0}. Grouped', text) : text);
	return (
		<th
			style={tableLayout === 'fixed' ? styles : {}}
			className={`${headerClass} ${columnDragDropClass} ${selectedColumnIndicatorClass}`}
			key={thId}
			dir={documentDirection}
			id={thId}
			ref={headingRef}
			role="columnheader"
			scope="col"
			aria-sort={sortDirection}
			aria-label={groupedLabel(
				filteredLabel(get(columnMetadata, 'columnData.label'))
			)}
			data-testLabel={get(columnMetadata, 'columnData.label')}
			hook-insert={hookColumnResizeHelper}
			hook-update={hookColumnResizeHelper}>
			<div className={`sn-text-link ${hideColumnReorderToggleClass}`}>
				{!hideColumnReorder && (
					<div
						className={`personalization-drag-handler${invisibleControlClass}`}
						draggable="true"
						tabIndex="0"
						role="button"
						data-tooltip={t('Reorder')}
						data-ariadescribedby={t('Reorder')}
						{...getTooltip(dispatch)}
						aria-label={t(
							'Reorder {0}, Press enter to begin {1} of {2}.',
							columnLabel,
							index + 1,
							totalColumns
						)}
						on-click={event => {
							dispatch(GRID_COLUMN_SELECT, {
								path: getPath(event),
								shiftKey: event.shiftKey
							});
						}}
						on-keydown={event => {
							if (event.key !== KEY.TAB) event.preventDefault();
							dispatch(GRID_A11Y_COLUMN_REORDER, {
								path: getPath(event),
								event: event
							});
						}}
						on-blur={event => {
							dispatch(GRID_A11Y_COLUMN_REORDER, {
								path: getPath(event),
								cancel_reorder: true
							});
						}}>
						<now-icon
							icon="grid-vertical-outline"
							size="md"
							variant="primary"
							bare="true"
							hide-padding="true"
						/>
					</div>
				)}
				{!hideColumnSorting ? (
					<a
						type="button"
						role="button"
						tabIndex="0"
						data-tooltip={sortLabel}
						data-ariadescribedby={sortLabel}
						{...getTooltip(dispatch)}
						aria-label={sortLabel}
						on-click={event => {
							dispatch(GRID_UPDATE_SORT, {
								path: getPath(event),
								column: columnMetadata,
								nextDirection
							});
							// nowTableReturnFocus();
						}}
						on-keypress={event => {
							const clickKeys = [KEY.SPACEBAR, KEY.SPACE, KEY.ENTER];
							if (clickKeys.includes(event.key)) {
								dispatch(GRID_UPDATE_SORT, {
									column: columnMetadata,
									nextDirection
								});
								event.stopPropagation();
							}
						}}>
						<span className={columnResizingClass}>
							{get(columnMetadata, 'columnData.label')}
						</span>
						{headerIcons}
					</a>
				) : (
					<span className="hide-cell-filtering">
						<span data-truncation>
							{get(columnMetadata, 'columnData.label')}
						</span>
						{headerIcons}
					</span>
				)}
				{!hideColumnButton ? (
					<button
						ref={contextButtonRef}
						className={`sn-grid-popover-trigger ${invisibleControlClass}`}
						type="button"
						aria-expanded="false"
						aria-haspopup="menu"
						data-truncation
						data-tooltip={t('Filter')}
						data-ariadescribedby={t('Filter')}
						{...getTooltip(dispatch)}
						aria-label={t('Filter {0}', column.columnData.label)}
						title={t('Filter')}
						on-click={() => {
							dispatch(NOW_GRID_OPEN_POPOVER, {
								popoverTargetRef: contextButtonRef,
								popoverTemplateName: columnFilteringTemplateName,
								popoverPositions: COLUMN_POPOVER_POSITIONS,
								popoverDismissOnScroll: true,
								popoverContext: {
									componentProps: {
										column: columnMetadata,
										table: tableName,
										isGrouped,
										parsedQueryModel: parsedQueryModel,
										isFilterable: columnMetadata.columnData.isFilterable,
										filterId: columnMetadata.columnName,
										listInstanceId: selectors.getInstanceId(properties),
										isGroupable: columnMetadata.columnData.isGroupable,
										isGlideQuery: true,
										nonGlideFilterProps: {},
										hideColumnGrouping: hideColumnGrouping,
										hideColumnFiltering: hideColumnFiltering,
										tableMetadata: tableMetadata
									}
								}
							});
						}}
					/>
				) : null}
				{!hideColumnResizing ? (
					<div className={`slider-container ${invisibleControlClass}`}>
						<div
							ref={resizeRef}
							className={`slider-visible ${invisibleControlClass}`}
							role="slider"
							aria-label={t('Grab to resize {0}', column.columnData.label)}
							aria-valuemin={COL_RESIZE_MIN_WIDTH}
							aria-valuemax="9005"
							aria-valuenow={initialWidth}
							data-tooltip={t('Resize')}
							data-ariadescribedby={t('Resize')}
							{...getTooltip(dispatch)}
							tabindex="0"
							onkeydown={event =>
								keyDownHandler(
									event,
									properties,
									index,
									field,
									headingRef,
									resizeRef,
									dispatch
								)
							}
							onmousedown={evt =>
								mouseDownHandler(
									evt,
									properties,
									index,
									field,
									headingRef,
									colResizeGuideRef,
									resizeRef,
									dispatch,
									context
								)
							}></div>
						<div ref={colResizeGuideRef} className="column-resize-guide" />
					</div>
				) : null}
			</div>
			{!hideColumnReorder && (
				<div
					aria-hidden="true"
					className="column-placeholder-guide"
					dir={documentDirection}></div>
			)}
		</th>
	);
};

export const getSortedAscendingMsg = headerLabel =>
	t('Sorted in ascending order by {0}', headerLabel);
export const getSortedDescendingMsg = headerLabel =>
	t('Sorted in descending order by {0}', headerLabel);

const getSortingData = column => {
	const headerLabel = get(column, 'columnData.label');
	const isSorted = get(column, 'isSorted', false);
	const isDescending = get(column, 'isDescending', false);
	const direction = isDescending ? DESCENDING : ASCENDING;
	const showAscendingIcon = direction === ASCENDING && isSorted;
	const showDescendingIcon = direction === DESCENDING && isSorted;
	const internalType = get(column, 'columnData.internalType');
	const nextDirection = !isSorted
		? getDefaultSortDirection(internalType)
		: !isDescending;
	const sortDirection = isSorted ? direction : NONE;
	const sortDirectionMsg =
		sortDirection === ASCENDING
			? getSortedAscendingMsg(headerLabel)
			: getSortedDescendingMsg(headerLabel);
	const sortLabel =
		sortDirection !== NONE ? sortDirectionMsg : t('Sort by {0}', headerLabel);
	return {
		nextDirection,
		showAscendingIcon,
		showDescendingIcon,
		sortDirection,
		sortLabel
	};
};

const renderGroupToggleHeaderCell = context => {
	const groupsCollapsed = get(
		context,
		'properties.options.collapsedDefault',
		false
	);
	const buttonAriaLabel = t('Expand/Collapse All Groups');
	const configAria = {
		'aria-label': buttonAriaLabel,
		'aria-expanded': `${!groupsCollapsed}`
	};
	return (
		<th key={'sn_grid_toggle_group_cell_header'} className="-grouped">
			<div className="sn-grid-header-btn">
				{!groupsCollapsed ? (
					<now-button
						config-aria={configAria}
						bare
						append-to-payload={{
							groupToggleType: BUTTON_GROUP_ALL_TOGGLE,
							groupsCollapsed: !groupsCollapsed
						}}
						icon-name={'chevron-down-fill'}
						variant="inherit"
						size="md"
					/>
				) : (
					<now-button
						config-aria={configAria}
						bare
						append-to-payload={{
							groupToggleType: BUTTON_GROUP_ALL_TOGGLE,
							groupsCollapsed: !groupsCollapsed
						}}
						icon-name={'chevron-right-fill'}
						variant="inherit"
						size="md"
					/>
				)}
			</div>
		</th>
	);
};

const renderQuickEditHeader = () => {
	return (
		<th key={'sn_grid_quick_edit_cell_header'} className="-quickedit">
			<span className="now-a11y-label sn-grid-header-btn">
				{t('Quick Edit')}
			</span>
		</th>
	);
};

const renderRowSelectorHeader = (properties, column) => {
	const {allSysIds} = column;
	const allLabel = t(`All Rows`);
	const selectAllLabel = t('Select all');
	const selectedRecords = rowSelectionSelectors.getSelectedRecords(
		properties,
		OPTIONS_PATH
	);
	const isGridEmpty = rowSelectionSelectors.getIsGridEmpty(
		properties,
		OPTIONS_PATH
	);
	const allRecordsSelected = rowSelectionSelectors.getAllRecordsSelected(
		properties,
		OPTIONS_PATH
	);
	const selRecordKeys = Object.keys(selectedRecords);
	const checked =
		allRecordsSelected ||
		(selRecordKeys.length > 0 &&
			difference(allSysIds, selRecordKeys).length === 0);
	const {headerCellFlags = {}} = featureFlagSelectors.getFeatureFlags(
		properties
	);
	const {hideSelectAll} = headerCellFlags;
	return (
		<th key="sn_grid_checkbox_all" className="-checkbox">
			{!hideSelectAll ? (
				<div className="sn-grid-header-btn">
					<now-table-checkbox
						label={allLabel}
						title={selectAllLabel}
						checked-value={checked}
						value={SN_GRID_CHECKBOX_ALL}
						data={{value: allSysIds}}
						disabled={isGridEmpty}
					/>
				</div>
			) : null}
			<span className="sr-only">Row Selection</span>
		</th>
	);
};
