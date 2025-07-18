import {intentActions} from '../../constants';
const {INTENT_RECEIVED} = intentActions;

export default (translators) => {
	let nextHandler = null;

	const canHandle = (translatorKey) =>
		translatorKey && translators[translatorKey];
	return {
		handleSendIntent(translatorKey, intentPayload, activeTranslatorKey) {
			if (!canHandle(translatorKey))
				return (
					nextHandler &&
					nextHandler.handleSendIntent(
						translatorKey,
						intentPayload,
						activeTranslatorKey
					)
				);

			if (translatorKey === activeTranslatorKey)
				translators[translatorKey].dispatch(INTENT_RECEIVED, {
					intent: intentPayload
				});
		},
		setNext(handler) {
			nextHandler = handler;
		}
	};
};
