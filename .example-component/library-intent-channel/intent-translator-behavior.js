import {
	updateContext,
	registerTranslator,
	removeTranslator,
	sendIntentFeedback,
	sendSystemMessage,
	requestConversationWithSkill
} from './core';
import {actionTypes} from '@servicenow/ui-core';
import {intentActions} from './constants';

const {COMPONENT_CONNECTED, COMPONENT_DISCONNECTED} = actionTypes;
const {
	UPDATE_CONTEXT,
	REGISTER_TRANSLATOR,
	REMOVE_TRANSLATOR,
	SEND_INTENT_FEEDBACK,
	CREATE_CONVERSATION_WITH_SKILL,
	SEND_SYSTEM_MESSAGE
} = intentActions;

export default {
	name: 'intentTranslator',
	actionHandlers: {
		[COMPONENT_CONNECTED]({host, dispatch, action}) {
			if (action.payload.options?.disableAutomaticallyRegistering) return;
			registerTranslator(host.nowId, dispatch);
		},
		[UPDATE_CONTEXT]: {
			effect({host, action}) {
				updateContext(host.nowId, action.payload.context);
			},
			stopPropagation: true
		},
		[REGISTER_TRANSLATOR]: {
			effect({host, dispatch, action}) {
				registerTranslator(host.nowId, dispatch, action.payload.context);
			},
			stopPropagation: true
		},
		[REMOVE_TRANSLATOR]: {
			effect({host}) {
				removeTranslator(host.nowId);
			},
			stopPropagation: true
		},
		[SEND_INTENT_FEEDBACK]: {
			effect({host, action}) {
				const {originalIntent, status, message} = action.payload;
				sendIntentFeedback(host.nowId, originalIntent, status, message);
			},
			stopPropagation: true
		},
		[CREATE_CONVERSATION_WITH_SKILL]: {
			effect({host, action}) {
				requestConversationWithSkill(
					host.nowId,
					action.payload.skillId,
					action.payload.params
				);
			},
			stopPropagation: true
		},
		[SEND_SYSTEM_MESSAGE]: {
			effect({host, action}) {
				sendSystemMessage(host.nowId, action.payload.message);
			},
			stopPropagation: true
		},
		[COMPONENT_DISCONNECTED]({host}) {
			removeTranslator(host.nowId);
		}
	}
};
