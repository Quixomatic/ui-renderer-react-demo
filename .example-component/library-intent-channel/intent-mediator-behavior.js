import {setActiveTranslator, unsetActiveTranslator} from './core';
import {intentActions} from './constants';

const {SET_ACTIVE_CONTEXT, UNSET_ACTIVE_CONTEXT} = intentActions;

export default {
	name: 'intentMediator',
	actionHandlers: {
		[SET_ACTIVE_CONTEXT]: {
			effect({action}) {
				setActiveTranslator(action.payload.translatorId);
			},
			stopPropagation: true
		},
		[UNSET_ACTIVE_CONTEXT]: {
			effect({action}) {
				unsetActiveTranslator(action.payload.translatorId);
			},
			stopPropagation: true
		}
	}
};
