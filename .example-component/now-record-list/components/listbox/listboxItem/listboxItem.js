import rtlBehavior from '@servicenow/behavior-rtl';
import tooltipBehavior from '@servicenow/behavior-tooltip';
import truncationBehavior from '@servicenow/behavior-truncation';
import {actionTypes} from '@servicenow/ui-core';
import {createCustomElement} from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';

import {UPDATE_FOCUS_TRAP} from '../../../constants';

import styles from './listboxItem.scss';
import view from './listboxItemView';

const {COMPONENT_DOM_TREE_READY} = actionTypes;

createCustomElement('sn-record-list-column-filter-choice-listbox-item', {
	renderer: {
		type: snabbdom,
		view
	},
	properties: {
		focused: {default: false},
		highlightValue: {default: ''},
		index: {default: 0},
		model: {
			default: {
				rawValue: 0,
				displayValue: '',
				isDisabled: false
			}
		},
		isSelected: {default: false}
	},
	onPropertiesSet(host) {
		// Scroll into view if focused
		const focusedNode = host.shadowRoot.querySelector('.focused');
		if (focusedNode) {
			const listNode = host.parentNode;
			const top = focusedNode.offsetTop;
			const bottom = top + focusedNode.getBoundingClientRect().height;
			const parentTop = listNode.scrollTop;
			const parentBottom = parentTop + listNode.getBoundingClientRect().height;

			if (bottom > parentBottom || top < parentTop) listNode.scrollTop = top;
		}
	},
	styles,
	actionHandlers: {
		[COMPONENT_DOM_TREE_READY]({dispatch}) {
			dispatch(UPDATE_FOCUS_TRAP);
		}
	},
	behaviors: [rtlBehavior, truncationBehavior, tooltipBehavior]
});
