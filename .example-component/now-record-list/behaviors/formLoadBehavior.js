import createComponentLoaderEffect from '@devsnc/uxf-effect-component-loader';
import {actionTypes} from '@servicenow/ui-core';

const {COMPONENT_BOOTSTRAPPED} = actionTypes;

const BEHAVIOR_NAME = 'formLoad';

const COMPONENT_LOAD_COMPLETED = 'NOW_RECORD_LIST#COMPONENT_LOAD_COMPLETED';
const COMPONENT_LOAD_REQUESTED = 'NOW_RECORD_LIST#COMPONENT_LOAD_REQUESTED';
const COMPONENT_LOAD_FAILED = 'NOW_RECORD_LIST#COMPONENT_LOAD_FAILED';

export default {
	name: BEHAVIOR_NAME,
	actionHandlers: {
		[COMPONENT_BOOTSTRAPPED]: {
			effect: ({dispatch}) => {
				dispatch(COMPONENT_LOAD_REQUESTED, {
					tagName: 'sn-record-common-quick-form'
				});
				dispatch(COMPONENT_LOAD_REQUESTED, {
					tagName: 'sn-record-common-multi-form'
				});
			},
			stopPropagation: true
		},
		[COMPONENT_LOAD_REQUESTED]: createComponentLoaderEffect({
			successActionType: COMPONENT_LOAD_COMPLETED,
			errorActionType: COMPONENT_LOAD_FAILED
		}),
		[COMPONENT_LOAD_COMPLETED]: {
			effect: ({action}) => {
				const {
					payload: {
						request: {tagName}
					}
				} = action;

				// eslint-disable-next-line no-console
				console.log('FORM COMPONENT SUCCESSFULLY LOADED', tagName);
			},
			stopPropagation: true
		},
		[COMPONENT_LOAD_FAILED]: {
			effect: ({action}) => {
				const {
					payload: {
						request: {tagName}
					}
				} = action;

				// eslint-disable-next-line no-console
				console.warn('FORM COMPONENT FAILED TO LOAD', tagName);
			},
			stopPropagation: true
		}
	}
};
