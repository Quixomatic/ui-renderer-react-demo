import setState from '../execScript/setState';
import {getMacroponentInstance} from '../../registry/macroponentInstanceRegistry';

/**
 * Macroponent primitive action handler for MACROPONENT_STATE_UPDATE_REQUESTED.
 * Simply delegates to execScript/setState().
 * @param {*} coeffects coeffects object.
 */
export default function stateUpdateRequestedActionHandler(
	coeffects,
	mcpSysId,
	dispatchMcpUpdates
) {
	// Unwrap necessary parameters to pass to setState.
	const {
		dispatch: seismicDispatch,
		action,
		updateState: seismicUpdateState,
		host
	} = coeffects;

	const instance = getMacroponentInstance(host);
	const payload = action.payload;
	const namespace = payload.propName;
	const fnOrNewState = payload.value;

	// Delegate to setState().
	setState(
		instance,
		seismicDispatch,
		seismicUpdateState,
		mcpSysId,
		dispatchMcpUpdates,
		namespace,
		fnOrNewState
	);
}
