import {get} from '@devsnc/snowdash';
import {dispatchInternalAction} from '../factory/getInternalEffect';
import {isNil} from '@devsnc/snowdash';

export function httpErrorOccurredEffect(
	consolidatedEventMappings,
	pageEvent,
	coeffects
) {
	const {action, dispatch} = coeffects;
	if (!isNil(get(consolidatedEventMappings, pageEvent))) {
		dispatchInternalAction(dispatch, pageEvent, action.payload);
	}
}
