import { createCustomElement } from '@servicenow/ui-core';
import { transformState } from '@devsnc/sn-controls-common';
import { default as view } from './view';
import style from './style.scss';
import { actionHandlers } from './actionHandlers';

createCustomElement('sn-record-control', {
	view,
	style,
	properties: {
		/**
		 * Text for the button
		 * @type {string}
		 */
		label: {},

		/**
		 * Variant for the button
		 * @type {string}
		 */
		variant: {},

		/**
		 * Size of the button
		 * @type {string}
		 */
		size: {},

		/**
		 * placement of the button
		 * @type {boolean}
		 */
		reverseIconPlacement: {},

		/**
		 * type of the button
		 * @type {boolean}
		 */
		bare: {},

		/**
		 * Label for the tooltip
		 * @type {string}
		 */
		tooltip: {},

		/**
		 * Icon for the control
		 * @type {string}
		 */
		icon: {},

		/**
		 * Whether button is iconic
		 * @type {boolean}
		 */
		iconic: {},

		/**
		 * ref callback to inner button element
		 * @type {function}
		 */
		innerRef: {},

		/**
		 * Click handler for the control
		 * @type {function}
		 */
		onClick: {},

		/**
		 * Is the control disabled
		 * @type {boolean}
		 */
		disabled: {},

		/**
		 * aria-* attribute configuration
		 * @type {object}
		 */
		configAria: {},

		/**
		 * Content to render within the control button
		 * @type {node}
		 */
		children: {}
	},
	actionHandlers: actionHandlers,
	transformState
});

export default view;
