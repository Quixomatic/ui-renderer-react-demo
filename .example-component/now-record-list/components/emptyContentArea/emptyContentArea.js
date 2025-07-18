import '@servicenow/now-heading';
import '@servicenow/now-template-message';
import {createCustomElement} from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';
import {t} from 'sn-translate';

import {LIST_TYPE_RELATED} from '../../constants';

import styles from './emptyContent.scss';

const noRecordsLabel = t('No records to display.');

const view = ({properties}) => {
	const {hideEmptyStateImage, listType, headingLevel} = properties;
	const noRecordsHeaderLevel = headingLevel + 1;
	return !hideEmptyStateImage ? (
		<div className="sn-empty-state">
			<now-template-message-empty-state
				heading={{label: noRecordsLabel, level: noRecordsHeaderLevel}}
				illustration={
					listType === LIST_TYPE_RELATED ? 'no-activities' : 'no-data'
				}
			/>
		</div>
	) : (
		<now-heading
			label={noRecordsLabel}
			level={noRecordsHeaderLevel}
			className="sn-empty-state-row"
		/>
	);
};

createCustomElement('sn-record-list-state-empty', {
	renderer: {
		type: snabbdom,
		view
	},
	properties: {
		hideEmptyStateImage: {},
		listType: {},
		headingLevel: {}
	},
	styles
});
