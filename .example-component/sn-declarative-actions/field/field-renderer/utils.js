import {OPEN_FRAME_KEY} from './behaviors';
import {chain, get, isEmpty, isFunction, isObject} from 'lodash';
import {getBehaviorProp} from 'sn-uxpage-presource';

function isAttrTrue(val) {
	return val === true || val === 'true';
}

export const getActionsByKey = (actions, fieldType) => {
	return chain(actions)
		.filter(action => action.field === fieldType)
		.nth(0)
		.get('actions', [])
		.value();
};

/**
 * Some configuration data (e.g., CTI and current user info) is currently
 * stored globally and not provided as props/in a central Seismic store.
 *
 * This maps known action dependencies (specified in sys_declarative_action
 * table) to a predicate that determines whether or not the action can be
 * rendered.
 */
const HACKY_GLOBAL_DEPENDENCY_MAP = {
	CTI: behaviors => {
		const openFrameConfig = getBehaviorProp({behaviors}, OPEN_FRAME_KEY, {});
		return (
			get(openFrameConfig, 'showFrame', 'false') === 'true' &&
			get(openFrameConfig, 'config', null)
		);
	}
};

export default function canRenderAction({model, action, formData, behaviors} = {}) {
	if (!isObject(action)) {
		return false;
	}

	if (action.requiresValue && isEmpty(model.value)) {
		return false;
	}

	if (action.requiresExistingRecord && isObject(formData) && formData.isNewRecord) {
		return false;
	}

	if (action.requiresWritable && isAttrTrue(model.readonly)) {
		return false;
	}

	if (
		action.dependency &&
		isFunction(HACKY_GLOBAL_DEPENDENCY_MAP[action.dependency]) &&
		!HACKY_GLOBAL_DEPENDENCY_MAP[action.dependency](behaviors)
	) {
		return false;
	}

	return true;
}
