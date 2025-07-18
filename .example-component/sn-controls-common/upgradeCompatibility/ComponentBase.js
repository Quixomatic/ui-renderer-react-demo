/**
 * react-docgen needs this to be an exported React class (_not_ PureComponent)
 * in order for the docs to be generated correctly.
 *
 * If you want to use these proptypes, just import via
 * the index.js file instead
 */
import PropTypes from 'prop-types';
import React from 'react';

import { FIELD_MESSAGE_TYPES } from '../constants';

/**
 * TODO - Remove this file when all components are converted to seismic components
 * Basic props that are common to nearly all form components.
 */

export default class ComponentBase extends React.Component {
	static displayName = 'Any Component';
	static propTypes = {
		/** Seismic dispatcher */
		dispatch: PropTypes.func,

		/** Unique identifier for the component. */
		componentId: PropTypes.string.isRequired,

		/** Data returned by one of the Seismic resource handlers */
		resources: PropTypes.object,

		/** Asynchronous Message Bus (AMB) API */
		channels: PropTypes.object,
		/**
		 * array of message objects that must contain type and message itself.
		 */
		messages: PropTypes.arrayOf(
			PropTypes.shape({
				type: PropTypes.oneOf(FIELD_MESSAGE_TYPES),
				message: PropTypes.oneOfType([
					PropTypes.string,
					PropTypes.shape({ getMessage: PropTypes.func })
				])
			})
		),
		/**
		 * formData object containing glide form data
		 */
		formData: PropTypes.object,
		/**
		 * Name of the field
		 */
		fieldName: PropTypes.any,

		/**
		 * Name of the table the reference field is attached to
		 */

		tableName: PropTypes.string,

		/**
		 * sys_id of the current record where the field is located
		 */
		recordSysId: PropTypes.string,

		/**
		 * Name for the component. Any events dispatched by the component will use this name.
		 */
		name: PropTypes.string,

		/**
		 * Content to display when there is no suitable display value.
		 */
		placeholder: PropTypes.string,

		/**
		 * It's a label! All form controls need a label!
		 */
		label: PropTypes.string,

		/**
		 * Underlying data for the component.
		 */
		value: PropTypes.string,

		/**
		 * Callback used when the value has changed. Very similar to an `onChange`
		 * event, but this may also fire when the component formats its value
		 * onBlur.
		 *
		 * @param {object} event - The event payload
		 * @param {string} event.name - The name of the component that triggered the event
		 * @param {any}    event.value - The new value for the component
		 * @param {string} event.displayValue - The human-readable represenation of the value
		 *
		 * @param {object} event.error - If the current value is invalid, this propery will be set. When the current value is valid, this property will be null.
		 * @param {string} event.error.type - Error type
		 * @param {string} event.error.message - Description of why the value is invalid
		 */
		onValueChange: PropTypes.func,

		/**
		 * Callback used when an intermediate value has changed.
		 */
		onStagedValueChange: PropTypes.func,

		/**
		 * Additional content describing the field, usually to provide further
		 * instruction to the user.
		 */
		description: PropTypes.string,

		/**
		 * Whether or not the user must fill in a value for this component.
		 * Can be specified as a boolean or the string "true"
		 */
		required: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),

		/**
		 * Specifies that the user cannot modify the value of the component.
		 * When passed as a string, "true" (case-sensitive) will be treated like
		 * boolean true.
		 */
		readonly: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),

		/**
		 * Specifies that the field should be rendered right-to-left.
		 * When passed as a string, "true" (case-sensitive) will be treated like
		 * boolean true.
		 */
		reversed: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),

		/**
		 * Specifies whether the current value is not valid.
		 * When passed as a string, "true" (case-sensitive) will be treated like
		 * boolean true.
		 */
		invalid: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),

		/**
		 * Causes the component to receive focus as soon as it has finished
		 * mounting.
		 * When passed as a string, "true" (case-sensitive) will be treated like
		 * boolean true.
		 */
		autofocus: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),

		/**
		 * Unique name for a shadowDom slot
		 */
		slot: PropTypes.string,

		/**
		 * Accessible label for the component. Only needed when the `label` prop is not
		 * descriptive enough on its own.
		 */
		'aria-label': PropTypes.string,

		/**
		 * Which element (by ID) acts as a label for the component
		 */
		'aria-labelledby': PropTypes.string,

		/**
		 * Which element (by ID) provides more description for the component
		 */
		'aria-describedby': PropTypes.string,

		/**
		 * aria-* attribute configuration
		 */
		'config-aria': PropTypes.object,

		fieldType: PropTypes.string,
		/**
		 * If set, an iconic button with a popover appears next to the field
		 * label to display additional hint text to the user, such as
		 * password requirements or other instructions for completing the field.
		 * @type {(string|JSX)}
		 */
		helperContent: PropTypes.oneOfType([PropTypes.string, PropTypes.element])
	};
	static defaultProps = {
		componentId: 'id'
	};
}
