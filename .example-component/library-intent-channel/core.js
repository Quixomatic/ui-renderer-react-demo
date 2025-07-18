import {intentActions, intentLocalStorageKeys} from './constants';
import {
	getCurrentActiveTranslatorKey,
	setCurrentActiveTranslatorKey,
	unsetCurrentActiveTranslatorKey,
	clearActiveTranslatorKey
} from './helpers/activeTranslator';
import createSendToTranslatorHandler from './helpers/sendToTranslator/index';
import createSendToGeneratorHandler from './helpers/sendToGenerator/index';

const {
	INTENT_RECEIVED,
	CONTEXT_RECEIVED,
	INTENT_FEEDBACK_RECEIVED,
	CONVERSATION_WITH_SKILL_REQUESTED,
	SYSTEM_MESSAGE_RECEIVED
} = intentActions;
const TRANSLATORS = '__LIBRARY_INTENT_CHANNEL-translators';
const GENERATOR = '__LIBRARY_INTENT_CHANNEL-generator';
const win = window;

// this could become a more complex mapping of many to many instead of 1 generator to many translators
if (!win[TRANSLATORS]) win[TRANSLATORS] = {};

if (!win[GENERATOR]) win[GENERATOR] = null;

const getTranslator = (key) => win[TRANSLATORS][key];
const getTranslators = () => win[TRANSLATORS];
const getGenerator = () => win[GENERATOR];
const setTranslator = (key, value) => (win[TRANSLATORS][key] = value);
const setGenerator = (value) => (win[GENERATOR] = value);
const deleteTranslator = (key) => delete win[TRANSLATORS][key];

const sendToTranslatorHandler = createSendToTranslatorHandler(getTranslators());
const sendToGeneratorHandler = createSendToGeneratorHandler(getTranslators());

const sendDataFromStorage = (storageKey, actionType) => {
	if (getGenerator()) {
		const jsonString = sessionStorage.getItem(storageKey);
		if (!jsonString) return;

		try {
			let values = JSON.parse(jsonString);
			if (!Array.isArray(values)) values = [values];
			values.forEach((value) => {
				getGenerator().dispatch(actionType, {
					...value
				});
			});
		} catch (e) {
			console.warn('Error parsing JSON format.');
		}
		sessionStorage.removeItem(storageKey);
	}
};

// GENERATOR
const updateContextFromStorage = () => {
	sendDataFromStorage(intentLocalStorageKeys.updateContext, CONTEXT_RECEIVED);
};

const sendSystemMessageFromStorage = () => {
	sendDataFromStorage(
		intentLocalStorageKeys.sendSystemMessage,
		SYSTEM_MESSAGE_RECEIVED
	);
};

const sendIntentFeedbackFromStorage = () => {
	sendDataFromStorage(
		intentLocalStorageKeys.sendIntentFeedback,
		INTENT_FEEDBACK_RECEIVED
	);
};

const requestConversationWithSkillFromStorage = () => {
	sendDataFromStorage(
		intentLocalStorageKeys.requestConversationWithSkill,
		CONVERSATION_WITH_SKILL_REQUESTED
	);
};

/**
 * Send an intent to a specific translator or the active translator if no translatorKey is specified
 * @param {*} translatorKey
 * @param {*} intentPayload
 */
export const sendIntent = (translatorKey, intentPayload) => {
	sendToTranslatorHandler.handleSendIntent(
		translatorKey,
		intentPayload,
		getCurrentActiveTranslatorKey()
	);
};

export const removeGenerator = () => {
	setGenerator(null);
};

const sendContextToGenerator = (translatorKey) => {
	sendToGeneratorHandler.handleSendContext(translatorKey, getGenerator());
};

export const registerGenerator = (id, callback) => {
	setGenerator({id, dispatch: callback});
	sendContextToGenerator(getCurrentActiveTranslatorKey());
	updateContextFromStorage();
	requestConversationWithSkillFromStorage();
	sendSystemMessageFromStorage();
};

// MEDIATOR
export const setActiveTranslator = (translatorKey) => {
	// Identify the context based on an arbitrary ID that both the translator and mediator know about. Now-id by default for the seismic behaviors
	if (getTranslator(translatorKey)) {
		setCurrentActiveTranslatorKey(translatorKey);
		sendContextToGenerator(translatorKey);
	}
};

export const unsetActiveTranslator = (translatorKey) => {
	if (getTranslator(translatorKey)) {
		if (unsetCurrentActiveTranslatorKey(translatorKey))
			sendContextToGenerator('');
	}
};

// TRANSLATOR

/**
 * Updates the context for a specific translator
 * @param {*} translatorKey
 * @param {*} context
 */
export const updateContext = (translatorKey, context) => {
	if (getTranslator(translatorKey)) {
		setTranslator(translatorKey, {...getTranslator(translatorKey), context});
		if (getCurrentActiveTranslatorKey() === translatorKey) {
			sendContextToGenerator(translatorKey);
		}
	}
};

export const removeTranslator = (translatorKey) => {
	if (getCurrentActiveTranslatorKey() === translatorKey) {
		clearActiveTranslatorKey();
	}
	deleteTranslator(translatorKey);
};

export const registerTranslator = (translatorKey, callback, context = null) => {
	setTranslator(translatorKey, {dispatch: callback});
	if (!getCurrentActiveTranslatorKey()) {
		setCurrentActiveTranslatorKey(translatorKey);
		updateContext(translatorKey, context);
	}
};

export const sendIntentFeedback = (
	translatorKey,
	intentPayload,
	status,
	message
) => {
	sendToGeneratorHandler.handleSendIntentFeedback(
		translatorKey,
		getGenerator(),
		intentPayload,
		status,
		message
	);
};

export const sendSystemMessage = (translatorKey, message) => {
	sendToGeneratorHandler.handleSendSystemMessage(
		translatorKey,
		getGenerator(),
		message,
		getCurrentActiveTranslatorKey()
	);
};

export const requestConversationWithSkill = (
	translatorKey,
	skillId,
	params
) => {
	sendToGeneratorHandler.handleRequestConversationWithSkill(
		translatorKey,
		getGenerator(),
		skillId,
		params,
		getCurrentActiveTranslatorKey()
	);
};

// communication between iframe and top frame
window.addEventListener('storage', (e) => {
	if (e.key === intentLocalStorageKeys.updateContext) {
		updateContextFromStorage();
	} else if (e.key === intentLocalStorageKeys.sendSystemMessage) {
		sendSystemMessageFromStorage();
	} else if (e.key === intentLocalStorageKeys.sendIntentFeedback) {
		sendIntentFeedbackFromStorage();
	} else if (e.key === intentLocalStorageKeys.requestConversationWithSkill) {
		requestConversationWithSkillFromStorage();
	} else if (e.key.indexOf(intentLocalStorageKeys.sendIntent) === 0) {
		const translatorKey = e.key.replace(
			`${intentLocalStorageKeys.sendIntent}/`,
			''
		);
		if (translatorKey && getTranslator(translatorKey)) {
			try {
				let values = JSON.parse(sessionStorage.getItem(e.key));
				if (!Array.isArray(values)) values = [values];
				values.forEach((value) => {
					getTranslator(translatorKey).dispatch(INTENT_RECEIVED, {
						intent: value.intentPayload
					});
				});
			} catch (e) {
				console.warn('Skipped sending intent due to invalid JSON format.');
			}
			sessionStorage.removeItem(e.key);
		}
	}
});
