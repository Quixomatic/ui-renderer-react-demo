import { isEmpty, reduce, isArray } from 'lodash';
import { FIELD_MESSAGE_TYPES } from '../constants';
import { t } from 'sn-translate';
import { Fragment } from '@servicenow/ui-renderer-snabbdom';

const getMessages = (type, messages) =>
	messages.map(message => {
		let status, icon;
		switch (type) {
			case 'info':
			case 'success':
				status = 'info';
				icon = 'info-circle-outline';
				break;
			case 'error':
				status = 'critical';
				icon = 'circle-exclamation-outline';
				break;
			case 'warning':
				status = 'warning';
				icon = 'exclamation-triangle-outline';
				break;
			case 'liveUpdate':
				status = 'info';
				icon = 'heartbeat-outline';
				break;
			default:
				status = 'suggestion';
				break;
		}
		return {
			status,
			icon,
			content: message
		};
	});

const getLiveUpdateMessage = liveUpdate => {
	let message;
	if (liveUpdate.isUserModified) {
		let newValue = liveUpdate.newValue;
		if (newValue) {
			newValue = (
				<strong>
					<i>{newValue}</i>
				</strong>
			);
			// Show the value that changed
			message = t('{{name}} has set this field to {{value}}')
				.replace('{name}', liveUpdate.userName)
				.replace('{value}', ''); // Use the cached message containing value but remove the token so we can append html.
			message = (
				<Fragment>
					{/* `message` already has a trailing space, don't need another one here */}
					{message}
					{newValue}
				</Fragment>
			);
		} else {
			// Say the value was cleared
			message = t('{{name}} has cleared the value of this field').replace(
				'{name}',
				liveUpdate.userName
			);
		}
	} else {
		message = t('{{name}} has modified this field value').replace(
			'{name}',
			liveUpdate.userName
		);
	}
	return message;
};

const parsedFieldMessages = function (messages) {
	return messages.reduce((result, { type, message }) => {
		message = message.getMessage ? getLiveUpdateMessage(message) : message;

		if (!isEmpty(type) && !isEmpty(message)) {
			if (isArray(result[type])) {
				result[type].push(message);
			} else {
				result[type] = [message];
			}
		}
		return result;
	}, {});
};

export const transformMessages = messages => {
	if (!messages || messages.length == 0) return [];

	const messageMap = parsedFieldMessages(messages);

	return [].concat(
		...reduce(
			FIELD_MESSAGE_TYPES,
			(elements, type) => {
				if (messageMap[type]) {
					elements.push(getMessages(type, messageMap[type]));
				}

				return elements;
			},
			[]
		)
	);
};

export const pushInfoMessageForDependentFields = (messages, label) => {
	const message = t('Select a {0} before modifying this field.', label);
	return [
		...messages,
		{
			type: 'info',
			message
		}
	];
};

export const transformDescriptionAndMessages = (description, messages) =>
	description
		? [{ content: description }, ...transformMessages(messages)]
		: transformMessages(messages);
