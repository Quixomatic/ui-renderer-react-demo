import { actionTypes } from '@servicenow/ui-core';
import {
	debounce,
	isEmpty,
	toString,
	omit,
	isEqual,
	isFunction,
	get
} from 'lodash';

import { CALLBACK_AND_DISPATCH_WITH_STATE, NOW_INPUT } from './constants';
import { isAttrTrue } from './utils';
import {
	callbackAndDispatchEffect,
	componentConnectedEffect,
	propertyChangedEffect
} from './withValueChangeCallbacksBehavior';

const { COMPONENT_CONNECTED, COMPONENT_PROPERTY_CHANGED } = actionTypes;

export const callbackWithStateBehavior = 'withStateBehavior';

const passthrough = s => ({
	value: s
});

const merge = (oldObj, newObj) =>
	isEmpty(newObj) ? oldObj : { ...oldObj, ...newObj };

const debounceDispatch = fn => debounce(fn, 250);

export const updateAdditionalInfoState = (additionalInfo, updateState) => {
	for (const prop in additionalInfo) {
		updateState({
			path: `${prop}`,
			value: additionalInfo[prop],
			operation: 'set',
			shouldRender: true
		});
	}
};

export const createCallbacks = (
	dispatch,
	{ onValueChange, onStagedValueChange }
) => {
	const createdCallback =
		(callback, isValueChanged) =>
		(dispatchPayload, format = false) => {
			dispatch(CALLBACK_AND_DISPATCH_WITH_STATE, {
				callback,
				isValueChanged,
				dispatchPayload: {
					...dispatchPayload,
					format
				}
			});
		};
	// only debounce staged value change, as we don't want to call it every time the value changes
	// in the field with the focus present
	return {
		onValueChange: createdCallback(onValueChange, true),
		onStagedValueChange: debounceDispatch(
			createdCallback(onStagedValueChange, false)
		)
	};
};

export const setInitialStateWithValue =
	(format = passthrough) =>
	({ properties }) => {
		const { initialValue, initialDisplayValue } = properties;
		const derivedInitialDisplayValue = toString(initialDisplayValue);

		const { value, ...additionalInfo } = omit(
			format(toString(initialValue), properties),
			['error']
		);
		const displayValue = derivedInitialDisplayValue || value;
		return {
			isSuggestionsOpened: false,
			hasFocus: false,
			value: displayValue,
			stagedValue: displayValue,
			...additionalInfo
		};
	};

export const withState = view => (state, helpers) => {
	const { dispatch, updateState } = helpers;
	const { onValueChange, onStagedValueChange } = state.properties;
	const {
		onValueChange: onValueChangeCallback,
		onStagedValueChange: onStagedValueChangeCallback
	} = createCallbacks(dispatch, {
		onValueChange,
		onStagedValueChange
	});
	const { onFocus } = state.properties;
	const onFocusEvent = event => {
		updateState({
			path: 'hasFocus',
			value: true,
			operation: 'set',
			shouldRender: true
		});
		if (isFunction(onFocus)) {
			onFocus(event);
		}
	};
	const attrs = {
		onValueChange: onValueChangeCallback,
		onStagedValueChange: onStagedValueChangeCallback,
		onFocus: onFocusEvent,
		onChange: (event, encodedValue) =>
			dispatch('WITH_STATE_INTERNAL#ON_CHANGE', {
				targetValue: encodedValue || get(event, 'target.value', ''),
				encodedValue
			}),
		onBlur: (event, targetValue) =>
			dispatch('WITH_STATE_INTERNAL#ON_BLUR', {
				event,
				targetValue: targetValue || event.target.value
			})
	};
	return view({ ...state, ...attrs }, helpers);
};

export const handleInitialValue = ({
	rawValue,
	newValue,
	oldValue,
	state,
	properties,
	format,
	updateState
}) => {
	if ((state.isBlur && !rawValue) || newValue !== oldValue) {
		const {
			additionalInfo: sAdditionalInfo,
			internalValue,
			value: sValue,
			error: sError
		} = state;
		const {
			value: formattedValue,
			error,
			...additionalInfo
		} = format(newValue, properties, sAdditionalInfo);

		const mergedAdditionalInfo = merge(sAdditionalInfo, additionalInfo);

		if (
			newValue !== internalValue ||
			formattedValue !== sValue ||
			error !== sError ||
			mergedAdditionalInfo !== sAdditionalInfo
		) {
			updateState([
				{
					path: `internalValue`,
					value: newValue,
					operation: 'set',
					shouldRender: false
				},
				{
					path: `value`,
					value: formattedValue,
					operation: 'set',
					shouldRender: true
				},
				{
					path: `additionalInfo`,
					value: mergedAdditionalInfo,
					operation: 'set',
					shouldRender: false
				},
				{
					path: `error`,
					value: error,
					operation: 'set',
					shouldRender: false
				},
				{
					path: `isBlur`,
					value: false,
					operation: 'set',
					shouldRender: false
				}
			]);
			updateAdditionalInfoState(mergedAdditionalInfo, updateState);
		}
	}
};

/**
 * This behavior replaces the withState HOC provided to normalize
 * `dispatch`, `onValueChange`, and `onStagedValueChange`, `value`, `additionalInfo` props and functions for wrapped components.
 *
 *  Options (with defaults):
 *  initialValueProp = 'value',
 *  initialDisplayValueProp = 'displayValue',
 *  cache = true
 * 	parse = passthrough,
 *  format = passthrough,
 *  trackInputChange = false
 *
 *
 * ```js
 * import createWithStateBehavior from '@devsnc/sn-controls-common';
 *
 * createCustomElement('sn-example', {
 *   // ...
 * behaviors: [ createWithStateBehavior({cache: true}) ];
 * });
 * ```
 *
 * @seismicBehavior withStateBehavior
 * @summary Behavior used to provide value and additionalInfo in state.
 */

export const createWithStateBehavior = (options = {}) => {
	const {
		initialValueProp = 'value',
		initialDisplayValueProp = 'displayValue',
		cache = true,
		parse = passthrough,
		format = passthrough,
		trackInputChange = false,
		eventBased = true,
		fieldChangeHandlers = {
			onBlur: NOW_INPUT.INVALID_SET,
			onChange: NOW_INPUT.INPUT
		}
	} = options;

	const parseAndFormat = (value, props, additionalInfo = {}) => {
		const { value: parsedValue, error } = parse(value, props, additionalInfo);
		if (!error) {
			const { value: formattedValue, error } = format(
				parsedValue,
				props,
				additionalInfo
			);

			return {
				parsedValue,
				formattedValue,
				additionalInfo,
				error
			};
		}

		return {
			parsedValue,
			formattedValue: value,
			additionalInfo,
			error
		};
	};

	const inputChangeIsTracked = state => trackInputChange && !state.inputChanged;

	const componentConnectedEffectWithState = ({
		host,
		properties,
		updateState
	}) => {
		componentConnectedEffect(callbackWithStateBehavior, {
			initialValueProp,
			initialDisplayValueProp
		})({ host, properties, updateState });
		const {
			initialValue: pInitialValue,
			initialDisplayValue: pInitialDisplayValue
		} = properties;

		const initialValue = toString(pInitialValue);
		const initialDisplayValue = toString(pInitialDisplayValue);

		const { value, error, ...additionalInfo } = format(
			initialValue,
			properties
		);

		updateState([
			{
				path: `internalValue`,
				value: initialValue,
				operation: 'set',
				shouldRender: false
			},
			{
				path: `value`,
				value: initialDisplayValue || value,
				operation: 'set',
				shouldRender: false
			},
			{
				path: `additionalInfo`,
				value: additionalInfo,
				operation: 'set',
				shouldRender: false
			},
			{
				path: `error`,
				value: error,
				operation: 'set',
				shouldRender: false
			},
			{
				path: `isBlur`,
				value: false,
				operation: 'set',
				shouldRender: false
			}
		]);
		if (trackInputChange) {
			updateState({
				path: 'inputChanged',
				value: false,
				operation: 'set',
				shouldRender: false
			});
		}
		updateAdditionalInfoState(additionalInfo, updateState);
	};

	const propertyChangedEffectWithState = ({
		host,
		action: {
			payload: { name, value, previousValue }
		},
		state,
		properties,
		updateState
	}) => {
		propertyChangedEffect(callbackWithStateBehavior, {
			initialValueProp,
			initialDisplayValueProp
		})({
			host,
			action: {
				payload: { name, value }
			},
			state,
			properties,
			updateState
		});
		// Allow new props to update value state _only_ when the field doesn't
		// have focus
		if (name === 'initialValue' && !state.isHandlingInitialValue) {
			const nextInitialValue = toString(value);
			const oldInitialValue = toString(previousValue);
			handleInitialValue({
				rawValue: value,
				newValue: nextInitialValue,
				oldValue: oldInitialValue,
				state,
				properties,
				format,
				updateState
			});
		}
	};

	const callbackAndDispatchEffectWithState = ({
		host,
		state,
		updateState,
		properties,
		dispatch,
		action: { payload }
	}) => {
		const {
			callback: originalCallback,
			dispatchPayload: callbackPayload,
			isValueChanged: isOnValueChange
		} = payload;
		if (
			isOnValueChange &&
			inputChangeIsTracked(state) &&
			isEqual(callbackPayload.additionalInfo, state.additionalInfo)
		) {
			return;
		}
		let dispatchPayload = callbackPayload.fromEvent ? callbackPayload : {};
		let isValueChanged = isOnValueChange;
		let callback = originalCallback;
		if (isValueChanged && !callbackPayload.fromEvent) {
			if (callbackPayload.format) {
				const {
					parsedValue,
					formattedValue,
					error,
					additionalInfo: newAdditionalInfo
				} = parseAndFormat(
					callbackPayload.value,
					properties,
					merge(state.additionalInfo, callbackPayload.additionalInfo),
					parse,
					format
				);

				dispatchPayload = {
					...dispatchPayload,
					value: parsedValue,
					displayValue: formattedValue,
					error
				};
				const mergedAdditionalInfo = merge(
					state.additionalInfo,
					newAdditionalInfo
				);

				updateState([
					{
						path: `internalValue`,
						value: parsedValue,
						operation: 'set',
						shouldRender: false
					},
					{
						path: `value`,
						value: formattedValue,
						operation: 'set',
						shouldRender: true
					},
					{
						path: `additionalInfo`,
						value: mergedAdditionalInfo,
						operation: 'set',
						shouldRender: false
					},
					{
						path: `error`,
						value: error,
						operation: 'set',
						shouldRender: false
					}
				]);
				updateAdditionalInfoState(mergedAdditionalInfo, updateState);
			} else {
				dispatchPayload = {
					...dispatchPayload,
					value: callbackPayload.value,
					displayValue: callbackPayload.value
				};
				isValueChanged = false; //onStagedValueChange needs to be called, so changed it to false;
				callback = properties.onStagedValueChange;
				const mergedAdditionalInfo = merge(
					state.additionalInfo,
					callbackPayload.additionalInfo
				);

				updateState([
					{
						path: `internalValue`,
						value: callbackPayload.value,
						operation: 'set',
						shouldRender: false
					},
					{
						path: `value`,
						value: callbackPayload.value,
						operation: 'set',
						shouldRender: true
					},
					{
						path: `additionalInfo`,
						value: mergedAdditionalInfo,
						operation: 'set',
						shouldRender: false
					}
				]);
				updateAdditionalInfoState(mergedAdditionalInfo, updateState);
			}
		}
		callbackAndDispatchEffect(callbackWithStateBehavior, {
			cache,
			initialValueProp
		})({
			host,
			state,
			updateState,
			properties,
			dispatch,
			payload: { callback, dispatchPayload, isValueChanged }
		});
	};

	const onChange = ({ value, state, properties, dispatch, updateState }) => {
		if (eventBased)
			updateState([
				{
					path: `internalValue`,
					value,
					operation: 'set',
					shouldRender: false
				},
				{
					path: `value`,
					value,
					operation: 'set',
					shouldRender: false
				}
			]);
		else updateState({ stagedValue: value });

		if (inputChangeIsTracked(state)) {
			updateState({
				path: 'inputChanged',
				value: true,
				operation: 'set',
				shouldRender: false
			});
		}

		dispatch(CALLBACK_AND_DISPATCH_WITH_STATE, {
			callback: properties.onStagedValueChange,
			dispatchPayload: {
				value,
				fromEvent: true
			},
			isValueChanged: false
		});
	};

	const onBlur = ({
		event,
		targetValue,
		dispatch,
		properties,
		state,
		updateState
	}) => {
		if (inputChangeIsTracked(state)) return;
		const {
			parsedValue,
			formattedValue,
			error,
			additionalInfo: newAdditionalInfo
		} = parseAndFormat(
			targetValue,
			properties,
			state.additionalInfo,
			parse,
			format
		);

		const mergedAdditionalInfo = merge(state.additionalInfo, newAdditionalInfo);
		updateState([
			{
				path: `internalValue`,
				value: parsedValue,
				operation: 'set',
				shouldRender: false
			},
			{
				path: `value`,
				value: formattedValue,
				operation: 'set',
				shouldRender: false
			},
			{
				path: `additionalInfo`,
				value: mergedAdditionalInfo,
				operation: 'set',
				shouldRender: false
			},
			{
				path: `error`,
				value: error,
				operation: 'set',
				shouldRender: false
			},
			{
				path: `isBlur`,
				value: true,
				operation: 'set',
				shouldRender: false
			}
		]);
		updateAdditionalInfoState(mergedAdditionalInfo, updateState);
		if (trackInputChange) {
			updateState({
				path: 'inputChanged',
				value: false,
				operation: 'set',
				shouldRender: false
			});
		}

		// value is updated on blur only
		dispatch(CALLBACK_AND_DISPATCH_WITH_STATE, {
			callback: properties.onValueChange,
			isValueChanged: true,
			dispatchPayload: {
				event,
				error,
				value: parsedValue,
				displayValue: formattedValue,
				fromEvent: true
			},
			options: { cache: true }
		});
	};

	const onChangeEffect = ({
		action: {
			payload: { targetValue, encodedValue }
		},
		dispatch,
		state,
		properties,
		updateState
	}) => {
		const value = encodedValue || targetValue;
		onChange({ value, state, properties, dispatch, updateState });
	};

	const onBlurEffect = ({
		action: {
			payload: { event, targetValue }
		},
		dispatch,
		properties,
		state,
		updateState
	}) => {
		onBlur({ event, targetValue, dispatch, properties, state, updateState });
	};

	const onInputChangeEffect = ({
		action: {
			payload: { fieldValue: value }
		},
		dispatch,
		state,
		properties,
		updateState
	}) => {
		onChange({ value, state, properties, dispatch, updateState });
	};

	const onInputBlurEffect = ({
		action: {
			payload: { fieldValue: targetValue }
		},
		dispatch,
		properties,
		state,
		updateState
	}) => {
		if (isAttrTrue(properties?.readonly)) return;

		const event = {
			target: {
				targetValue
			}
		};
		onBlur({ event, targetValue, dispatch, properties, state, updateState });
	};

	return {
		name: callbackWithStateBehavior,
		actionHandlers: {
			[COMPONENT_CONNECTED]: componentConnectedEffectWithState,
			[COMPONENT_PROPERTY_CHANGED]: propertyChangedEffectWithState,
			[CALLBACK_AND_DISPATCH_WITH_STATE]: callbackAndDispatchEffectWithState,
			//TODO: Remove eventBased action handlers and respective callbacks once we internally use NDS for all inputs requiring withState behavior
			...(eventBased
				? {
						'WITH_STATE_INTERNAL#ON_CHANGE': onChangeEffect,
						'WITH_STATE_INTERNAL#ON_BLUR': onBlurEffect
				  }
				: {
						[fieldChangeHandlers.onBlur]: onInputBlurEffect,
						[fieldChangeHandlers.onChange]: onInputChangeEffect
				  })
		}
	};
};
