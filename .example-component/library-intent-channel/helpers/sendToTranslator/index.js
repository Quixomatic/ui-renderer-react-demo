import localHandler from './localHandler';
import sessionStorageHandler from './sessionStorageHandler';

export default (translators) => {
	const local = localHandler(translators);
	const session = sessionStorageHandler();
	local.setNext(session);

	return {
		handleSendIntent(translatorKey, intentPayload, activeTranslatorKey) {
			return local.handleSendIntent(
				translatorKey,
				intentPayload,
				activeTranslatorKey
			);
		}
	};
};
