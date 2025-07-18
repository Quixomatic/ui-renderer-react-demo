import { reduce } from 'lodash/fp';
import _ from 'lodash';
import { map } from 'lodash';
import {
	CHECKBOX_CONTAINER,
	CHOICE,
	GLIDE_LIST
} from '../common/scVariableFieldTypes';

export function getMappedFieldName(fieldName) {
	if (fieldName.indexOf('variables.') !== 0) {
		return `variables.${fieldName}`;
	}
	return fieldName;
}

/**
 * field object from backend
 * @param {*} variableFields
 */
export const createVariableFieldFactory = (
	variableSetId,
	sourceTable,
	sourceId
) => variableFields => {
	let fields = reduce(
		(acc, field) => {
			let fieldName = getMappedFieldName(field.name);
			let referringRecordId = sourceId;
			if (variableSetId) {
				referringRecordId = referringRecordId + '$' + variableSetId;
			}
			let variableField = {
				id: field.sys_id,
				displayValue: field.displayValue,
				name: fieldName,
				label: field.label,
				canWrite: field.canWrite,
				isMandatory: field.mandatory,
				sys_readonly: field.sys_readonly,
				variable_name: field.name,
				_cat_variable: true,
				type: field.type,
				variable_id: field.variable_name,
				value: field.value,
				oldValue: field.value,
				readonly: field.readonly,
				mandatory: field.mandatory,
				visible: field.visible,
				unique: field.unique,
				referringTable: sourceTable,
				referringRecordId: referringRecordId,
				parent: variableSetId,
				maxLength: field.max_length,
				helpText: field.help_text,
				instructions: field.instructions,
				maxUnit: _.get(field, 'attributes.max_unit', 'days')
			};
			variableField.showFieldHint = true;
			variableField.showHelp =
				field.instructions || field.help_text ? true : false;
			augmentFieldByType(variableField, field);
			return {
				...acc,
				[fieldName]: variableField
			};
		},
		{},
		variableFields
	);
	fields[`variables.${variableSetId}`] = {
		name: `variables.${variableSetId}`,
		variable_id: variableSetId,
		variable_name: `variables.${variableSetId}`,
		label: '',
		caption: '',
		type: 'container',
		parent: '',
		_cat_variable: true
	};
	return fields;
};

function augmentFieldByType(variableField, field) {
	switch (field.type) {
		case 'choice':
		case 'multiple_choice':
		case 'numericscale':
			variableField.choices = map(field.choices || [], choice => ({
				displayValue: choice.label,
				value: choice.value
			}));
			variableField.type = CHOICE;
			((field.attributes || '').split(',') || []).forEach(attr => {
				/*
				Since we have the support for only one dependent field, fetching only the first variable from ref_qual_elements.
				*/
				if (attr.startsWith('ref_qual_elements=')) {
					variableField.dependentField =
						'variables.' + attr.split('=')[1].split(';')[0];
				}
			});
			break;
		case 'multichoice':
			variableField.choices = map(field.choices || [], choice => ({
				displayValue: choice.label,
				value: choice.value
			}));
			variableField.type = GLIDE_LIST;
			break;
		case 'reference': {
			let attrsObj = ((field.attributes || '').split(',') || []).reduce(
				(attrs, attr) => {
					let [key, value = ''] = (attr || '').split('=') || [];
					return !_.isEmpty(key) ? { ...attrs, [key]: value } : attrs;
				},
				{}
			);
			variableField.reference = field.ed.reference;
			variableField.referenceQual = field.ed.qualifier;
			variableField.refAcOrderBy = _.get(attrsObj, 'ref_ac_order_by', '');
			break;
		}
		case 'masked':
			variableField.useConfirmation = field.useConfirmation;
			variableField.canDecrypt = field.catalog_view_masked;
			variableField.confirmationValue = field.value;
			break;
		case 'string':
			variableField.regExp = _.get(field, 'validate_regex', false)
				? true
				: false;
			break;
		case 'checkbox_container':
			variableField.containerType = field.type;
			variableField.type = 'container';
			break;
		case 'glide_list':
			variableField.display_value_list = field.display_value_list;
			variableField.reference = field.ed.reference;
			variableField.referenceQual = field.ed.qualifier;
			break;
		case 'boolean':
			variableField.showHelp = false;
			variableField.dictionary = {
				...variableField.dictionary,
				fieldHint: ''
			};
			break;
	}
}

export function setUpParentChildRelationships(fields) {
	return fields;
}

export function getGCKFromGlobal() {
	return window.g_ck;
}

export function getFormEnvironmentGlobals() {
	return {
		glideFormEnvironmentFactory: window['glideFormEnvironmentFactory'],
		glideFormFactory: window['glideFormFactory'],
		glideAjax: window['GlideAjax'],
		glideModalFactory: window['glideModalFactory'],
		glideUser: window['GlideUser'],
		uiScriptFactory: window['uiScriptFactory']
	};
}

/**
 * Set layoutItem's fieldName as `variables.`
 */
export function transformVariablesLayout(varSetId, layout) {
	let layoutItem = layout[0];
	layoutItem.name = varSetId;
	layoutItem.parent = '';
	for (let column of layoutItem.columns) {
		let fields = [];
		for (let field of column.fields) {
			if (field.type === CHECKBOX_CONTAINER) {
				fields = fields.concat(
					(field.variables || []).map(f => {
						return {
							...f,
							name: getMappedFieldName(f.name)
						};
					})
				);
			} else {
				field.name = getMappedFieldName(field.name);
				fields.push(field);
			}
		}
		column.fields = fields;
	}
	return layout;
}

function transformClientScript(script) {
	return {
		...script,
		fieldName: 'variables.' + script.fieldName
	};
}

export function transformClientScripts(clientScripts) {
	let transformedScripts = {};
	transformedScripts['onChange'] = map(
		clientScripts['onChange'],
		transformClientScript
	);
	transformedScripts['onLoad'] = map(
		clientScripts['onLoad'],
		transformClientScript
	);
	transformedScripts['onSubmit'] = map(
		clientScripts['onSubmit'],
		transformClientScript
	);
	return {
		...clientScripts,
		...transformedScripts
	};
}

const transformUIPolicyActions = fieldIdNameMap => action => {
	return {
		...action,
		name: fieldIdNameMap[action.name]
	};
};

const transformUIPolicyCondition = fieldIdNameMap => condition => {
	return {
		...condition,
		field: fieldIdNameMap[condition.field]
	};
};

export function transformUIPolcies(fields, uiPolicies) {
	//return uiPolicies;
	const fieldIdNameMap = reduce(
		(acc, field) => {
			return {
				...acc,
				[field.variable_id]: field.name
			};
		},
		{},
		fields
	);
	return map(uiPolicies, policy => {
		return {
			...policy,
			actions: map(policy.actions, transformUIPolicyActions(fieldIdNameMap)),
			condition_fields: map(
				policy.condition_fields,
				fieldName => fieldIdNameMap[fieldName]
			),
			conditions: map(
				policy.conditions,
				transformUIPolicyCondition(fieldIdNameMap)
			)
		};
	});
}

export function transformValidationScripts(scripts) {
	return map(scripts, script => {
		script.fields = map(script.fields, field => getMappedFieldName(field));
		return script;
	});
}
