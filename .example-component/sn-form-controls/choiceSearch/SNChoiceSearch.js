/**
 * This component does not keep its own state. If you want it to display the selected item you need to pass it in as a `displayValue`
 */

import { omit } from 'lodash';
import snabbdom from '@servicenow/ui-renderer-snabbdom';
import { createCustomElement } from '@servicenow/ui-core';
import '@servicenow/now-icon';
import '@servicenow/now-dropdown';
import styles from './sn-record-choice-search.scss';
import {
	DROPDOWN_OPENED_SET,
	ITEM_SELECTED,
	LEGACY_ACTION,
	PANEL_FIT_PROPS
} from './constants.js';

const COMPONENT_NAME = 'sn-record-choice-search';

const choiceSearchView = state => {
	const { choices, displayValue, manageOpened, disabled } = state.properties;
	let opened = manageOpened ? state.properties.opened : state.opened;
	const processedChoices = choices.map((choice, index) => {
		const { displayValue, display, id } = choice;
		return {
			...omit(choice, ['displayValue', 'display']),
			id: id || index,
			label: displayValue,
			disabled: !display
		};
	});

	return (
		<now-dropdown-custom-target
			className="sn-record-choice-search"
			manageOpened
			opened={opened}
			panelFitProps={PANEL_FIT_PROPS}
			items={processedChoices}
			search="contains"
			select="none"
		>
			<div
				slot="trigger"
				role="button"
				class={{
					'sn-record-choice-search-trigger': true,
					'is-opened': opened
				}}
				aria-haspopup="listbox"
				aria-expanded={opened ? 'true' : 'false'}
				tabIndex={0}
			>
				<slot name="triggerButton">
					{displayValue && renderDisplayValue(displayValue, disabled)}
				</slot>
			</div>
		</now-dropdown-custom-target>
	);
};

function renderDisplayValue(displayValue, disabled) {
	return (
		<div className="sn-record-choice-search-default-label">
			{displayValue}
			<div
				class={{
					'sn-record-choice-search-caret': true,
					disabled: disabled
				}}
			>
				<now-icon icon="caret-down-fill" />
			</div>
		</div>
	);
}

createCustomElement(COMPONENT_NAME, {
	renderer: {
		type: snabbdom,
		view: choiceSearchView
	},
	initialState: {
		opened: false
	},
	properties: {
		/**
		 * If you don't want to pass your own trigger element as a slot you can pass a text
		 * @type {string}
		 */
		displayValue: { default: null },
		/**
		 * Optional callback for item selection
		 * @type {function}
		 */
		onValueChange: { default: () => {} },
		/**
		 * List of options available in the dropdown
		 * @type {{displayValue: (string|number), display: boolean}[]}
		 */
		choices: { default: [], cast: 'array' },
		/**
		 * Toggle the ability to control when to close the dropdown
		 * @type {string}
		 */
		manageOpened: { default: false },
		disabled: { default: false },
		/**
		 * If manageOpened is true then this will control when the dropdown is open
		 */
		opened: { default: false }
	},
	actionHandlers: {
		[ITEM_SELECTED]: ({ action, properties, dispatch }) => {
			const payload = action.payload.item;
			const transformedPayload = {
				...omit(payload, ['label', 'disabled']),
				displayValue: payload.label,
				display: !payload.disabled
			};
			properties.onValueChange(transformedPayload);
			action.stopPropagation();
			dispatch(LEGACY_ACTION, transformedPayload);
		},
		[DROPDOWN_OPENED_SET]: ({ action, updateState, state }) => {
			const { manageOpened } = state.properties;
			if (!manageOpened) {
				updateState({
					opened: action.payload.value
				});
				action.stopPropagation();
			}
		}
	},
	styles
});

export default COMPONENT_NAME;
