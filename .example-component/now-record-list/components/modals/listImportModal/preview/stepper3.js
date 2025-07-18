import '@servicenow/now-loader';
import {createCustomElement} from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';

import {IMPORT_MODAL_MESSAGES} from '../../../../constants';
import {default as flags} from '../../../featureFlags/snapshot';
import styles from '../../styles.scss';

import {default as actionHandlers} from './actions';
import {getPreviewFeatureFlags} from './previewUtils';

const view = state => {
	const {properties, previewData} = state;
	const {columns, tableName} = previewData;
	return (
		<div slot="content" className="height-100-percent">
			<div className="import-spacing-xxl list-import-preview-heading">
				{IMPORT_MODAL_MESSAGES.PREVIEW_HEADING_MSG}
			</div>
			<div slot="content" className="import-spacing-xxl list-import-table">
				<now-record-list-connected
					columns={columns}
					table={tableName}
					query={`sys_import_set=${properties.importSetId}`}
					{...getPreviewFeatureFlags(properties)}
				/>
			</div>
		</div>
	);
};

createCustomElement('sn-record-list-modal-import-preview', {
	renderer: {
		type: snabbdom,
		view
	},
	initialState: {
		componentLoaded: false,
		previewData: {}
	},
	properties: {importSetId: ''},
	actionHandlers,
	styles,
	behaviors: [flags]
});
