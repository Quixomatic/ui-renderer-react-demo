import { fieldLayoutSchema } from "../schemas";

/**
 * Basic props that are common to seismic components in our repo
 */
const seismicProps = {
	/**
	 * Array of message objects that must contain type and message itself.
	 *
	 * @type {Array<{type: ("error"|"warning"|"success"|"liveUpdate"|"info"|"suggestion"), type:Array<string,Object<{string, getMessage:function}>> }>}
	 */
	messages: {},

	/**
	 * formData object containing glide form data
	 *
	 * @type {object}
	 */
	formData: {},

	/**
	 * Name of the field
	 *
	 * @type {string}
	 */
	fieldName: { schema: { type: 'string' } },

	/**
	 * Name of table this field is on
	 * @type {string}
	 */
	tableName: { schema: { type: 'string' } },

	/**
	 * sys_id of the current record where the field is located
	 *
	 * @type {string}
	 */
	recordSysId: { schema: { type: 'string' } },

	/**
	 * The field name
	 * @type {string}
	 */
	name: { schema: { type: 'string' } },

	/**
	 * Content to display when there is no suitable display value.
	 * @type {string}
	 */
	placeholder: { schema: { type: 'string' } },

	/**
	 * Name for the component.
	 * @type {string}
	 */
	label: { schema: { type: 'string' } },

	/**
	 * Value for current omponent.
	 * @type {string}
	 */
	value: { schema: { type: 'string' } },

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
	 * @type {function}
	 */
	onValueChange: {},

	/**
	 * Callback used when an intermediate value has changed.
	 * @type {function}
	 */
	onStagedValueChange: {},

	/**
	 * Additional content describing the field, usually to provide further
	 * instruction to the user.
	 * @type {string}
	 */
	description: { schema: { type: 'string' }, default: '' },

	/**
	 * Whether or not the user must fill in a value for this component.
	 * Can be specified as a boolean or the string "true"
	 * @type {string | boolean}
	 */
	required: { default: false },

	/**
	 * Specifies that the user cannot modify the value of the component.
	 * When passed as a string, "true" (case-sensitive) will be treated like
	 * @type {string | boolean}
	 */
	readonly: { default: false },

	/**
	 * Specifies that the field should be rendered right-to-left.
	 * When passed as a string, "true" (case-sensitive) will be treated like
	 * boolean true.
	 * @type {string | boolean}
	 */
	reversed: { default: false },

	/**
	 * Specifies whether the current value is not valid.
	 * When passed as a string, "true" (case-sensitive) will be treated like
	 * boolean true.
	 * @type {string | boolean}
	 */
	invalid: { default: false },

	/**
	 * Causes the component to receive focus as soon as it has finished
	 * mounting.
	 * When passed as a string, "true" (case-sensitive) will be treated like
	 * boolean true.
	 * @type {string | boolean}
	 */
	autofocus: { default: false },

	/**
	 * Unique name for a shadowDom slot
	 * @type {string}
	 */
	slot: { schema: { type: 'string' } },

	/**
	 * Accessible label for the component. Only needed when the `label` prop is not
	 * descriptive enough on its own.
	 * @type {string}
	 */
	'aria-label': { schema: { type: 'string' } },

	/**
	 * Which element (by ID) acts as a label for the component
	 * @type {string}
	 */
	'aria-labelledby': { schema: { type: 'string' } },

	/**
	 * Which element (by ID) provides more description for the component
	 * @type {string}
	 */
	'aria-describedby': { schema: { type: 'string' } },

	/**
	 * aria-* attribute configuration
	 * @type {object}
	 */
	configAria: {},

	/**
	 * Configuration for the field layout.
	 *
	 * Indicates whether the layout will be vertical (stacked view) or horizontal (inline view)
	 * In a horizontal layout, a typical component has three containers: label, formfield and slottted content (also known as label end)
	 * Only if the layout is `horizontal`, the component uses the columns array to set the grid template columns width for these containers.
	 *
	 * Object options:
	 * - `[fieldLayout.layout]`: String. Determines whether the labels, field and slotted content are laid out vertically or horizontally.
	 * - `[fieldLayout.columns]`: Array<string>. Width ratio of horizontal container element (i.e. label, form field and label end slotted content).
	 *
	 * @type {{layout:('horizontal'|'vertical'), columns: array<string>}}
	 * @uib.label Field Layout Configuration
	 * @uib.description Configuration for the field layout. Determines whether the labels, field and slotted content are arranged vertically or horizontally, and their respective proportion in a horizontal container.
	 * @uib.defaultValue {"layout": "vertical"}
	 * @uib.fieldType json
	 */
	fieldLayout: {
		default: {layout: 'vertical'},
		schema: fieldLayoutSchema
	},

	fieldType: { schema: { type: 'string' } },

	/**
	 * If set, an iconic button with a popover appears next to the field
	 * label to display additional hint text to the user, such as
	 * password requirements or other instructions for completing the field.
	 * @type {(string|JSX)}
	 */
	helperContent: { schema: { type: 'string' } }
};

export default seismicProps;
