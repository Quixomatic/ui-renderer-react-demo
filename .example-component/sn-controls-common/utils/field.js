import {
	camelCase,
	map,
	mapValues,
	range,
	isObject,
	isEmpty,
	find,
	pickBy,
	identity,
	omit,
	get
} from 'lodash';
import classNames from 'classnames';
import { t } from 'sn-translate';

export function getFieldDisplayValue(
	value,
	displayValue,
	placeholder,
	choices
) {
	if (displayValue) {
		return displayValue;
	} else if (value && choices) {
		let choice = find(choices, { value });
		if (choice && choice.displayValue) return choice.displayValue;
	} else if (!value && placeholder) {
		return placeholder;
	}

	return value || '';
}

export function isAttrTrue(val) {
	return val === true || val === 'true';
}

export function isAttrFalse(val) {
	return val === false || val === 'false';
}

export function castIfBoolean(val) {
	return val === 'true' ? true : val === 'false' ? false : val;
}

export function isEditable(props) {
	if (!isObject(props)) {
		return true;
	}

	return !isAttrTrue(props.readonly);
}

export function getSerializedChanges(props) {
	const { dependentField, dependentValue } = props;
	const serializedChanges = get(props, 'formData.serializedChanges');
	try {
		const changedFields = JSON.parse(serializedChanges);
		let changes = changedFields.reduce((changes, field) => {
			changes[field.name] = field.value;
			return changes;
		}, {});
		if (dependentField && dependentValue) {
			//Dont overwrite formData, it should take precedence over d-Field & d-Value
			changes[dependentField] = changes[dependentField]
				? changes[dependentField]
				: dependentValue;
		}
		return JSON.stringify(changes);
	} catch (e) {
		return '';
	}
}

export function getEncodedRecord(formData = {}) {
	return formData.isNewRecord ? formData.encodedRecord : '';
}

export function isClassicForm(formData = {}) {
	if (!formData.hasOwnProperty('classicForm')) return true;
	return formData.classicForm || false;
}

export function generateSubComponentIds(baseId, additionalFields) {
	return {
		parent: baseId,
		label: `${baseId}-label`,
		description: `${baseId}-description`,
		dropdown: `${baseId}-dropdown`,
		messages: `${baseId}-messages`,
		...mapValues(additionalFields, (size, fieldName) =>
			map(range(0, size), index => `${baseId}-${fieldName}-${index}`)
		)
	};
}

export function hasProp(prop) {
	return isAttrTrue(prop) ? true : undefined;
}

const getAriaAttr = props => attr => {
	const camelCased = camelCase(attr);

	const { configAria = {} } = props;

	return configAria[attr] || props[camelCased];
};

export function accessibilityAttributes(props) {
	if (!isObject(props)) {
		return {};
	}

	const ids = generateSubComponentIds(props.componentId);
	const defaultDescribedby = classNames({
		[ids.description]: props.description,
		[ids.messages]: !isEmpty(props.messages)
	});

	const resolveAriaAttr = getAriaAttr(props);

	const propAriaLabel = resolveAriaAttr('aria-label');
	const propAriaLabelledby = resolveAriaAttr('aria-labelledby');
	const propAriaDescribedby = resolveAriaAttr('aria-describedby');
	const propAriaDisabled = resolveAriaAttr('aria-disabled');
	const propAriaHidden = resolveAriaAttr('aria-hidden');
	const propAriaRequired = resolveAriaAttr('aria-required');
	const propAriaInvalid = resolveAriaAttr('aria-invalid');

	const restOfAriaProps = mapValues(
		omit(props.configAria, ['aria-label', 'aria-labelledby', 'aria-label']),
		(v, k) => resolveAriaAttr(k)
	);

	return pickBy(
		{
			'aria-labelledby': propAriaLabel ? null : propAriaLabelledby,
			'aria-describedby': propAriaDescribedby || defaultDescribedby,
			'aria-label': propAriaLabel,
			'aria-disabled':
				propAriaDisabled || isAttrTrue(props.disabled) ? 'true' : null,
			'aria-hidden': propAriaHidden || isAttrTrue(props.hide) ? 'true' : null,
			'aria-required':
				propAriaRequired || isAttrTrue(props.required) ? 'true' : null,
			'aria-invalid':
				propAriaInvalid || isAttrTrue(props.invalid) ? 'true' : null,
			...restOfAriaProps
		},
		identity
	);
}

export function isFieldEditableAndDependentFieldValueSet(
	readonly,
	dependentFieldValue,
	dependentFieldLabel
) {
	return (
		!isAttrTrue(readonly) &&
		isEmpty(dependentFieldValue) &&
		!isEmpty(dependentFieldLabel)
	);
}


export function getAriaLabelFromConfig(
	configAria,
	labelTemplate,
	...additionalTemplateValues
) {
	return configAria?.['aria-label']
		? {
				'aria-label': t.apply(null, [
					labelTemplate,
					configAria['aria-label'],
					...additionalTemplateValues
				])
		  }
		: {};
}
