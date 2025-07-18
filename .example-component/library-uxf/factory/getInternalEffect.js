import {partial} from '@devsnc/snowdash';
import {IS_INTERNAL_ACTION} from './constants';

export const isValidInternalAction = ({action: {meta}}) =>
	meta[IS_INTERNAL_ACTION] || false;

function handleInternalAction(effectFn, coeffects) {
	if (isValidInternalAction(coeffects)) {
		effectFn(coeffects);
	}
	// fixme: error / warn the user that this is not allowed
}

export function getInternalEffect({effect, stopPropagation = true}) {
	return {
		stopPropagation,
		effect: partial(handleInternalAction, effect)
	};
}

export function getModifiedMetaForInternalActionDispatch(meta = {}) {
	return {
		...meta,
		[IS_INTERNAL_ACTION]: true
	};
}

/**
 * Use for any actions that are limited to intra-macroponent communication.
 * Handle these actions with getInternalEffect above
 *
 * It is meant to distinguish action source (actions that bubble up from seismic components vs from a behavior on the macroponent).
 */
export function dispatchInternalAction(dispatchFn, action, payload, meta) {
	dispatchFn(action, payload, getModifiedMetaForInternalActionDispatch(meta));
}

export default getInternalEffect;
