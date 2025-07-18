import _ from 'lodash';
import { NOW_ALERT_ITEM_CLICKED } from './constants';
import {
	CATALOG_FORM_UI_MESSAGES_CLEARED,
	CATALOG_FORM_UI_MESSAGE_SET
} from '../library-catalog-form/actions';

export const notificationHandlers = {
	[CATALOG_FORM_UI_MESSAGE_SET]: {
		effect({ state, updateState, action }) {
			const { notifications } = state;
			let item = action.payload;
			item.id = 'multi-row-form-modal-alert-' + notifications.length;
			updateState({
				path: 'notifications',
				value: item,
				operation: 'push'
			});
		}
	},
	[CATALOG_FORM_UI_MESSAGES_CLEARED]: {
		effect({ updateState }) {
			updateState({
				operation: 'set',
				value: [],
				path: 'notifications'
			});
		}
	},
	[NOW_ALERT_ITEM_CLICKED]: {
		effect({ state, updateState, action }) {
			let spliceIndex = _.findIndex(
				state.notifications,
				item => item.id === action.payload.alertId
			);
			updateState({
				path: 'notifications',
				start: spliceIndex,
				deleteCount: 1,
				operation: 'splice'
			});
		}
	}
};
