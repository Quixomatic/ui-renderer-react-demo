import {
	DA_WRAPPED_CLICKED,
	UXF_INTERNAL_EVENT_META
} from '../factory/constants';
import {isFunction} from '@devsnc/snowdash';

export const daWrappedClickedBehavior = {
	actionHandlers: {
		[DA_WRAPPED_CLICKED]({action, dispatch}) {
			const {
				payload: {
					wrapped_action_name: actionName = '',
					wrapped_payload: actionPayload = '',
					options: {predicate = undefined, aliases = []} = {}
				} = {},
				meta: {[UXF_INTERNAL_EVENT_META]: uxfMeta = {}} = {}
			} = action;

			if (actionName && (!isFunction(predicate) || predicate(action))) {
				dispatch(actionName, actionPayload, {
					[UXF_INTERNAL_EVENT_META]: uxfMeta
				});

				aliases.forEach((alias) => {
					dispatch(alias, actionPayload, {
						[UXF_INTERNAL_EVENT_META]: uxfMeta
					});
				});
			}
		}
	}
};
