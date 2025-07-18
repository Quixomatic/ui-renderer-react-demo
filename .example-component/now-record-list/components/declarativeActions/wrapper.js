import resizeBehavior from '@servicenow/behavior-resize';
import {createCustomElement} from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';

import view from './views/wrapperView';
import styles from './wrapper.scss';

const ELEMENT_RESIZED = 'NOW_RESIZE#ELEMENT_RESIZED';

const getIconBar = host => {
	return host.shadowRoot.firstChild;
};

createCustomElement('sn-record-list-declarative-actions-wrapper', {
	renderer: {
		type: snabbdom,
		view
	},
	properties: {
		hideDeclarativeActions: {default: true},
		toolbarProps: {default: {}, schema: {type: 'object'}, deepCompare: true},
		declarativeActions: {
			default: [],
			schema: {type: 'array'},
			deepCompare: true
		},
		daModel: {default: {}, schema: {type: 'object'}, deepCompare: true},
		isWorkspace: {default: false},
		dynamicEvaluationEnabled: {default: false},
		table: {default: ''},
		parentTable: {default: ''},
		parentRecordSysId: {default: ''},
		selectedRecords: {default: [], schema: {type: 'array'}, deepCompare: true},
		editedRecords: {default: [], schema: {type: 'array'}, deepCompare: true},
		cellUpdatedOn: {default: null},
		recordSysIds: {default: [], schema: {type: 'array'}, deepCompare: true},
		allRecordsSelected: {default: false},
		conditions: {default: ''},
		refreshRequested: {default: null}
	},
	behaviors: [
		{
			behavior: resizeBehavior,
			options: {
				preventRenderUntilSizeAvailable: true,
				preventRender: {
					height: true
				},
				timer: {
					type: 'debounce',
					leading: true
				}
			}
		}
	],
	actionHandlers: {
		[ELEMENT_RESIZED]: ({updateState, action, host}) => {
			const {width} = action.payload;
			let actionBarWidth = width;
			if (actionBarWidth) {
				const iconBar = getIconBar(host);
				const iconBarWidth = iconBar
					? iconBar.getBoundingClientRect().width
					: 0;
				actionBarWidth -= iconBarWidth;
				updateState({actionBarWidth});
			}
		}
	},
	styles
});
