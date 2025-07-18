import {intentLocalStorageKeys} from '../../constants';
import {appendToSessionStorage} from '../utils';

export default (translators) => ({
	handleSendContext(translatorId = '') {
		sessionStorage.setItem(
			intentLocalStorageKeys.updateContext,
			JSON.stringify({
				translatorId,
				context: translators[translatorId]?.context ?? null
			})
		);
	},

	handleSendSystemMessage(translatorId = '', generator, message) {
		sessionStorage.setItem(
			intentLocalStorageKeys.sendSystemMessage,
			JSON.stringify({
				translatorId,
				message
			})
		);
	},

	handleSendIntentFeedback(
		translatorId = '',
		generator,
		originalIntent,
		status,
		message
	) {
		const values = appendToSessionStorage(
			intentLocalStorageKeys.sendIntentFeedback,
			{
				translatorId,
				originalIntent,
				status,
				message
			}
		);
		sessionStorage.setItem(intentLocalStorageKeys.sendIntentFeedback, values);
	},

	handleRequestConversationWithSkill(
		translatorId = '',
		generator,
		skillId,
		params
	) {
		sessionStorage.setItem(
			intentLocalStorageKeys.requestConversationWithSkill,
			JSON.stringify({
				translatorId,
				skillId,
				params
			})
		);
	},

	setNext() {
		console.warn(
			`Session storage handler does not support next handler, since it is the last handler in the chain`
		);
	}
});
