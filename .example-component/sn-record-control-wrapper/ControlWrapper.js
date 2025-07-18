import makeClass from 'classnames';
import { mapValues, isString, isEmpty } from 'lodash';
import { createSlot } from '@servicenow/ui-renderer-snabbdom';
import { createCustomElement } from '@servicenow/ui-core';
import {
	renderFormFieldMessages,
	renderFormFieldLabel
} from '@servicenow/now-input';
import {
	isAttrTrue,
	generateSubComponentIds,
	transformState,
	renderHighlightedValue,
	transformDescriptionAndMessages,
	wrapHelperContent
} from '@devsnc/sn-controls-common';

import style from './controlwrapper.scss';
import { fieldLayoutSchema } from '@devsnc/sn-controls-common';

/**
 * Wrapping component that provides common behavior for nearly all
 * for controls: label, focus classes, error state, etc.
 *
 * Components that are shaped more like an input should use
 * FieldAndDropdownWrapperSeismic instead.
 */
export default function ControlWrapper(
	{
		label,
		align,
		required,
		readonly,
		description,
		invalid,
		hasFocus,
		reversed,
		messages,
		wrapperRef,
		slot,
		componentId,
		variant,
		fieldset = false,
		helperContent,
		highlightedValue = {},
		fieldLayout = {},
		alignCenter
	},
	children
) {
	const {
		layout ='vertical',
		columns
	} = fieldLayout;
	const customColumn =
		columns?.length > 2
			? columns?.map((c) => `minmax(0, ${c})`)?.join(' ') ?? ''
			: '';
	const className = makeClass(
		'sn-control',
		'sn-form-field-layout',
		mapValues(
			{
				'is-required': required,
				// TODO: we only support `readonly` prop, but we use the `disabled`
				// design. Work with XD to align.
				'is-readonly': readonly,
				'is-focus': hasFocus,
				'has-error': invalid,
				'is-align-end': align === 'end' && !isAttrTrue(reversed),
				'is-align-end-reversed': align === 'end' && isAttrTrue(reversed),
				[`-${layout}`]: true,
				'align-center': alignCenter
			},
			isAttrTrue
		),
		isString(variant)
			? variant
					.split(' ')
					.map(v => `-${v}`)
					.join(' ')
			: null
	);

	const ids = generateSubComponentIds(componentId);

	return (
		<div style={
			layout === 'horizontal' ? {'grid-template-columns': customColumn} : undefined
		}
		className={className} ref={wrapperRef} slot={slot}>
				{!fieldset && label && !isEmpty(label.trim()) && (
					<div className="form-field-label-wrap">
						{renderFormFieldLabel(
							componentId,
							invalid,
							isAttrTrue(required),
							null,
							label,
							wrapHelperContent(helperContent),
							false,
							'label',
							layout
						)}
						{layout === "vertical" && <div className="sn-control-highlighted-field-label-end">
							{renderHighlightedValue(highlightedValue, fieldLayout)}
						</div>}
						</div>
				)}
				{fieldset ? (
					<fieldset className="default-fieldset">
						<legend
							className="sn-control-label"
							id={ids.label}
							htmlFor={componentId}
							required={required}
						>
							{label}
						</legend>
						{children ? <div className="sn-form-field">{createSlot(children)}</div> : <slot></slot>}
					</fieldset>
				) : children ? (
					<div className="sn-form-field">{createSlot(children)}</div>
				) : (
					<slot></slot>
				)}
				{layout === "horizontal" && !fieldset && <div className="sn-control-highlighted-field-label-end">
							{renderHighlightedValue(highlightedValue, fieldLayout)}
					</div>
				}
			<div className="form-field-message-container">
			{renderFormFieldMessages(
				componentId,
				transformDescriptionAndMessages(description, messages)
			)}
		</div>
		</div>
	);
}

const view = state => {
	return <ControlWrapper {...state.properties} />;
};

/**
 * Wrapping component that provides common behavior for nearly all
 * for controls: label, focus classes, error state, etc.
 *
 * Components that are shaped more like an input should use
 * FieldAndDropdownWrapperSeismic instead.
 *
 * ```jsx
 * <sn-record-control-wrapper
 * 	label="Dummy Component"
 * 	description="This is an example of Control Wrapper in use"
 * >
 * 	<div>
 * 		<input value="This is a dummy component" readOnly />
 * 	</div>
 * </sn-record-control-wrapper>
 * ```
 *
 * @seismicElement sn-record-control-wrapper
 * @summary Wrapper for Form Controls that provides all common form-controls functionalities such as info messages, labels, error states
 *
 * */
createCustomElement('sn-record-control-wrapper', {
	view,
	styles: style,
	properties: {
		/**
		 * Alignment - use Value "end" for a right Text Align
		 * @type {string}
		 */
		align: {},
		/**
		 * Unique identifier for the component.
		 * @type {string}
		 */
		componentId: {},
		/**
		 * Additional content describing the field, usually to provide further
		 * instruction to the user.
		 * @type {string}
		 */
		description: {},
		/**
		 * Fieldset - Flag to inidcate a group of related elements
		 * @type {boolean}
		 */
		fieldset: { default: false },
		/**
		 * Is the component in focus
		 * @type {string|boolean}
		 */
		hasFocus: { default: false },
		/**
		 * Specifies whether the current value is not valid.
		 * When passed as a string, "true" (case-sensitive) will be treated like
		 * boolean true.
		 * @type {string | boolean}
		 */
		invalid: { default: false },
		/**
		 * It's a label! All form controls need a label!
		 * @type {string}
		 */
		label: {},
		/**
		 * Array of message objects that must contain type and message itself.
		 * @type {Array<{type: ("error"|"warning"|"success"|"liveUpdate"|"info"|"suggestion"), type:Array<string,Object<{string, getMessage:function}>> }>}
		 */
		messages: { default: [] },
		/**
		 * Specifies that the user cannot modify the value of the component.
		 * When passed as a string, "true" (case-sensitive) will be treated like
		 * boolean true.
		 * @type {boolean}
		 */
		readonly: { default: false },
		/**
		 * Whether or not the user must fill in a value for this component.
		 * Can be specified as a boolean or the string "true"
		 * @type {boolean}
		 */
		required: { default: false },
		/**
		 * Defines the styles used to render the wrapper.
		 * @type {string}
		 */
		variant: {},
		/**
		 * Reference to the element.
		 * @type {HTMLElement}
		 */
		wrapperRef: {},
		/**
		 * If set, an iconic button with a popover appears next to the field
		 * label to display additional hint text to the user, such as
		 * password requirements or other instructions for completing the field.
		 * @type {(string|JSX)}
		 */
		helperContent: { schema: { type: 'string' } },
		/**
		 * The highlighted Value labels that you want to display beside the Field Label. Can be an array of highlighted values or just single highlighted value object
		 * @type {[{ value: 'string', status: 'string', showIcon: boolean, variantName: 'string', colorName: 'string',iconName: 'string'  }]}
		 */
		highlightedValue: { default: {}, schema: { anyOf: [{ type: 'object' }, { type: 'array' }] } },
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
		/**
		 * Specifies whether to align items in center of grid container with padding-block-start or not
		 * @type {boolean}
		 */
		alignCenter: { default: false }
	},
	transformState
});
