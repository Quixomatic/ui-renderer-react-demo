import {DA_WRAPPED_CLICKED, UXF_INTERNAL_EVENT_META} from '../../common/constants';
import isFunction from 'lodash/isFunction';
const BEHAVIOR_NAME = 'daWrappedClickedBehavior';

const actionHandlers = {
	[DA_WRAPPED_CLICKED]: ({action, dispatch}) => {
		const {
			payload: {
				wrapped_action_name: actionName = '',
				wrapped_payload: actionPayload = {},
				options: {predicate = undefined, aliases = []} = {}
			} = {},
			meta: {[UXF_INTERNAL_EVENT_META]: uxfMeta = {}} = {}
		} = action;

		if (actionName && (!isFunction(predicate) || predicate(action))) {
			dispatch(actionName, actionPayload, {
				[UXF_INTERNAL_EVENT_META]: {...uxfMeta, permitCorrelationIdMismatch: true}
			});

			aliases.forEach(alias => {
				dispatch(alias, actionPayload, {
					[UXF_INTERNAL_EVENT_META]: {...uxfMeta, permitCorrelationIdMismatch: true}
				});
			});
		}
	}
};

export const daWrappedClickedBehavior = {
	name: BEHAVIOR_NAME,
	actionHandlers
};
