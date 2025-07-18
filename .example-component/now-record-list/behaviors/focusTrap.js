import {
	activateFocusTrap,
	deactivateFocusTrap,
	updateFocusTrap
} from '@devsnc/sn-list-commons';
import {actionTypes} from '@servicenow/ui-core';
import get from 'lodash/get';

import {UPDATE_FOCUS_TRAP} from '../constants';

const FOCUS_TRAP_SET_TRAP_ID = 'FOCUS_TRAP_SET_TRAP_ID';
const BEHAVIOR_NAME = 'focusTrap';
const {COMPONENT_DOM_TREE_READY} = actionTypes;

const extractBehaviorState = state =>
	get(state, `behaviors.${BEHAVIOR_NAME}`, {});
const wrapBehaviorState = newState => {
	return {
		behaviors: {
			[BEHAVIOR_NAME]: {
				...newState
			}
		}
	};
};

export const focusTrap = {
	name: BEHAVIOR_NAME,
	initialState: {
		focusTrapID: undefined
	},
	onPropertiesSet(host) {
		setTimeout(() => {
			updateFocusTrap(host.listInstanceId);
		});
	},
	onDisconnect(host) {
		deactivateFocusTrap(host.listInstanceId);
	},
	actionHandlers: {
		[COMPONENT_DOM_TREE_READY]({host, dispatch}) {
			dispatch(FOCUS_TRAP_SET_TRAP_ID, host.listInstanceId);
			setTimeout(() => {
				activateFocusTrap(host.listInstanceId, host);
			});
		},
		[FOCUS_TRAP_SET_TRAP_ID]({updateState, action}) {
			updateState(wrapBehaviorState({focusTrapID: action.payload}));
		},
		[UPDATE_FOCUS_TRAP]: {
			effect: ({state}) => {
				const focusTrapID = extractBehaviorState(state).focusTrapID;
				setTimeout(() => {
					updateFocusTrap(focusTrapID);
				});
			},
			stopPropagation: true
		}
	}
};
