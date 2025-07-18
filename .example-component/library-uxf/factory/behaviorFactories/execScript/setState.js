import {isFunction} from '@devsnc/snowdash';
import {get} from '@devsnc/snowdash';
import {
	IS_SOURCED_FROM_SET_STATE,
	MACROPONENT_VALUE_UPDATED
} from '../../constants';

function getUpdatedState(
	instance,
	currentValue,
	fn,
	seismicState,
	seismicProperties
) {
	return fn({
		currentValue,
		api: instance.getApi(seismicProperties, seismicState).api
	});
}

export default function setState(
	instance,
	seismicDispatch,
	seismicUpdateState,
	mcpSysId,
	dispatchMcpUpdates,
	statePropertyName,
	fnOrNewState,
	shouldRender = true
) {
	const update = ({state: seismicState, properties: seismicProperties}) => {
		const currentValue = get(seismicState, [statePropertyName]);
		const updatedState = isFunction(fnOrNewState)
			? getUpdatedState(
					instance,
					currentValue,
					fnOrNewState,
					seismicState,
					seismicProperties
			  )
			: fnOrNewState;

		// dispatch an action for UIB WYSIWYG state to notify them of the updated state variable
		if (dispatchMcpUpdates) {
			seismicDispatch(MACROPONENT_VALUE_UPDATED, {
				macroponentSysId: mcpSysId,
				state: {[statePropertyName]: updatedState}
			});
		}

		if (shouldRender) {
			return {
				[statePropertyName]: updatedState
			};
		}
		return {
			[statePropertyName]: updatedState,
			shouldRender
		};
	};
	update[IS_SOURCED_FROM_SET_STATE] = true;
	update.statePropertyName = statePropertyName;

	seismicUpdateState(update);
}
