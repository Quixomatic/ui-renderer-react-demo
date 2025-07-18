import '../lastRefreshed/lastRefreshed';
import '@servicenow/now-badge';
import '@servicenow/now-heading';
import '@servicenow/now-icon';
import '@servicenow/now-tooltip';
import {createCustomElement} from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';
import {t} from 'sn-translate';

import {
	HEADER_PRIMARY,
	HEADER_SECONDARY,
	HEADER_TERTIARY,
	LIST_COUNT_STATUS,
	LIST_HEADER_SIZE_DEFAULT,
	SIZE_LARGE,
	SIZE_MEDIUM,
	SIZE_SMALL,
	LIST_COUNT_ERROR_MESSAGE
} from '../../constants';

import styles from './listHeaderTitle.scss';

const renderRecordCount = ({state, badgeSize}) => {
	const {
		properties: {
			hideTitleRowCount,
			omitCount,
			finalCount,
			headerSize,
			listCount: {totalRecordCount, status},
			listTitle
		}
	} = state;

	const hideBadge = !!hideTitleRowCount || !!omitCount ? true : false;

	if (hideBadge) return null;

	if (status === LIST_COUNT_STATUS.ERROR) {
		return (
			<now-icon
				className="error"
				icon-="circle-exclamation-outline"
				size={headerSize}
				configAria={{'aria-label': LIST_COUNT_ERROR_MESSAGE}}
			/>
		);
	}

	if (status === LIST_COUNT_STATUS.FETCHING) {
		const className = `loading -${badgeSize}`;
		return (
			<div className={className}>
				<now-icon icon="loader-fill" size={badgeSize} spin />
			</div>
		);
	}

	const count =
		omitCount && !finalCount ? `${totalRecordCount}+` : totalRecordCount;

	const isSingleRecord = +count === 1;

	return (
		<div>
			<now-badge
				size={badgeSize}
				status="low"
				value={count}
				variant="secondary"
				aria-hidden="true"
			/>
			<span className="sr-only">
				{isSingleRecord
					? t('{0} {1} record', count, listTitle)
					: t('{0} {1} records', count, listTitle)}
			</span>
		</div>
	);
};

const view = state => {
	const {
		properties: {
			ariaTitle,
			listTitle,
			children,
			hideLastRefreshedText,
			headerTitleProps,
			hideTitle,
			headerSize,
			headingLevel,
			liveLists
		}
	} = state;

	const {dataUpdatedTime} = headerTitleProps;
	const titleClass = 'sn-list-header-title -' + headerSize;

	let badgeSize;
	let headingVariant;

	switch (headerSize) {
		case SIZE_LARGE:
			headingVariant = HEADER_PRIMARY;
			badgeSize = SIZE_MEDIUM;
			break;
		case SIZE_SMALL:
			headingVariant = HEADER_TERTIARY;
			badgeSize = SIZE_SMALL;
			break;
		case SIZE_MEDIUM:
		default:
			headingVariant = HEADER_SECONDARY;
			badgeSize = SIZE_MEDIUM;
			break;
	}

	return (
		<div className={titleClass}>
			<div className="sn-list-header-title-container">
				{!hideTitle ? (
					<now-heading
						aria-label={ariaTitle}
						label={listTitle}
						level={headingLevel.toString()}
						variant={headingVariant}
						hasNoMargin={true}
						aria-level={headingLevel}
					/>
				) : null}
				{renderRecordCount({state, badgeSize})}
			</div>
			{children}
			{!hideLastRefreshedText ? (
				<sn-record-list-last-refreshed-text
					dataUpdatedTime={dataUpdatedTime}
					liveLists={liveLists}
				/>
			) : null}
		</div>
	);
};

createCustomElement('sn-record-list-header-title', {
	renderer: {
		type: snabbdom,
		view
	},
	properties: {
		hideLastRefreshedText: {},
		hideTitle: {},
		hideTitleRowCount: {},
		ariaTitle: {default: ''},
		children: {default: []},
		listCount: {default: {}},
		headerTitleProps: {default: {}},
		listTitle: {default: ''},
		titleRef: {},
		headerSize: {default: LIST_HEADER_SIZE_DEFAULT},
		headingLevel: {default: 1},
		omitCount: {default: false},
		finalCount: {default: false},
		liveLists: {default: false}
	},
	styles: styles
});
