import {createCustomElement} from '@servicenow/ui-core';
import snabbdom, {createElement} from '@servicenow/ui-renderer-snabbdom';
import {getActionHandlers} from '../../getActionHandlers';

import {getConsolidatedEventMappings} from '../../getConsolidatedConfig.js';
import {getScreenActionTransformerTagName} from '../../utils';

import {getEventMappingOverrides} from '../../../screenContentOverridesApi/screenEventMappings';
import {MODAL_SELECTED} from '../../constants';
import {
	addOpenedModalInfo,
	removeOpenedModalInfo
} from '../../behaviorFactories/translatorBehavior/translatorModalHelper';
import {actionTypes} from '@servicenow/ui-core';
const {COMPONENT_DISCONNECTED} = actionTypes;

const actionInterceptorComponentCache = new Map();

export default (screenId, eventMappings) => {
	const screenActionTransformerTagName =
		getScreenActionTransformerTagName(screenId);

	const eventMappingOverrides = getEventMappingOverrides(screenId);

	if (!actionInterceptorComponentCache.has(screenId)) {
		const consolidatedEventMappings = getConsolidatedEventMappings(
			screenId,
			eventMappingOverrides.length > 0 ? eventMappingOverrides : eventMappings
		);
		const actionHandlers = getActionHandlers(consolidatedEventMappings, true);
		createCustomElement(screenActionTransformerTagName, {
			renderer: {
				type: snabbdom,
				view: () => createElement('slot')
			},
			properties: {
				nowUxfDelegateDispatch: {
					default: false
				}
			},
			actionHandlers: {
				...actionHandlers,
				[MODAL_SELECTED](coeffects) {
					const {action, host} = coeffects;

					addOpenedModalInfo(action, host);
					if (actionHandlers[MODAL_SELECTED])
						actionHandlers[MODAL_SELECTED](coeffects);
				},
				[COMPONENT_DISCONNECTED]({host}) {
					removeOpenedModalInfo(host);
				}
			}
		});

		actionInterceptorComponentCache.set(screenId, true);
	}

	return screenActionTransformerTagName;
};
