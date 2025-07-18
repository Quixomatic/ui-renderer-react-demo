import makeClass from 'classnames';
import { omit, compact } from 'lodash';

import { createCustomElement } from '@servicenow/ui-core';
import { Fragment } from '@servicenow/ui-renderer-snabbdom';

import '@servicenow/now-icon';
import '@servicenow/now-dropdown';
import '@servicenow/now-input';
import tooltipBehavior from '@servicenow/behavior-tooltip';
import truncationBehavior from '@servicenow/behavior-truncation';

// Function imports
import {
	getFieldDisplayValue,
	accessibilityAttributes,
	isEditable,
	isAttrTrue,
	createWithValueChangeCallbackBehavior,
	wrapHelperContent,
	transformDescriptionAndMessages,
	SeismicComponentFieldPropDefaults,
	SeismicComponentProps,
	SeismicControlledFieldProps,
	withValueChangeCallbacksView,
	transformState,
	getAriaLabelFromConfig
} from '@devsnc/sn-controls-common';

// Style imports
import style from './choice.scss';
import { actionHandlers } from './actionHandlers';
import { ControlWrapper } from '@devsnc/sn-record-control-wrapper';
import eventHandlers from './eventHandlers';
import { t } from 'sn-translate';

const withValueChangeCallbackBehavior = {
	behavior: createWithValueChangeCallbackBehavior()
};

const getAccessibilityAttributes = (state, displayValue) => {
	const { configAria, ariaLabel, label } = state.properties;
	const { isDropdownOpen } = state;
	const propAriaLabel = configAria?.['aria-label'] || ariaLabel || label;

	//screen reader to announce the label along with the selected value if exists
	const propAriaLabelWithSelectedChoice = compact([
		propAriaLabel,
		!isDropdownOpen ? displayValue : ''
	]).join(' ');

	const accessibilityAttrs = accessibilityAttributes({
		// Need an explicit `aria-label` for NVDA/JAWS :( But
		// consumer can override ariaLabel value.
		...state.properties,
		configAria: {
			...configAria,
			'aria-label': propAriaLabelWithSelectedChoice
		}
	});

	const ariaAttributes = {
		'aria-haspopup': 'listbox',
		'aria-expanded': Boolean(isDropdownOpen).toString()
	};
	return { ...accessibilityAttrs, ...ariaAttributes };
};

const transformChoices = (choices = []) => {
	return choices.map(choice => ({
		id: choice.value + '',
		label: choice.displayValue + ''
	}));
};

/**
 * Allows users to select from a predefined list of options.
 */
const view = state => {
	const {
		properties,
		properties: {
			required,
			autofocus,
			helperContent,
			label,
			messages,
			description,
			readonly,
			disabled,
			hasHover,
			value,
			className,
			choices,
			configAria
		},
		isFocused,
		isDropdownOpen
	} = state;

	const renderReadOnly = displayValue => {
		return (
			<now-input
				required={required}
				label={label}
				placeholder="—"
				messages={transformDescriptionAndMessages(description, messages)}
				helperContent={wrapHelperContent(helperContent)}
				autofocus={autofocus}
				value={displayValue}
				readonly
				config-aria={{
					input: {
						...configAria,
						...getAriaLabelFromConfig(configAria, 'Set value for {0}')
					}
				}}
			/>
		);
	};

	const renderTrigger = displayValue => {
		const { placeholder } = properties;

		if (!isEditable(properties)) return;

		return (
			<div
				slot="trigger"
				role="button"
				tabIndex={0}
				className={makeClass('sn-control-field', {
					'is-hover': hasHover,
					'read-only': isAttrTrue(readonly),
					'is-disabled': isAttrTrue(disabled)
				})}
				{...getAccessibilityAttributes(state, displayValue)}
			>
				<span
					className={makeClass(
						'sn-select',
						{
							'has-placeholder': !value && placeholder
						},
						className
					)}
				>
					<span className="sn-select-value" data-truncation>{displayValue}</span>
					<div className="sn-select-icon">
						<now-icon
							icon="caret-down-fill"
							size="sm"
							className="context-select"
						/>
					</div>
				</span>
			</div>
		);
	};

	const placeholder = isAttrTrue(readonly) ? '—' : properties.placeholder;
	const displayValue = getFieldDisplayValue(
		properties.value,
		properties.displayValue,
		placeholder,
		choices
	);
	return (
		<Fragment>
			{!isEditable(properties) ? (
				renderReadOnly(displayValue)
			) : (
				<ControlWrapper {...properties} hasFocus={isFocused || isDropdownOpen}>
					<now-dropdown-custom-target
						items={transformChoices(choices)}
						configAria={{
							panel: {
								...getAriaLabelFromConfig(configAria, 'Select value for {0}')
							}
						}}
					>
						{renderTrigger(displayValue)}
					</now-dropdown-custom-target>
				</ControlWrapper>
			)}
		</Fragment>
	);
};

createCustomElement('sn-record-choice', {
	view: withValueChangeCallbacksView(view),
	styles: style,
	actionHandlers: actionHandlers,
	eventHandlers,
	initialState: {
		isFocused: false,
		isDropdownOpen: false
	},
	transformState,
	properties: {
		...omit(SeismicComponentFieldPropDefaults, ['aria-labelledby']),
		...omit(SeismicComponentProps),
		...omit(SeismicControlledFieldProps),
		/**
		 * Current model value for the component
		 */
		value: { schema: { type: 'string' } },

		/**
		 * User-friendly representation of the current value. When not provided, the
		 * component will fallback to the displayValue for the selected choice.
		 */
		displayValue: { schema: { type: 'string' } },

		/**
		 * Array of choice objects
		 */
		choices: { schema: { type: 'array' } },

		/**
		 * Classname to apply to the sn-record-control span
		 */
		className: { schema: { type: 'string' } },
		/**
		 * The config aria property that you want to configure if label is not present.
		 * @type {{ 'aria-label': 'string' }}
		 */
		configAria: { default: {} }
	},
	behaviors: [withValueChangeCallbackBehavior, truncationBehavior, tooltipBehavior]
});

export default view;
