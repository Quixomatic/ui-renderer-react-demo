import {isFunction} from '@devsnc/snowdash';
import {includes} from '@devsnc/snowdash';
import {difference} from '@devsnc/snowdash';
import {values} from '@devsnc/snowdash';

import {
	internalActions,
	publicActionHandlerNames,
	componentViewportInternalActions,
	DEPENDENCY_RELAY_EVENTS_ALLOWED_FROM_SCRIPT
} from '../../constants';
import {
	actionTypes as dataBrokerActionTypes,
	actionTypesAllowedFromScript
} from '../../databrokers/behaviors/data-broker-runtime/constants';
import {actionTypes as seismicActionTypes} from '@servicenow/ui-core';
import {dispatchInternalAction} from '../../getInternalEffect.js';
import {default as console} from '../../../utils/getLogger.js';

const sandboxedActions = [
	...values(internalActions),
	...difference(values(dataBrokerActionTypes), actionTypesAllowedFromScript),
	...values(seismicActionTypes)
];

const allowedComponentViewportInternalActions = [
	...values(componentViewportInternalActions)
];

const macroponentPublicActions = values(publicActionHandlerNames);
const allowedDependencyRelayEvents = values(
	DEPENDENCY_RELAY_EVENTS_ALLOWED_FROM_SCRIPT
);

function isActionEmissionAllowed(blocklist = [], allowlist = [], actionName) {
	return includes(
		difference(allowlist, blocklist, sandboxedActions),
		actionName
	);
}

function includeComponentViewportActionMeta(name) {
	return allowedComponentViewportInternalActions.includes(name)
		? {
				uxfComponentViewportMeta: {
					allowComponentViewportActionInEmitFn: true
				}
		  }
		: null;
}

export default function getUxfEmitFn(
	macroponentSeismicDispatchFn,
	rootSeismicDispatchFn,
	rootHandledEventNames = [],
	actionBlocklist,
	publicEventNames
) {
	const actionAllowList = [
		...publicEventNames,
		...actionTypesAllowedFromScript,
		...macroponentPublicActions,
		...allowedDependencyRelayEvents
	];

	return function emitWithMeta(meta, name, payload) {
		if (!isActionEmissionAllowed(actionBlocklist, actionAllowList, name)) {
			console.error(
				`emit was ignored: ${name} is not a declared dispatched event of macroponent`
			);
			return;
		}

		// sandbox access to seismic's dispatch(() => {});
		if (isFunction(name)) {
			console.error(`emit was ignored: ${name} cannot be a function`);
			return;
		}

		if (rootHandledEventNames.includes(name))
			rootSeismicDispatchFn(name, payload, meta);
		else if (
			actionTypesAllowedFromScript.includes(name) ||
			allowedDependencyRelayEvents.includes(name)
		)
			dispatchInternalAction(macroponentSeismicDispatchFn, name, payload, meta);
		else
			macroponentSeismicDispatchFn(name, payload, {
				...meta,
				...includeComponentViewportActionMeta(name)
			});
	};
}
