import '@servicenow/now-badge';
import '@servicenow/now-button';

import {t} from 'sn-translate';

import {REFRESH_BUTTON_CLICKED} from '../../constants';

const REFRESH_LIST = t('Refresh List');

export const createRefreshButton = (properties, dispatch) => {
	const {
		size,
		variant,
		bare,
		liveListCount,
		liveLists,
		hideLiveList,
		listTitle
	} = properties;
	const refreshAriaLabel = `${REFRESH_LIST}`;
	const liveListsAriaLabel = liveLists
		? t(`Refresh List ${listTitle} (${liveListCount} updates available)`)
		: refreshAriaLabel;
	const ariaConfig = {
		'aria-label': liveListsAriaLabel
	};

	return (
		<div className={`sn-record-list-header-toolbar-button-refresh -${size}`}>
			<div className={'with-badge'}>
				<now-button
					tooltip-content={REFRESH_LIST}
					config-aria={ariaConfig}
					icon-name="sync-outline"
					size={size}
					variant={variant}
					bare={bare}
					on-click={() => {
						dispatch(REFRESH_BUTTON_CLICKED);
					}}
				/>
				{!hideLiveList && liveListCount > 0 ? (
					<now-badge
						size="sm"
						status="info"
						value={liveListCount}
						variant="secondary"
						round
					/>
				) : null}
			</div>
		</div>
	);
};
