import {registerGenerator, removeGenerator, sendIntent} from './core';
import {actionTypes} from '@servicenow/ui-core';
import {intentActions} from './constants';

const {COMPONENT_CONNECTED, COMPONENT_DISCONNECTED} = actionTypes;
const {SEND_INTENT} = intentActions;

export default {
	name: 'intentGenerator',

	actionHandlers: {
		[COMPONENT_CONNECTED]({host, dispatch}) {
			registerGenerator(host.nowId, dispatch);
		},
		[COMPONENT_DISCONNECTED](host) {
			removeGenerator(host);
		},
		[SEND_INTENT]: {
			effect({action}) {
				sendIntent(action.payload.translatorId, action.payload.intent);
			},
			stopPropagation: true
		}
	}
};
