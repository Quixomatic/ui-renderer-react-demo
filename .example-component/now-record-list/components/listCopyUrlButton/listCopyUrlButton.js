import '@servicenow/now-button';
import {Logger} from '@devsnc/sn-list-commons';
import * as clipboard from 'clipboard-polyfill';
import {t} from 'sn-translate';

import {ARIA_STATUS_MESSAGE} from '../../behaviors/ariaStatusBehavior';
import {METRIC_TRACKED, RECORD_LIST_NOTIFICATION_ADDED} from '../../constants';
import {COPY_LIST_URL_EVENT} from '../../utils/metrics/constants';

const LOG = Logger().createLog('listCopyUrlButton');

const notify = dispatch => {
	const message = t('URL copied to clipboard');
	dispatch(ARIA_STATUS_MESSAGE, {message});
	dispatch(RECORD_LIST_NOTIFICATION_ADDED, {
		alertList: [
			{
				id: `now_alert_positive`,
				status: 'positive',
				content: {
					type: 'string',
					value: message
				},
				action: {type: 'dismiss'}
			}
		]
	});
};

export const createCopyUrlButton = (properties, dispatch) => {
	const {size, variant} = properties;
	const ariaLabel = `${t('Copy URL')}`;
	const ariaConfig = {'aria-label': ariaLabel};

	return (
		<div className={'sn-record-list-header-toolbar-button-copy-url'}>
			<now-button
				tooltip-content={ariaLabel}
				config-aria={ariaConfig}
				icon-name="square-share-outline"
				size={size}
				variant={variant}
				on-click={() => {
					const url = window.location.href;
					clipboard.writeText(url).then(
						() => notify(dispatch, url),
						() => {
							LOG.log('Error ocurred when trying to copy URL to clipboard');
						}
					);
					dispatch(METRIC_TRACKED, {
						eventName: COPY_LIST_URL_EVENT,
						metadata: {url}
					});
				}}
			/>
		</div>
	);
};
