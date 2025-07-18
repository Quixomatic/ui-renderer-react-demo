import {
	CATALOG_FORM_UI_MESSAGE_SET,
	CATALOG_FORM_UI_MESSAGES_CLEARED
} from './actions';

export const createUIMessageHandler = dispatch => (
	g_form,
	messageType,
	message
) => {
	let notificationItem;
	switch (messageType) {
		default:
			return false;
		case 'mandatoryMessage':
			notificationItem = createUIMessageItem('critical', message);
			break;
		case 'clearMessages':
			dispatch(CATALOG_FORM_UI_MESSAGES_CLEARED, []);
			return true;
		case 'infoMessage':
			notificationItem = createUIMessageItem('info', message);
			break;
		case 'errorMessage':
			notificationItem = createUIMessageItem('critical', message);
			break;
		case 'warningMessage':
			notificationItem = createUIMessageItem('warning', message);
			break;
	}
	dispatch(CATALOG_FORM_UI_MESSAGE_SET, notificationItem);
	return true;
};

const createUIMessageItem = (status, message) => {
	let content = message;
	if (message && message.match(/\n/g)) {
		content = {
			type: 'html',
			value: `<div>${message.replace(/\n/g, '<br>')}</div>`
		};
	}
	return {
		action: {
			type: 'dismiss'
		},
		content,
		expanded: true,
		header: '',
		icon: '',
		manageExpanded: true,
		status
	};
};
