import { createCustomElement } from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';
import view from './view';
import { formEnvironmentActions, modalActions } from './actions';
import { formEnvironmentHandlers } from './formEnvironmentHandlers';
import modalActionHandlers from './modalActionHandlers';
import {
	MULTI_ROW_FORM_MODAL_CLOSED,
	FIELDS,
	VARIABLES_LAYOUT,
	IS_LOADING,
	G_FORM,
	NOTIFICATIONS,
	FORM_DATA
} from './constants';
import styles from './multiRowModal.scss';
import { notificationHandlers } from './notificationHandlers';
import { gFormActionHandlers } from './gFormActions';

createCustomElement('sn-catalog-form-multi-row-form-modal', {
	renderer: { type: snabbdom },
	view,
	properties: {
		active: {
			default: false
		},
		action: {
			value: 'add'
		},
		rowData: {
			default: {}
		},
		rowId: {
			default: ''
		},
		sourceTable: {
			default: ''
		},
		sourceId: {
			default: ''
		},
		variableSetId: {
			default: ''
		},
		catalogItemId: {
			default: ''
		},
		parentFields: {
			default: {}
		},
		variableSetName: {
			default: ''
		},
		onModalCloseActionType: {
			default: MULTI_ROW_FORM_MODAL_CLOSED
		}
	},
	actions: {
		...gFormActionHandlers.actions,
		...formEnvironmentActions,
		...modalActions
	},
	actionHandlers: {
		...gFormActionHandlers.actionHandlers,
		...formEnvironmentHandlers,
		...modalActionHandlers,
		...notificationHandlers
	},
	initialState: {
		[IS_LOADING]: true,
		[FIELDS]: {},
		[VARIABLES_LAYOUT]: {},
		[G_FORM]: {},
		/**
		 * Currently only messages fired from CATALOG_FORM
		 * Does not yet support any backend session messages
		 */
		[NOTIFICATIONS]: [],
		[FORM_DATA]: []
	},
	styles
});
