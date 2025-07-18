import '../columnFiltering/container';
import '@servicenow/now-icon';
import {focusWithinClassManager} from '@devsnc/sn-list-commons';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import {t} from 'sn-translate';

import {
	ASCENDING,
	COLUMN_FILTERING,
	COL_RESIZE_MIN_WIDTH,
	DESCENDING,
	GRID_OPEN_POPOVER,
	GRID_UPDATE_SORT,
	NONE,
	SORTED_ASCENDING_MSG,
	SORTED_DESCENDING_MSG
} from '../../constants';
import {getOffset, shouldHideFilterFromInternalType} from '../grid/gridUtils';
import {getDefaultSortDirection} from '../list/listModifierUtils';

export const shouldHideColumnButton = (column, headerFeatureFlags, count) => {
	const {
		internalType,
		isFilterable = true,
		isGroupable = true
	} = column.columnData;

	const hideColumnFiltering =
		get(headerFeatureFlags, 'hideColumnFiltering', false) || !isFilterable;

	const hideColumnGrouping =
		get(headerFeatureFlags, 'hideColumnGrouping', false) ||
		!isGroupable ||
		count === 0;

	if (
		(hideColumnFiltering && hideColumnGrouping) ||
		shouldHideFilterFromInternalType(internalType)
	)
		return true;

	return false;
};

/* generateWidthStyles generates the css for the widths for each gridHeaderRowCell
   based on columnWidths (which is the user pref for any previously set column width)
   and initialWidths, which is the initialWidths of the grid with no modification. 
*/
const generateWidthStyles = ({columnWidths, cellIndex, initialWidths}) => {
	if (columnWidths.length > 0 && columnWidths[cellIndex] !== -1) {
		const cssString = `${columnWidths[cellIndex]}px`;
		return {
			width: cssString,
			minWidth: cssString
		};
	}
	if (!initialWidths) return {};
	if (columnWidths.length === 0) {
		return {
			width: 'auto',
			minWidth: 'auto'
		};
	} else {
		const width =
			columnWidths[cellIndex] === -1
				? initialWidths[cellIndex]
				: columnWidths[cellIndex];
		const cssString = `${width}px`;
		return {
			width: cssString,
			minWidth: cssString
		};
	}
};

export const renderHeaderRowCell = ({
	column,
	isDescending,
	isSorted,
	isGrouped,
	cellIndex,
	dispatch,
	headerFeatureFlags,
	isFiltered,
	nowTableReturnFocus,
	gridModel,
	columnWidths,
	hideColumnResizing,
	initialWidths,
	columnProps
}) => {
	const {isSortable = true, label} = column.columnData;
	const direction = isDescending ? DESCENDING : ASCENDING;
	const sortDirection = isSorted ? direction : NONE;
	const sortDirectionMsg =
		sortDirection === ASCENDING ? SORTED_ASCENDING_MSG : SORTED_DESCENDING_MSG;
	const sortLabel = sortDirection !== NONE ? sortDirectionMsg : '';
	const showAscendingIcon = direction === ASCENDING && isSorted;
	const showDescendingIcon = direction === DESCENDING && isSorted;

	const hideColumnSorting =
		!isSortable || get(headerFeatureFlags, 'hideColumnSorting', false);
	const hideColumnButton = shouldHideColumnButton(
		column,
		headerFeatureFlags,
		get(gridModel, 'count')
	);
	const columnResizingClass = hideColumnResizing
		? 'column-resizing-disabled'
		: 'column-resizing-enabled';
	const headerClass = hideColumnResizing ? '' : 'list-column-header';
	let colWidth = 0;

	if (initialWidths) {
		colWidth =
			columnWidths.length === 0 || columnWidths[cellIndex] < 0
				? initialWidths[cellIndex]
				: columnWidths[cellIndex];
	}

	const styles = generateWidthStyles({columnWidths, cellIndex, initialWidths});
	const thId = column.columnName + '_' + cellIndex;
	const nextDirection = !isSorted
		? getDefaultSortDirection(column.internalType)
		: !isDescending;

	let thRef = null;

	const colSpan = get(columnProps, 'colSpan', 1);
	const rowSpan = get(columnProps, 'rowSpan', 1);

	const firstCellClass = !isEmpty(columnProps) ? columnProps.class : '';
	const className = `${headerClass} ${firstCellClass}`;

	const checkFocusIn = evt => {
		let focusIsWithin;
		if ('focus' === evt.type) focusIsWithin = true;
		else if ('blur' === evt.type) focusIsWithin = false;

		focusWithinClassManager(thRef, '-focus-within', focusIsWithin);
	};

	return (
		<th
			key={thId}
			id={thId}
			colSpan={colSpan}
			rowSpan={rowSpan}
			role="columnheader"
			className={className}
			scope="col"
			aria-sort={sortDirection}
			style={styles}
			ref={el => {
				thRef = el;
			}}>
			<div data-truncation className="sn-text-link">
				{!hideColumnSorting ? (
					<a
						type="button"
						role="button"
						tabIndex="0"
						on-focus={checkFocusIn}
						on-blur={checkFocusIn}
						on-click={() => {
							dispatch(GRID_UPDATE_SORT, {column, nextDirection});
							nowTableReturnFocus();
						}}
						on-keypress={() => {
							dispatch(GRID_UPDATE_SORT, {column, nextDirection});
							nowTableReturnFocus();
						}}
						title={sortLabel}>
						<span data-truncation className={columnResizingClass}>
							{label}
						</span>
						{showAscendingIcon ? (
							<now-icon icon="caret-up-fill" size="sm" />
						) : null}
						{showDescendingIcon ? (
							<now-icon icon="caret-down-fill" size="sm" />
						) : null}
						{isGrouped ? <now-icon icon="folder-outline" size="sm" /> : null}
						{isFiltered ? <now-icon icon="filter-outline" size="sm" /> : null}
					</a>
				) : (
					<span className="hide-cell-filtering">
						<span data-truncation>{label}</span>
						{showAscendingIcon ? (
							<now-icon icon="caret-up-fill" size="sm" />
						) : null}
						{showDescendingIcon ? (
							<now-icon icon="caret-down-fill" size="sm" />
						) : null}
						{isGrouped ? <now-icon icon="folder-outline" size="sm" /> : null}
						{isFiltered ? <now-icon icon="filter-outline" size="sm" /> : null}
					</span>
				)}

				{!hideColumnButton ? (
					<button
						type="button"
						className="sn-grid-popover-trigger"
						aria-haspopup="dialog"
						aria-label={t('Filter {0} column', column.columnData.label)}
						on-click={evt =>
							dispatch(GRID_OPEN_POPOVER, {
								location: getOffset(evt.currentTarget, COLUMN_FILTERING),
								type: COLUMN_FILTERING,
								context: column
							})
						}
						on-focus={checkFocusIn}
						on-blur={checkFocusIn}
					/>
				) : null}
				{!hideColumnResizing ? (
					<div className="slider-container">
						<div
							className="slider-visible"
							role="slider"
							aria-label={t('Resize {0} column', column.columnData.label)}
							aria-valuemin={COL_RESIZE_MIN_WIDTH}
							aria-valuemax="9005"
							aria-valuenow={colWidth}
							on-focus={checkFocusIn}
							on-blur={checkFocusIn}
							tabindex="0"></div>
						<div className="column-resize-guide" />
					</div>
				) : null}
			</div>
		</th>
	);
};
