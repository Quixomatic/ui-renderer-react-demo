import get from 'lodash/get';

import {CALLBACK_CALLED, OPEN_DIRTY_MODAL} from './dirtyModalConstants';

const setSavedEffect = ({coeffects, value}) => {
	coeffects.updateState({
		path: 'behaviors.dirtyBehavior.savedEffect',
		value,
		operation: 'set'
	});
};

export const dirtyBehavior = {
	name: 'dirtyBehavior',
	actionHandlers: {
		[CALLBACK_CALLED]: {
			effect: coeffects => {
				setSavedEffect({coeffects, value: {}});
			},
			stopPropagation: true,
			interceptors: [
				{
					before(context) {
						// Repopulate the context (i.e. if modal was shown, put back the previous context, else carry on)
						const {effects = [], action = {}} = get(
							context,
							'coeffects.state.behaviors.dirtyBehavior.savedEffect',
							{}
						);
						const modalConfirmed = get(
							context,
							'coeffects.action.payload.confirmed',
							false
						);

						return modalConfirmed
							? {
									...context,
									coeffects: {...context.coeffects, action},
									effects: [...context.effects, ...effects]
							  }
							: {...context};
					}
				}
			]
		}
	},
	onBootstrap(host, {updateState}) {
		const componentId = host.attributes['component-id'].value;

		updateState({
			path: 'behaviors.dirtyBehavior.savedComponentId',
			value: componentId,
			operation: 'set'
		});
	}
};

const createCallBack = ({dispatch, confirmed}) => {
	return () => {
		dispatch(CALLBACK_CALLED, {confirmed});
	};
};

export const dirtyModalInterceptor = {
	after(context) {
		// Save data for this action for use during callback
		setSavedEffect({
			coeffects: context.coeffects,
			value: {effects: context.effects, action: context.coeffects.action}
		});
		const dispatch = context.coeffects.dispatch;
		const confirmationCallback = createCallBack({dispatch, confirmed: true});
		const closeCallBack = createCallBack({dispatch, confirmed: false});

		dispatch(OPEN_DIRTY_MODAL, {
			confirmationCallback,
			closeCallBack
		});

		return {
			...context,
			effects: []
		};
	}
};
