import {createCustomElement} from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';

import styles from './listbox.scss';
import actionHandlers from './listboxActions';
import {listboxKeyControls} from './listboxBehavior/listboxBehavior';
import view from './listboxView';

createCustomElement('sn-record-list-column-filter-choice-listbox', {
	renderer: {
		type: snabbdom,
		view
	},
	behaviors: [listboxKeyControls],
	properties: {
		choices: {default: []},
		selectedChoices: {default: []},
		highlightValue: {default: ''},
		label: {default: ''}
	},
	actionHandlers,
	styles
});
