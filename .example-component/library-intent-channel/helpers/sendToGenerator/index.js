import localHandler from './localHandler';
import sessionStorageHandler from './sessionStorageHandler';

export default (translators) => {
	const local = localHandler(translators);
	const session = sessionStorageHandler(translators);
	local.setNext(session);

	return {
		handleSendContext(translatorKey, generator) {
			return local.handleSendContext(translatorKey, generator);
		},

		handleSendSystemMessage(
			translatorKey,
			generator,
			message,
			activeTranslatorKey
		) {
			if (translatorKey === activeTranslatorKey)
				return local.handleSendSystemMessage(
					translatorKey,
					generator,
					message,
					activeTranslatorKey
				);
		},

		handleSendIntentFeedback(
			translatorKey,
			generator,
			originalIntent,
			status,
			message
		) {
			return local.handleSendIntentFeedback(
				translatorKey,
				generator,
				originalIntent,
				status,
				message
			);
		},

		handleRequestConversationWithSkill(
			translatorKey,
			generator,
			skillId,
			params,
			activeTranslatorKey
		) {
			if (translatorKey === activeTranslatorKey)
				return local.handleRequestConversationWithSkill(
					translatorKey,
					generator,
					skillId,
					params,
					activeTranslatorKey
				);
		}
	};
};
