import '@devsnc/sn-form-controls';
import '@devsnc/sn-record-input-connected';
import {Logger} from '@devsnc/sn-list-commons';
import {createCustomElement} from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';
import isUndefined from 'lodash/isUndefined';
import map from 'lodash/map';

import {CHOICE, EMAIL, REFERENCE} from '../../../constants';

import styles from './fieldSet.scss';

const LOG = Logger().createLog('LIST EXPORT::FieldSet');
const FORM_CONTEXT = 'form';

const getSupportFields = (fields = []) => {
	let unsupportTypes = new Set();
	const supportedFields = fields.filter(field => {
		const support = isSupportedType(field.type);
		if (!support) unsupportTypes.add(field.type);
		return support;
	});

	if (unsupportTypes.size > 0) {
		const unsupportArr = Array.from(unsupportTypes);
		// eslint-disable-next-line no-console
		LOG.warn(
			`Type ${unsupportArr} ${
				unsupportArr.length > 1 ? 'are' : 'is'
			} not supported.`
		);
	}
	return supportedFields;
};

const computeFieldVisibility = fields =>
	fields.map(field => {
		const type = typeof field.show;
		if (type === 'function') field.skip = !field.show(fields);
		else if (type === 'boolean') field.skip = !field.show;
		return field;
	});

const fieldConverter = (field, autofocus) => {
	const autofocusProp = autofocus ? {autofocus: true} : {};
	switch (field.type) {
		case REFERENCE:
			return {
				...field,
				fieldname: field.name,
				...autofocusProp
			};
		default:
			return {...field, ...autofocusProp};
	}
};

const hookEventHandlers = (fields, state, updateState) => {
	return map(fields, f => {
		if (f.type === EMAIL) {
			f.onKeyUp = getkeyUpHandler(f.onKeyUp, state, updateState);
		}
		return f;
	});
};

const getkeyUpHandler = (keyUp, state, updateState) => {
	return event => {
		keyUp(event, state.properties.fields, updateState);
	};
};

const isSupportedType = type => {
	switch (type) {
		case CHOICE:
		case EMAIL:
			return true;
	}
	return false;
};

const getComponentAndProps = props => {
	const {id, field, type, onValueChange, onStagedValueChange} = props;
	const {choices, value, label, mandatory, name} = field;

	if (type === CHOICE)
		return {
			Component: 'sn-record-choice',
			props: {
				key: id,
				componentId: id,
				context: FORM_CONTEXT,
				fieldType: type,
				label,
				mandatory,
				name,
				value,
				choices,
				onValueChange,
				onStagedValueChange
			}
		};

	if (type === EMAIL) {
		const {onKeyUp, show, skip, invalid} = field;
		return {
			Component: 'sn-record-input-connected',
			props: {
				key: id,
				componentId: id,
				context: FORM_CONTEXT,
				declarativeActionsProps: {
					fieldName: name,
					label,
					name,
					value
				},
				fieldType: type,
				invalid,
				label,
				name,
				initialValue: value,
				mandatory,
				onKeyUp,
				onValueChange,
				onStagedValueChange,
				required: true,
				show,
				skip
			}
		};
	}

	return {};
};

const view = (state, {updateState}) => {
	const {
		properties: {
			instanceId,
			onValueChange,
			onStagedValueChange,
			shouldFocusOnOpen,
			fields
		}
	} = state;

	let changedFields = getSupportFields(fields);
	changedFields = computeFieldVisibility(changedFields);
	changedFields = hookEventHandlers(changedFields, state, updateState) || [];

	return (
		<div className="sn-form">
			{changedFields.map((f, index) => {
				const {type, skip, readOnly} = f;

				if (skip) return;

				const autofocus = shouldFocusOnOpen && !readOnly;
				const field = fieldConverter(f, autofocus);
				const id = instanceId + '_' + index;
				const {Component, props} = getComponentAndProps({
					id,
					type,
					field,
					onValueChange,
					onStagedValueChange
				});
				return (
					<div
						key={`sn-component-list-field-set-control-${index}`}
						className="sn-component-list-field-set-control">
						{!isUndefined(Component) ? <Component {...props} /> : null}
					</div>
				);
			})}
		</div>
	);
};

createCustomElement('sn-record-list-modal-export-field-set', {
	renderer: {
		type: snabbdom,
		view
	},
	properties: {
		fields: {default: []},
		shouldFocusOnOpen: {default: false},
		onValueChange: {default: () => {}},
		onStagedValueChange: {default: () => {}},
		instanceId: {default: 'sn-record-list-modal-export-field-set'}
	},
	styles
});
