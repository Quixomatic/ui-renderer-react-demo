import tooltipBehavior from '@servicenow/behavior-tooltip';
import truncationBehavior from '@servicenow/behavior-truncation';
import {createCustomElement} from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';
import {t} from 'sn-translate';

import {
	CHECKBOX_CHECKED_SET,
	KEY_ENTER,
	KEY_SPACE,
	PROPERTIES_SET,
	SELECT_ALL_RECORDS
} from '../../constants';
import getTooltip from '../../utils/tooltipUtil';

import checkboxStyle from './checkbox.scss';

const handleSetCheckbox = (
	isChecked,
	value,
	data,
	dispatch,
	evt,
	allRecordsSelected
) => {
	dispatch(CHECKBOX_CHECKED_SET, {
		checked: isChecked,
		value,
		...data,
		event: evt
	});

	if (!isChecked && allRecordsSelected) {
		dispatch(SELECT_ALL_RECORDS, {
			allRecordsSelected: false,
			...data
		});
	}
};

const view = ({componentId, properties}, {dispatch}) => {
	const {
		value,
		name,
		disabled,
		checkedValue,
		data,
		allRecordsSelected,
		focused,
		readonly,
		title
	} = properties;

	const focusedClass = focused ? 'is-focus' : '';
	const checkedClass = checkedValue ? 'is-selected' : '';
	const disabledClass = disabled ? 'is-disabled' : '';
	const labelClass = `sn-grid-checkbox-label ${focusedClass} ${checkedClass} ${disabledClass}`;
	const selectAllMessage = t('Select all rows');

	return (
		<div className="sn-grid-checkbox">
			<label data-truncation htmlFor={componentId} className={labelClass}>
				<input
					on-change={evt =>
						handleSetCheckbox(
							evt.target.checked,
							value,
							data,
							dispatch,
							evt,
							allRecordsSelected
						)
					}
					on-keydown={evt => {
						const checked = evt.target.checked ? false : true;
						if (evt.key === KEY_SPACE || evt.key === KEY_ENTER) {
							evt.preventDefault();
							handleSetCheckbox(checked, value, data, dispatch);
						}
					}}
					on-focus={() => dispatch(PROPERTIES_SET, {focused: true})}
					on-blur={() => dispatch(PROPERTIES_SET, {focused: false})}
					data-tooltip={selectAllMessage}
					aria-label={selectAllMessage}
					data-ariadescribedby={selectAllMessage}
					{...getTooltip(dispatch)}
					id={componentId}
					checked={!!checkedValue}
					title={title}
					type="checkbox"
					className="sn-grid-checkbox-native"
					value={value}
					name={name}
					disabled={disabled}
					readOnly={readonly}
					tabIndex={readonly ? -1 : 0}
				/>
			</label>
		</div>
	);
};

createCustomElement('now-table-checkbox', {
	properties: {
		label: {},
		/**
		 * The value for this input.
		 * @type {string}
		 */
		value: {default: ''},
		/**
		 * The checked attribute for this input.
		 * @type {boolean}
		 */
		checkedValue: {default: false},
		/**
		 * A name for the input control, passed along with the value when the form data is submitted.
		 * @type {string}
		 */
		name: {default: ''},
		/**
		 * A title for the input control, passed along with the value when the form data is submitted.
		 * @type {string}
		 */
		title: {default: ''},
		/**
		 * Set to true to disable this input.
		 * @type {boolean}
		 */
		disabled: {type: Boolean},
		/**
		 * Set this flag to make the field read-only instead of interactive.
		 * @type {boolean}
		 */
		readonly: {default: false},
		/**
		 * Indicates focus is on the input
		 */
		focused: {
			default: false,
			reflect: true
		},
		allRecordsSelected: {
			default: false
		},
		data: {default: {}}
	},
	behaviors: [truncationBehavior, tooltipBehavior],
	renderer: {
		type: snabbdom,
		view
	},
	styles: `${checkboxStyle}`
});
