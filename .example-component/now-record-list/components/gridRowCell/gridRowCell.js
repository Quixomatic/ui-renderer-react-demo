import '@servicenow/now-highlighted-value';
import '@servicenow/now-icon';
import {focusWithinClassManager} from '@devsnc/sn-list-commons';
import {
	Fragment,
	dangerouslyCreateElementFromString
} from '@servicenow/ui-renderer-snabbdom';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import merge from 'lodash/merge';
import truncate from 'lodash/truncate';
import {t} from 'sn-translate';

import {FOCUS_RESET} from '../../behaviors/constants';
import {
	CELL_FILTERING,
	DEFAULT_COLOR,
	DEFAULT_VARIANT,
	GLIDE_DOCUMENT_ID,
	GLIDE_REFERNCE,
	GLIDE_URL,
	GRID_OPEN_POPOVER,
	INLINE_EDITING_RESET_FOCUSED_CELLS,
	KEY_ENTER,
	LIVE_LIST_ITEM_CHANGED,
	LIVE_LIST_ITEM_ENTERED,
	OPEN_RECORD
} from '../../constants';
import {KEY_CODE_ENTER, KEY_SPACEBAR} from '../cellFiltering/constants';
import {
	getColumnType,
	getOffset,
	shouldHideFilterFromInternalType
} from '../grid/gridUtils';

export const isReference = internalType => {
	return internalType === GLIDE_REFERNCE;
};

const isDocumentId = internalType => {
	return internalType === GLIDE_DOCUMENT_ID;
};

export const isURLField = internalType => internalType === GLIDE_URL;

export const getHref = ({cell, internalType}) => {
	const cellValue = get(cell, 'columnData.value', '');
	if (!isURLField(internalType)) return 'javascript:void(0)';
	return `${cellValue}`;
};

export const checkIsLink = ({
	cellDisplayValue,
	isFirstCell,
	isRefList,
	internalType,
	rowCell,
	isFirstNonReference,
	hideLinks
}) => {
	if (hideLinks) return false;

	if (isRefList) return isFirstCell;

	if (isFirstNonReference) return true;

	if (isURLField(internalType)) return true;

	if (isDocumentId(internalType) && get(rowCell, 'documentIdReference'))
		return true;

	if (!isReference(internalType)) return isFirstCell;

	return !!cellDisplayValue;
};

export const buildLiveIndicator = () => (
	<now-icon data-key="liveIndicator" icon="presence-fill" size="sm" />
);

export const buildMultiEditFailedIndicator = () => (
	<now-icon
		data-key="multiEditFailedFieldIndicator"
		icon="presence-fill"
		size="sm"
	/>
);

const buildFilter = (dispatch, rowCellIndex, cell, cellDisplayValue) => (
	<button
		type="button"
		aria-haspopup="menu"
		aria-label={t(`Filter {0} cell`, cellDisplayValue)}
		className="sn-grid-popover-trigger"
		data-ancillary="true"
		on-click={evt => {
			dispatch(GRID_OPEN_POPOVER, {
				location: getOffset(evt.currentTarget, CELL_FILTERING),
				type: CELL_FILTERING,
				context: cell
			});
		}}
	/>
);
/**
 * returns highlighted text matched with given pattern and color
 * @param {string} tooltipText (before truncation)
 * @param {string} truncatedText (after truncation)
 * @returns {object} dataTruncation object
 */
export const getDataTruncationAttributes = (truncatedText, tooltipText) => {
	const isTruncated = tooltipText !== truncatedText ? true : false;
	const dataTruncation = {
		'data-truncationignoretabindex': true,
		'data-truncation': true
	};
	if (isTruncated) {
		dataTruncation['data-truncationforcetooltip'] = isTruncated;
		dataTruncation['data-truncationtext'] = tooltipText;
	}
	return dataTruncation;
};

//
/**
 * returns highlighted text matched with given pattern and color
 * @param  {object} highlightContent
 * @param  {string} displayValue
 * @returns {string} highlightedDisplayValue
 */
export const getHighlightedDisplayValue = ({
	highlightContent,
	cellDisplayValue,
	wordWrapClassName,
	truncatedDisplayValue
}) => {
	const patterns = get(highlightContent, 'patterns', []);
	const highlightColor = get(highlightContent, 'color', null);

	if (!patterns.length)
		return {didStringChange: false, highlightedElement: null};

	let highlightedDisplayValue = truncatedDisplayValue;

	// sorts the patterns array with longest string first
	const patternWords = patterns.sort((a, b) => b.length - a.length).join('|');

	// create regular expression with given pattern
	// g stands for global search on the entire string
	// i stands for case insensitive search
	const highLightRegex = new RegExp(patternWords, 'gi');
	const patternReplacer = match =>
		`<mark style="background-color:${highlightColor}">${match}</mark>`;

	highlightedDisplayValue = highlightedDisplayValue.replace(
		highLightRegex,
		patternReplacer
	);
	const dataTruncationAttributes = getDataTruncationAttributes(
		cellDisplayValue,
		truncatedDisplayValue
	);
	const stringifiedDataAttributes = convertObjectToAttributes(
		dataTruncationAttributes
	);
	const htmlString = `<span class="highlightedContentContainer ${wordWrapClassName}" ${stringifiedDataAttributes}>${highlightedDisplayValue}</span>`;
	return {
		didStringChange: highlightedDisplayValue !== truncatedDisplayValue,
		highlightedElement: dangerouslyCreateElementFromString(htmlString)
	};
};

const convertObjectToAttributes = object => {
	const str = JSON.stringify(object);
	let result = '';

	for (let index = 0; index < str.length; index++) {
		const char = str[index];

		if (!['{', '}', '"'].includes(char)) {
			result += char === ':' ? '=' : char === ',' ? ' ' : char;
		}
	}

	return result;
};

export const generateInnerContents = ({
	buildLiveIndicator,
	buildMultiEditFailedIndicator,
	didStringChange = false,
	displayValue,
	hasCellChange,
	hideHighlightedValues,
	highlightedElement,
	inlineMultiEditFailed,
	isLink,
	createLinkProps,
	showIcon,
	status,
	value,
	iconName,
	colorName,
	variantName,
	wordWrapClassName,
	cellDisplayValue
}) => {
	const dataTruncationAttributes = getDataTruncationAttributes(
		cellDisplayValue,
		displayValue
	);
	let innerContent = (
		<Fragment>
			<span {...dataTruncationAttributes} className={wordWrapClassName}>
				{!hideHighlightedValues && value && !isLink ? (
					<now-highlighted-value
						label={value}
						status={!colorName ? status : null}
						showIcon={showIcon}
						variant={variantName ? variantName : DEFAULT_VARIANT}
						color={colorName ? colorName : DEFAULT_COLOR}
						icon={showIcon ? iconName : null}
					/>
				) : (
					createLinkElement({content: displayValue, createLinkProps})
				)}
			</span>
		</Fragment>
	);

	if (didStringChange) {
		innerContent = (
			<Fragment>
				{createLinkElement({content: highlightedElement, createLinkProps})}
			</Fragment>
		);
	}
	return (
		<Fragment>
			{innerContent}
			{inlineMultiEditFailed ? buildMultiEditFailedIndicator() : null}
			{hasCellChange ? buildLiveIndicator() : null}
		</Fragment>
	);
};

const createLinkElement = ({content, createLinkProps}) => {
	const {
		isLink,
		hideLinks,
		rowMetaData,
		rowCellData,
		dispatch,
		href
	} = createLinkProps;

	const openRecord = evt => {
		dispatch(FOCUS_RESET);
		dispatch(INLINE_EDITING_RESET_FOCUSED_CELLS);
		dispatch(OPEN_RECORD, {
			evt,
			row: rowMetaData,
			cell: rowCellData
		});
	};
	return isLink && !hideLinks ? (
		<a
			style={{'flex-grow': 1}}
			target="_blank"
			href={href}
			on-click={evt => {
				evt.preventDefault();
				openRecord(evt);
			}}
			on-keypress={evt => {
				if (
					evt.key === KEY_ENTER ||
					evt.key === KEY_SPACEBAR ||
					evt.keyCode === KEY_CODE_ENTER
				) {
					evt.preventDefault();
					openRecord(evt);
				}
			}}>
			{content}
		</a>
	) : (
		content
	);
};

export const buildContents = ({
	boldRow,
	cell,
	checkFocusIn,
	column,
	dispatch,
	displayValue,
	hideHighlightedValues,
	hideLinks,
	hideLiveList,
	highlightedValue,
	highlightContent,
	internalType,
	isLink,
	maxCharLimit,
	row,
	wordWrap
}) => {
	const {value, status, showIcon, iconName, variantName, colorName} =
		highlightedValue || {};
	const classes =
		'cell-content-container' +
		(boldRow && !hideLiveList ? ' content-changed' : '');
	const truncatedDisplayValue = truncate(displayValue, {length: maxCharLimit});
	const {didStringChange, highlightedElement} = getHighlightedDisplayValue(
		highlightContent,
		truncatedDisplayValue
	);
	const wordWrapClassName = wordWrap ? '-wordwrap' : '-truncated';

	const {rowMetaData} = row;
	const rowCellData = row[column.field];
	const href = getHref({cell, internalType});

	const createLinkProps = {
		isLink,
		hideLinks,
		rowMetaData,
		rowCellData,
		classes,
		dispatch,
		href
	};

	const innerContents = generateInnerContents({
		createLinkProps,
		displayValue: truncatedDisplayValue,
		hideHighlightedValues,
		isLink,
		showIcon,
		status,
		value,
		variantName,
		iconName,
		colorName,
		highlightedElement,
		didStringChange,
		wordWrapClassName
	});

	const contents = <div className={classes}>{innerContents}</div>;

	if (isLink && !hideLinks) {
		return (
			<a
				target="_blank"
				href={href}
				on-focus={checkFocusIn}
				on-blur={checkFocusIn}
				on-click={evt => {
					if (!isURLField(internalType)) {
						evt.preventDefault();
						dispatch(OPEN_RECORD, {
							evt,
							row,
							cell
						});
					}
				}}>
				{contents}
			</a>
		);
	} else {
		return contents;
	}
};

const buildCellContentByType = ({
	cell: rowCell,
	cellIndex,
	column,
	dispatch,
	hideCellFilter,
	hideHighlightedValues,
	hideLinks,
	hideLiveList,
	highlightedValue,
	highlightContent,
	isFirstNonReference,
	isRefList,
	liveListUpdate,
	maxCharLimit,
	row,
	rowCellIndex,
	wordWrap
}) => {
	const isFirstCell = cellIndex === 0;
	const {internalType = ''} = column;
	const hideFilter = shouldHideFilterFromInternalType(internalType);

	const liveListUpdateType = get(liveListUpdate, 'liveListType', '');
	const boldRow =
		liveListUpdateType === LIVE_LIST_ITEM_ENTERED ||
		liveListUpdateType === LIVE_LIST_ITEM_CHANGED;

	const liveListColumn = get(liveListUpdate, `${column.columnName}`);
	const hasCellChange =
		!isEmpty(liveListUpdate) &&
		!isEmpty(liveListColumn) &&
		liveListUpdateType !== LIVE_LIST_ITEM_ENTERED;

	const cell = hasCellChange
		? merge(rowCell, {columnData: {...liveListColumn}})
		: rowCell;
	let {
		columnData: {displayValue: cellDisplayValue}
	} = cell;

	const isNumeric = getColumnType(column) === 'numeric';
	const className = isNumeric ? 'sn-text-link -number' : 'sn-text-link';
	const rowCellColumnData = get(rowCell, 'columnData', '');

	const isLink = checkIsLink({
		cell: column,
		rowCell: rowCellColumnData,
		cellDisplayValue,
		isRefList,
		isFirstCell,
		internalType,
		isFirstNonReference,
		hideLinks
	});

	if (!cellDisplayValue && (isFirstNonReference || isReference(internalType))) {
		cellDisplayValue = `${t('(empty)')}`;
	}

	let containerRef = null;
	const checkFocusIn = evt => {
		let focusIsWithin;
		if ('focus' === evt.type) focusIsWithin = true;
		else if ('blur' === evt.type) focusIsWithin = false;

		focusWithinClassManager(containerRef, '-focus-within', focusIsWithin);
	};

	return (
		<div
			ref={el => {
				containerRef = el;
			}}
			className={className}>
			{buildContents({
				boldRow,
				cell,
				checkFocusIn,
				column,
				dispatch,
				displayValue: cellDisplayValue,
				hasCellChange,
				hideHighlightedValues,
				hideLinks,
				hideLiveList,
				highlightedValue,
				highlightContent,
				internalType,
				isLink,
				maxCharLimit,
				row,
				wordWrap
			})}
			{!hideCellFilter && !isRefList && !hideFilter
				? buildFilter(dispatch, rowCellIndex, cell, cellDisplayValue)
				: null}
		</div>
	);
};

export const renderGridRowCellContents = state => {
	const {
		cell,
		cellIndex,
		column,
		dispatch,
		elementSysId,
		hideCellFilter,
		hideHighlightedValues,
		hideLinks,
		hideLiveList,
		highlightedValue,
		highlightContent,
		isFirstNonReference,
		liveListUpdate,
		maxCharLimit,
		popover,
		row,
		rowCellIndex,
		tableName,
		wordWrap
	} = state;

	const content = buildCellContentByType({
		cell,
		cellIndex,
		column,
		dispatch,
		elementSysId,
		hideCellFilter,
		hideHighlightedValues,
		hideLinks,
		hideLiveList,
		highlightedValue,
		highlightContent,
		isFirstNonReference,
		liveListUpdate,
		maxCharLimit,
		popover,
		row,
		rowCellIndex,
		tableName,
		wordWrap
	});

	return (
		<div
			key={`cell_${rowCellIndex}_content`}
			className={`sn-list-grid-cell ${false && 'is-focus'}`}>
			{content}
		</div>
	);
};
