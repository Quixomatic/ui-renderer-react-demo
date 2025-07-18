import { createCustomElement } from '@servicenow/ui-core';
import { snabbdom } from '@servicenow/ui-renderer-snabbdom';
import { view } from './view.js';
const NOW_BUTTON_CLICKED = 'NOW_BUTTON#CLICKED';
createCustomElement('sc-multi-row-header-action-button', {
	renderer: {
		type: snabbdom
	},
	view,
	properties: {
		/**
		 * Text displayed inside the button.
		 * @type {string}
		 */
		label: { default: '' },
		/**
		 * Sets the button styles, including colors and interaction behaviors.
		 * `inherit` inherits the text color. It is only applied when `bare` is true.
		 * @type {('primary'|'primary-positive'|'primary-negative'|'secondary'|'secondary-positive'|'secondary-negative'|'tertiary'|'inherit')}
		 */
		variant: { default: 'secondary' },
		/**
		 * Sets the button size.
		 * @type {('sm'|'md'|'lg')}
		 */
		size: { default: 'md' },
		/** @private */
		iconName: { default: '' },
		/**
		 * If defined, specifies the icon to display at the start of the button.
		 * See the `now-icon` component documentation for valid inputs.
		 * @type {string}
		 */
		icon: { default: '' },
		/**
		 * Makes the button border and background transparent but retains its
		 * `variant` style setting when an iconic button. If button is text or text
		 * with an icon then only works when `variant` is `secondary` or `tertiary`.
		 * @type {boolean}
		 */
		bare: { default: false },
		/**
		 * Whether to mute the button color and disallow user click interactions.
		 * @type {boolean}
		 */
		disabled: { default: false },
		/**
		 * An object whose items, all aria properties, will be set on the inner
		 * html `<button>`.
		 * See https://www.w3.org/TR/wai-aria-1.1/#button for properties and
		 * accepted values.
		 * @type {{ 'aria-*': string }}
		 */
		configAria: { cast: 'object' },
		/**
		 * Text content shown inside the tooltip
		 * @type {string}
		 */
		tooltipContent: { default: '' },
		onClickAction: {
			default: NOW_BUTTON_CLICKED
		}
	},
	actionHandlers: {
		[NOW_BUTTON_CLICKED]: ({ action, dispatch, properties }) => {
			dispatch(properties.onClickAction, action.payload);
		}
	},
	actions: {
		[NOW_BUTTON_CLICKED]: {
			private: true
		}
	}
});
