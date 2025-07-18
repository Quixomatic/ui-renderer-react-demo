import '@servicenow/now-loader';
import {createCustomElement} from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';

import {LIST_LOADER_SIZE_LG} from '../../constants';
import styles from '../list/list.scss';

const view = ({properties: {size}}) => <now-loader size={size} />;

createCustomElement('sn-record-list-loader', {
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
