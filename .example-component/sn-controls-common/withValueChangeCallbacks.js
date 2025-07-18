import { isFunction, isObject, isUndefined } from 'lodash';

const undefinedToNull = thing => (isUndefined(thing) ? null : thing);

/**
 * Parent on*ValueChange functions originally supported the following
 * signature:
 *
 * (event, name, value, displayValue)
 *
 * But having the most useful pieces of data as the 3rd and 4th
 * argument sucks + it's inconsistent with our dispatch data. This
 * conditionally allows passing the entire payload obj as first
 * parameter if the callback isn't expecting multiple args.
 */
export const adaptCallbackForLegacyAPI = callback => payload => {
	if (!isFunction(callback) || !isObject(payload)) {
		return false;
	}

	const args =
		callback.length > 1
			? [
					payload.event,
					payload.name,
					payload.value,
					payload.displayValue,
					payload.error,
					payload.additionalInfo
			  ].map(undefinedToNull)
			: [payload];

	callback(...args);

	return true;
};
