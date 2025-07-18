import { actionTypes } from '@servicenow/ui-core';
import { debounce, curry, find } from 'lodash';

import { pick, get, isNil, isEqualWith } from './utils';

import { adaptCallbackForLegacyAPI } from './withValueChangeCallbacks';
import { CALLBACK_AND_DISPATCH } from './constants';

const { COMPONENT_CONNECTED, COMPONENT_PROPERTY_CHANGED } = actionTypes;

export const behavior = 'withValueChangeCallbackBehavior';

const createCallbacks = (dispatch, { onValueChange, onStagedValueChange }) => {
	const createdCallback = curry((callback, isValueChanged, dispatchPayload) => {
		dispatch(CALLBACK_AND_DISPATCH, {
			callback,
			isValueChanged,
			dispatchPayload
		});
	});
	// only debounce staged value change, as we don't want to call it every time the value changes
	// in the field with the focus present
	return {
		onValueChange: createdCallback(onValueChange, true),
		onStagedValueChange: debounce(
			createdCallback(onStagedValueChange, false),
			250
		)
	};
};

export const withValueChangeCallbacksView = view => (state, helpers) => {
	if (state.properties.createdCallbacks) {
		return view(state, helpers);
	}
	const dispatch = state.helpers?.dispatch || helpers?.dispatch;
	const { onValueChange, onStagedValueChange } = createCallbacks(dispatch, {
		onValueChange: state.properties.onValueChange,
		onStagedValueChange: state.properties.onStagedValueChange
	});
	return view({ ...state, onValueChange, onStagedValueChange }, helpers);
};

export const componentConnectedEffect =
	(
		behaviorName,
		{ initialValueProp, initialDisplayValueProp, stopPropagation }
	) =>
	({ host, properties, updateState }) => {
		const { name } = properties;
		const parentBehaviors = get(
			host.getRootNode(),
			'host.nowElementConfig.behaviors',
			{}
		);
		if (find(parentBehaviors, { name: behaviorName }) && !stopPropagation) {
			return;
		}

		if (properties.createdCallbacks) {
			return;
		}

		const componentName = host.tagName.replace(new RegExp('-', 'g'), '_');
		updateState([
			{
				path: `behaviors.${behaviorName}.dispatchCache`,
				value: {
					[`${componentName}#VALUE_CHANGED`]: {
						value: properties[initialValueProp],
						displayValue: properties[initialDisplayValueProp],
						name
					},
					[`${componentName}#STAGED_VALUE_CHANGED`]: {
						value: properties[initialValueProp],
						displayValue: properties[initialDisplayValueProp],
						name
					}
				},
				operation: 'set',
				shouldRender: false
			}
		]);
	};

export const propertyChangedEffect =
	(
		behaviorName,
		{ initialValueProp, initialDisplayValueProp, stopPropagation } = {}
	) =>
	({
		host,
		action: {
			payload: { name, value }
		},
		updateState,
		properties
	}) => {
		// don't add withValueChangeCallback functionality if direct parent is already handling it
		const parentBehaviors = get(
			host.getRootNode(),
			'host.nowElementConfig.behaviors',
			{}
		);
		if (find(parentBehaviors, { name: behaviorName }) && !stopPropagation) {
			return;
		}

		if (properties.createdCallbacks) {
			return;
		}

		// value can change via props (from forms/client scripting), so we update the dispatchCache
		const componentName = host.tagName.replace(new RegExp('-', 'g'), '_');
		if (name === initialValueProp || name === initialDisplayValueProp) {
			const updateKey = name === initialValueProp ? 'value' : 'displayValue';
			updateState([
				{
					path: `behaviors.${behaviorName}.dispatchCache[${componentName}#VALUE_CHANGED].${updateKey}`,
					value,
					operation: 'set',
					shouldRender: false
				},
				{
					path: `behaviors.${behaviorName}.dispatchCache[${componentName}#STAGED_VALUE_CHANGED].${updateKey}`,
					value,
					operation: 'set',
					shouldRender: false
				}
			]);
		}
	};

export const callbackAndDispatchEffect =
	(behaviorName, { cache, initialValueProp, stopPropagation }) =>
	({
		host,
		state,
		updateState,
		properties,
		dispatch,
		payload: { callback, dispatchPayload, isValueChanged }
	}) => {
		// don't add withValueChangeCallback functionality if direct parent is already handling it
		const parentBehaviors = get(
			host.getRootNode(),
			'host.nowElementConfig.behaviors',
			{}
		);
		if (find(parentBehaviors, { name: behaviorName }) && !stopPropagation) {
			return;
		}

		if (properties.createdCallbacks) {
			return;
		}

		const componentName = host.tagName.replace(new RegExp('-', 'g'), '_');
		const actionToDispatch = `${componentName}#${
			isValueChanged ? 'VALUE_CHANGED' : 'STAGED_VALUE_CHANGED'
		}`;

		// check if payload matches cache, don't do anything if it hasn't changed
		const dispatchCache =
			state.behaviors[behaviorName].dispatchCache?.[actionToDispatch];

		const compare = (a, b) => {
			// treat null and undefined as equal
			if (isNil(a) && isNil(b)) {
				return true;
			}
		};

		// make sure to give payload name from props if it wasn't given explicitly
		if (!dispatchPayload.name && properties.name) {
			dispatchPayload.name = properties.name;
		}

		const payloadMatchesCache =
			isEqualWith(dispatchPayload.name, dispatchCache?.name, compare) &&
			isEqualWith(dispatchPayload.error, dispatchCache?.error, compare) &&
			isEqualWith(dispatchPayload.value, dispatchCache?.value, compare) &&
			isEqualWith(
				dispatchPayload.displayValue,
				dispatchCache?.displayValue,
				compare
			);

		if (cache && dispatchCache && payloadMatchesCache) {
			return false;
		}

		// call callback
		adaptCallbackForLegacyAPI(callback)(dispatchPayload);

		// Dispatch seismic action
		dispatch(actionToDispatch, dispatchPayload);

		// handle tracking that goes through here
		if (
			isValueChanged &&
			properties[initialValueProp] !== dispatchPayload.value
		) {
			dispatch('TRACK', {
				metaData: {
					name: properties.name,
					fieldType: componentName
				},
				additionalOptions: { parentHandling: properties.disableTracking }
			});
		}

		// if cache, update the cache
		if (dispatchCache) {
			const valueChangeAction = `${componentName}#VALUE_CHANGED`;
			const isStageChangedAction = !isValueChanged;
			const clearValueChangedCacheUpdate = properties.allowFieldChangesAfterEveryStageChange && isStageChangedAction
				? [
					{
						path: `behaviors.${behaviorName}.dispatchCache[${valueChangeAction}]`,
						value: null,
						operation: 'set',
						shouldRender: false
					}
				]
				: [];

			updateState([
				{
					path: `behaviors.${behaviorName}.dispatchCache[${actionToDispatch}]`,
					value: pick(dispatchPayload, [
						'value',
						'displayValue',
						'error',
						'name'
					]),
					operation: 'set',
					shouldRender: false
				},
				...clearValueChangedCacheUpdate
			]);
		}
	};

/**
 * This behavior replaces the withValueChangeCallbacks HOC provided to normalize
 * `dispatch`, `onValueChange`, and `onStagedValueChange` prop functions for wrapped components.
 * This has had a significant improvement in typing performance and we can now handle cache in
 * state without triggering re-renders.
 *
 * `onValueChange` and `onStagedValueChange` should be called
 * with a single object parameter, which should contain the data
 * payload to event up to the parent/through Seismic
 *
 * e.g.:
 *
 * 	this.props.onValueChange({ value: 'the value' });
 * 	this.props.onStagedValueChange({ value: 'the staged value' })
 *
 * The on*ValueChange functions also handle dispatching the event
 * up through Seismic.
 *
 * By default, it also caches the payload between multiple
 * on*ValueChange calls, preventing sequential calls with the same payload.
 * This behavior can be disabled by providing the `cache: false` option.
 *
 *  Options (with defaults):
 *  initialValueProp = 'value',
 *  initialDisplayValueProp = 'displayValue',
 *  cache = true
 *  stopBubbling = []
 *
 *
 * ```js
 * import createWithValueChangeCallbackBehavior from '@devsnc/sn-controls-common';
 *
 * createCustomElement('sn-example', {
 *   // ...
 * behaviors: [ createWithValueChangeCallbackBehavior({cache: true}) ];
 * });
 * ```
 *
 * @seismicBehavior withValueChangeCallbacksBehavior
 * @summary Behavior used to normalize OnValueChange and onStagedValueChange callbacks
 */

export const createWithValueChangeCallbackBehavior = (options = {}) => {
	const {
		initialDisplayValueProp = 'displayValue',
		initialValueProp = 'value',
		cache = true,
		stopPropagation = false
	} = options;

	return {
		name: behavior,
		actionHandlers: {
			[COMPONENT_CONNECTED]: componentConnectedEffect(behavior, {
				initialValueProp,
				initialDisplayValueProp,
				stopPropagation
			}),
			[COMPONENT_PROPERTY_CHANGED]: propertyChangedEffect(behavior, {
				initialValueProp,
				initialDisplayValueProp,
				stopPropagation
			}),
			[CALLBACK_AND_DISPATCH]: {
				effect: ({
					host,
					state,
					updateState,
					properties,
					dispatch,
					action: { payload }
				}) => {
					const { callback, dispatchPayload, isValueChanged } = payload;
					callbackAndDispatchEffect(behavior, {
						cache,
						initialValueProp,
						stopPropagation
					})({
						host,
						state,
						updateState,
						properties,
						dispatch,
						payload: { callback, dispatchPayload, isValueChanged }
					});
				},
				stopPropagation
			}
		}
	};
};
