import '../../../listLoader/listLoader';
import {createCustomElement} from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';

import {LIST_LOADER_SIZE_LG} from '../../../../constants';

import styles from './loadingOverlay.scss';

const view = ({properties: {size}}) => (
	<div className="sn-list-loading-container">
		<sn-record-list-loader className="loader-container" size={size} />
	</div>
);

createCustomElement('now-grid-overlay-loader', {
	renderer: {
		type: snabbdom,
		view
	},
	properties: {
		size: {
			default: LIST_LOADER_SIZE_LG
		}
	},
	styles
});
