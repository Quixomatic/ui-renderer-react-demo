import { t } from 'sn-translate';
import { Fragment } from '@servicenow/ui-renderer-snabbdom';
export default class LiveUpdateMessage {
	constructor(userName) {
		this.userName = userName;
	}

	setNewValue(v) {
		// If the user has modified the field value we show a different message.
		this.isUserModified = true;
		this.newValue = v;
	}

	setHideValue(v) {
		this.hideValue = !!v;
	}

	getMessage() {
		let message, messageContent;
		if (this.isUserModified && !this.hideValue) {
			let newValue = this.newValue;
			if (newValue) {
				newValue = (
					<strong>
						<i>{newValue}</i>
					</strong>
				);
				// Show the value that changed
				messageContent = t('{{name}} has set this field to {{value}}')
					.replace('{name}', this.userName)
					.replace('{value}', ''); // Use the cached message containing value but remove the token so we can append html.
				message = {
					content: (
						<Fragment>
							{/* `message` already has a trailing space, don't need another one here */}
							{messageContent}
							{newValue}
						</Fragment>
					),
					label: messageContent + this.newValue
				};
			} else {
				// Say the value was cleared
				messageContent = t(
					'{{name}} has cleared the value of this field'
				).replace('{name}', this.userName);
				message = { content: messageContent, label: messageContent };
			}
		} else {
			messageContent = t('{{name}} has modified this field value').replace(
				'{name}',
				this.userName
			);
			message = { content: messageContent, label: messageContent };
		}
		return message;
	}
}
