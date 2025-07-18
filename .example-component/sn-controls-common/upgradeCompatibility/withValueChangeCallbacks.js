/**
 * HOC to provide normalized `dispatch`, `onValueChange`, and
 * `onStagedValueChange` prop functions for wrapped components.
 *
 * `onValueChange` and `onStagedValueChange` should be called
 * with a single object parameter, which should contain the data
 * payload to event up to the parent/through Seismic
 *
 * e.g.:
 *
 *   this.props.onValueChange({ value: 'the value' });
 *   this.props.onStagedValueChange({ value: 'the staged value' })
 *
 * The on*ValueChange functions also handle dispatching the event
 * up through Seismic.
 *
 * By default, this HOC also caches the payload between multiple
 * on*ValueChange calls, preventing sequential calls with the same payload.
 * This behavior can be disabled by providing the `cache: false` option.
 */
import {
	isEqualWith,
	isFunction,
	isNil,
	noop,
	pick,
	isObject,
	camelCase,
	curry,
	isUndefined,
	set
} from 'lodash';
import React from 'react';

const allLowerCase = s => camelCase(s).toLowerCase();
const undefinedToNull = thing => (isUndefined(thing) ? null : thing);

/**
 * Parent on*ValueChange functions originally supported the following
 * signature:
 *
 * (event, name, value, displayValue)
 *
 * But having the most useful pieces of data as the 3rd and 4th
 * argument sucks + it's inconsistent with our dispatch data. This
 * conditionally allows passing the entire payload obj as first
 * parameter if the callback isn't expecting multiple args.
 */
export const adaptCallbackForLegacyAPI = callback => payload => {
	if (!isFunction(callback) || !isObject(payload)) {
		return false;
	}

	const args =
		callback.length > 1
			? [
					payload.event,
					payload.name,
					payload.value,
					payload.displayValue,
					payload.error,
					payload.additionalInfo
			  ].map(undefinedToNull)
			: [payload];

	callback(...args);

	return true;
};

const createHOC = curry(
	(
		{
			initialValueProp = 'value',
			initialDisplayValueProp = 'displayValue',
			cache = true,
			stopBubbling = []
		},
		Control
	) =>
		class OnValueChangeProvider extends React.Component {
			static displayName = `OnValueChangeProvider(${
				Control.name || Control.displayName || 'Component'
			})`;
			static behaviors = Control.behaviors;
			static defaultProps = Control.defaultProps;
			static propTypes = Control.propTypes;
			static properties = Control.properties;
			static style = Control.style;
			static initialState = Control.initialState;
			static actionHandlers = stopBubbling.reduce((acc, curr) => {
				if (curr.indexOf('#') !== -1) {
					set(acc, curr, { stopPropagation: true });
				} else {
					set(acc, `${curr}#VALUE_CHANGED`, { stopPropagation: true });
					set(acc, `${curr}#STAGED_VALUE_CHANGED`, { stopPropagation: true });
				}
				return acc;
			}, Control.actionHandlers);

			constructor(props) {
				super(props);
				this.componentName = Control.componentName || props.componentName;
				this.componentNameWithHash = this.componentName
					? `${this.componentName
							.replace(new RegExp('-', 'g'), '_')
							.toUpperCase()}#`
					: '';
				this.state = {
					callbacks: this.createValueChangeCallbacks(props),
					dispatchCache: {
						[`${this.componentNameWithHash}VALUE_CHANGED`]: {
							value: props[initialValueProp],
							displayValue: props[initialDisplayValueProp]
						},
						[`${this.componentNameWithHash}STAGED_VALUE_CHANGED`]: {
							value: props[initialValueProp],
							displayValue: props[initialDisplayValueProp]
						}
					}
				};
			}

			componentWillReceiveProps(newProps) {
				if (
					newProps.onValueChange !== this.props.onValueChange ||
					newProps.onStagedValueChange !== this.props.onStagedValueChange ||
					newProps.dispatch !== this.props.dispatch ||
					newProps.name !== this.props.name
				) {
					this.setState({
						callbacks: this.createValueChangeCallbacks(newProps)
					});
				}

				if (
					newProps[initialValueProp] !== this.props[initialValueProp] ||
					newProps[initialDisplayValueProp] !==
						this.props[initialDisplayValueProp]
				) {
					this.setState({
						dispatchCache: {
							[`${this.componentNameWithHash}VALUE_CHANGED`]: {
								value: newProps[initialValueProp],
								displayValue: newProps[initialDisplayValueProp]
							},
							[`${this.componentNameWithHash}STAGED_VALUE_CHANGED`]: {
								value: newProps[initialValueProp],
								displayValue: newProps[initialDisplayValueProp]
							}
						}
					});
				}
			}

			doesPayloadMatchCache(payload, actionType) {
				const cache = this.state.dispatchCache[actionType];

				if (!cache) {
					return false;
				}

				const compare = (a, b) => {
					// treat null and undefined as equal
					if (isNil(a) && isNil(b)) {
						return true;
					}
					// returning `undefined` to default to normal `isEqual` behavior
				};
				//ignoring cache when onValueChange is called from onBlur. We need to notify form even when the user enters the same value consecutively multiple times. This is done to maintain parity with platform so that onChange client script can be run for every value change.
				return (
					!payload.ignoreCache &&
					isEqualWith(payload.error, cache.error, compare) &&
					isEqualWith(payload.value, cache.value, compare) &&
					isEqualWith(payload.displayValue, cache.displayValue, compare)
				);
			}

			createValueChangeCallbacks(props) {
				const callbackAndDispatch = (callback, actionType) => payload => {
					if (!isObject(payload)) {
						payload = {};
					}

					// Don't emit anything if the data hasn't actually changed...
					if (cache && this.doesPayloadMatchCache(payload, actionType)) {
						return false;
					}

					if (!payload.name && props.name) {
						payload = {
							...payload,
							name: props.name
						};
					}

					adaptCallbackForLegacyAPI(callback)(payload);

					// When a direct callback is provided, just use that instead of
					// dispatching.
					if (
						isFunction(props.dispatch) &&
						(!isFunction(callback) || actionType.includes('#'))
					) {
						// We used to put the dispatch data in an extra level of nesting to
						// support old Seismic behavior. Keep that behavior for backwards
						// compatibility, also migrate towards flattening the data.
						props.dispatch(actionType, {
							[allLowerCase(actionType)]: payload,
							...payload
						});
					}

					// track value changed calls that go through the callback
					const propValue =
						props.initialValue === undefined ? props.value : props.initialValue;
					if (
						actionType.includes('#VALUE_CHANGED') &&
						!props.disableTracking &&
						propValue !== payload.value
					) {
						props.dispatch('TRACK', {
							metaData: {
								name: props.name,
								fieldType: this.componentName
							}
						});
					}

					if (cache) {
						this.setState({
							dispatchCache: {
								...this.state.dispatchCache,
								[actionType]: pick(payload, ['value', 'displayValue', 'error'])
							}
						});
					}

					return payload;
				};

				return {
					onValueChange: callbackAndDispatch(
						props.onValueChange,
						`${this.componentNameWithHash}VALUE_CHANGED`
					),
					onStagedValueChange: callbackAndDispatch(
						props.onStagedValueChange,
						`${this.componentNameWithHash}STAGED_VALUE_CHANGED`
					),

					dispatch: isFunction(props.dispatch) ? props.dispatch : noop
				};
			}

			render() {
				return <Control {...this.props} {...this.state.callbacks} />;
			}
		}
);

// allow first param config to be optional
export default (configOrControl, ...args) => {
	// withValueChangeCallbacks(Component)
	if (isFunction(configOrControl)) {
		return createHOC({}, configOrControl);
	}

	// withValueChangeCallbacks(config, Component) or
	// withValueChangeCallbacks(config)(Component)
	return createHOC(configOrControl, ...args);
};
