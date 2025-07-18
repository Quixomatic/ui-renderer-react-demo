import {getAndClearRetainedFocus} from '@devsnc/sn-list-commons';
import {actionTypes} from '@servicenow/ui-core';
import get from 'lodash/get';

import {CLOSE_MODAL, OPEN_MODAL} from '../constants';
const {COMPONENT_PROPERTY_CHANGED} = actionTypes;
import {MODAL_TYPES} from '../constants';

export const modalPropsChangedEffect = ({
	action,
	state: {modalProps},
	dispatch
}) => {
	const {
		payload: {value}
	} = action;
	if (modalProps && modalProps.type === MODAL_TYPES.CASCADE_DELETE) {
		const cascadeContent = get(value, 'cascadeContent', '');
		const recordsDeleted = get(value, 'recordsDeleted', false);
		if (cascadeContent) {
			dispatch(OPEN_MODAL, {
				modalProps: {
					...modalProps,
					content: cascadeContent
				}
			});
		} else if (recordsDeleted) {
			dispatch(CLOSE_MODAL);
		}
	}
};

const modalBehavior = {
	name: 'modalBehavior',
	properties: {},
	initialState: {
		modalProps: {
			type: ''
		}
	},
	actionHandlers: {
		[COMPONENT_PROPERTY_CHANGED]: {
			effect: modalPropsChangedEffect
		},
		[OPEN_MODAL]: {
			effect: ({action, updateState}) => {
				updateState({
					modalProps: {
						...action.payload.modalProps
					}
				});
			},
			stopPropagation: true
		},
		[CLOSE_MODAL]: {
			effect: ({updateState}) => {
				updateState({
					modalProps: {
						type: ''
					}
				});
			},
			interceptors: [
				{
					after: () => {
						getAndClearRetainedFocus('listActionsButton');
					}
				}
			],
			stopPropagation: true
		}
	}
};

export default modalBehavior;
