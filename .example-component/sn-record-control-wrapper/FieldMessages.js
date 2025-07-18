// 3rd party imports
import classNames from 'classnames';
import { isEmpty, reduce, some } from 'lodash';
import { createCustomElement } from '@servicenow/ui-core';
import '@servicenow/now-icon';
import style from './controlwrapper.scss';
import { FIELD_MESSAGE_TYPES } from '@devsnc/sn-controls-common';

/**
 * Utility function that returns message group markup
 * @param {String} type type of message we want to pass in
 * @param {Array} messages array of strings to display
 * @returns {Element} returns an element containing all messages
 */
const getMessages = function (type, messages) {
	if (!Array.isArray(messages) || messages.length == 0) return null;
	let wrapperClass, iconType;
	switch (type) {
		case 'info':
			wrapperClass = 'info';
			iconType = 'info-circle-outline';
			break;
		case 'success':
			wrapperClass = 'success';
			iconType = 'info-circle-outline';
			break;
		case 'error':
			wrapperClass = 'danger';
			iconType = 'circle-exclamation-outline';
			break;
		case 'warning':
			wrapperClass = 'warning';
			iconType = 'exclamation-triangle-outline';
			break;
		case 'liveUpdate':
			wrapperClass = 'info';
			iconType = 'heartbeat-outline';
			break;
		default:
			wrapperClass = 'suggestion';
			break;
	}

	const template = (
		<div
			key={type}
			className={classNames('sn-control-message', `-${wrapperClass}`, {
				'-multi': Array.isArray(messages) && messages.length > 1
			})}
		>
			{messages.map((message, i) => {
				if (type === 'warning' && message.isUserModified) {
					message = message.getMessage().label;
				} else {
					message = message.getMessage ? message.getMessage() : message;
					if (type === 'liveUpdate') message = message.content;
				}

				return (
					<div className="sn-control-message-row" key={i} role="alert">
						<div className="sn-control-message-content -static">
							{iconType && <now-icon size="sm" icon={iconType} />}
						</div>
						<div className="sn-control-message-content">
							<span>{message}</span>
						</div>
					</div>
				);
			})}
		</div>
	);
	return template;
};

/**
 * This function returns the aria labels for each type of message.
 * This is needed because liveUpdate messages are different than
 * other message types in that they are objects not strings. This
 * ensures we get the correct aria label for the message.
 * @param {array} messages array of message objects
 * @param {string} type type of messages in the array
 * @returns {array} returns
 */
const getLabels = function (messages, type) {
	return type === 'liveUpdate'
		? messages.map(message => message.getMessage().label)
		: messages;
};

/**
 * utility function that maps the array of messages into a messag map we use for rendering
 * @param {array} messages array of message objects
 * @returns {object} returns an object where types are keys
 */
const getMessageMap = function (messages) {
	return messages.reduce((result, { type, message }) => {
		if (!isEmpty(type) && !isEmpty(message)) {
			if (Array.isArray(result[type])) {
				result[type].push(message);
			} else {
				result[type] = [message];
			}
		}
		return result;
	}, {});
};

/**
 * utility that determines if any relevant messages exist in the messageMap
 * @param {object} messageMap object of message type arrays
 * @returns {boolean}
 */
const hasMessages = messageMap =>
	some(FIELD_MESSAGE_TYPES, s => !isEmpty(messageMap[s]));

/**
 * component that renders the message container and relevant messages
 * @param {object} props
 * @returns {ReactElement}
 */
const FieldMessages = function (props) {
	let { messages, id } = props;
	if (!messages || messages.length == 0) return null;

	const messageMap = getMessageMap(props.messages);
	if (!hasMessages(messageMap)) return null;

	const { labels, elements } = reduce(
		FIELD_MESSAGE_TYPES,
		({ labels, elements }, type) => {
			const messageMapResult = messageMap[type];
			if (messageMapResult) {
				elements.push(getMessages(type, messageMapResult));
				const label = getLabels(messageMapResult, type);
				labels.push(label.join(', '));
			}

			return { labels, elements };
		},
		{
			labels: [],
			elements: []
		}
	);

	return (
		<div
			className={classNames('sn-control-messages')}
			id={id}
			aria-label={labels.join(', ')}
		>
			{elements}
		</div>
	);
};

export { getMessages, getMessageMap, hasMessages };
export default FieldMessages;

/**
 * This component is used to display messages of several types (info, warning,
 * success, error). The mesages are used to notify the user. This
 * component was meant to be used by the controls team only.
 *
 * Example:
 * ```js
 * <sn-record-controls-internal-field-messages
 *		messages={[
 *			{ type: 'info', message: 'This is an info message' },
 *			{ type: 'warning', message: 'This is an warning message' },
 *			{ type: 'success', message: 'This is an success message' },
 *			{ type: 'error', message: 'This is an error message' }
 *		]}
 *	/>
 * ```
 */
createCustomElement('sn-record-controls-internal-field-messages', {
	styles: style,
	properties: {
		/**
		 *  array of message objects that must contain type and message itself.
		 */
		messages: {},
		/**
		 * id of parent object
		 */
		id: {},
		/**
		 * Specifies that the field should be rendered right-to-left.
		 * When passed as a string, "true" (case-sensitive) will be treated like
		 * boolean true.
		 */
		reversed: {}
	},
	view: ({ properties }) => FieldMessages(properties)
});
