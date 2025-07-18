import '@servicenow/now-template-message';
import {createCustomElement} from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';
import {t} from 'sn-translate';

import styles from './listErrorState.scss';

const label = t(`Can't display this list`);
const content = t('Try contacting your system administrator');

export const view = state => {
	const {properties} = state;
	const {message, extraInfo} = properties;

	return (
		<div className="sn-error-state">
			<div className="sn-error-state-icon">
				<now-template-message-empty-state
					heading={{label, level: '5'}}
					content={content}
					illustration={'error'}
				/>
			</div>
			<div className="sn-error-state-row">
				{message ? <p>{message}</p> : null}
			</div>
			<div className="sn-error-state-row">
				{extraInfo ? <p>{extraInfo}</p> : null}
			</div>
		</div>
	);
};

export default createCustomElement('sn-record-list-state-error', {
	renderer: {
		type: snabbdom,
		view
	},
	properties: {
		message: {},
		extraInfo: {}
	},
	styles
});
