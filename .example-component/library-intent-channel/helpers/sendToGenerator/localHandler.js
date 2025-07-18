import {intentActions} from '../../constants';
const {
	CONTEXT_RECEIVED,
	SYSTEM_MESSAGE_RECEIVED,
	INTENT_FEEDBACK_RECEIVED,
	CONVERSATION_WITH_SKILL_REQUESTED
} = intentActions;

export default (translators) => {
	let nextHandler = null;

	const canHandle = (generator) => !!generator;

	return {
		handleSendContext(translatorId = '', generator) {
			if (!canHandle(generator))
				return (
					nextHandler && nextHandler.handleSendContext(translatorId, generator)
				);

			generator.dispatch(CONTEXT_RECEIVED, {
				context: translators[translatorId]?.context ?? null,
				translatorId
			});
		},

		handleSendSystemMessage(translatorId = '', generator, message) {
			if (!canHandle(generator))
				return (
					nextHandler &&
					nextHandler.handleSendSystemMessage(translatorId, generator, message)
				);

			generator.dispatch(SYSTEM_MESSAGE_RECEIVED, {
				message,
				translatorId
			});
		},

		handleSendIntentFeedback(
			translatorId = '',
			generator,
			originalIntent,
			status,
			message
		) {
			if (!canHandle(generator))
				return (
					nextHandler &&
					nextHandler.handleSendIntentFeedback(
						translatorId,
						generator,
						originalIntent,
						status,
						message
					)
				);

			generator.dispatch(INTENT_FEEDBACK_RECEIVED, {
				originalIntent,
				status,
				message,
				translatorId
			});
		},

		handleRequestConversationWithSkill(
			translatorId = '',
			generator,
			skillId,
			params
		) {
			if (!canHandle(generator))
				return (
					nextHandler &&
					nextHandler.handleRequestConversationWithSkill(
						translatorId,
						generator,
						skillId,
						params
					)
				);

			generator.dispatch(CONVERSATION_WITH_SKILL_REQUESTED, {
				skillId,
				translatorId,
				params
			});
		},

		setNext(handler) {
			nextHandler = handler;
		}
	};
};
