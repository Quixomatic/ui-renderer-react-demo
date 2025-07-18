import _ from 'lodash';
import { createVariableFieldFactory, getMappedFieldName } from '../utils';
import {
	sendMultRowWidgetRequest,
	fetchDataLookupsForMultiRow
} from './requestHelpers';
import { CatalogFormData } from '../CatalogFormData';
import { snHttpFactory } from 'sn-http-request';
import { getGCKFromGlobal } from '../utils';

const DATA_LOOKUP_FIELD = 'data_lookups';

const createRequestBody = data => ({
	action: data.action || 'add',
	variable_set_id: data.variableSetId,
	source_id: data.sourceId,
	source_table: data.sourceTable,
	row_data: data.rowData,
	workspace_form: true
});

function parseMultiRowWidgetResponse(
	variableSetId,
	sourceTable,
	sourceId,
	data
) {
	let {
		client_script,
		_sections,
		_view,
		validation_scripts,
		ui_scripts,
		_fields,
		policy
	} = _.pick(data, [
		'client_script',
		'_sections',
		'_view',
		'validation_scripts',
		'ui_scripts',
		'_fields',
		'policy'
	]);

	let variableFields = createVariableFieldFactory(
		variableSetId,
		sourceTable,
		sourceId
	)(_fields);

	const fm = {
		_fields: variableFields,
		_view,
		_sections
	};
	getFieldsFromView(fm);
	return {
		fields: variableFields,
		variablesLayout: _sections,
		ui_policy: policy,
		client_scripts: client_script,
		ui_scripts,
		validation_scripts
	};
}

function getFieldsFromView(fm) {
	var fields = [],
		field;
	if (typeof fm._view !== 'undefined') {
		for (var f in fm._view) {
			field = fm._view[f];
			if (fm._fields[getMappedFieldName(field.name)]) {
				fields.push(fm._fields[getMappedFieldName(field.name)]);
			}
			getNestedVariables(fm, fields, field);
		}
	} else if (typeof fm._sections !== 'undefined') {
		getNestedFields(fm, fields, fm._sections);
	}
	return fields;
}

function getNestedVariables(fm, fields, viewField) {
	if (typeof viewField.variables !== 'undefined') {
		var fieldModel = fm._fields[getMappedFieldName(viewField.name)];
		//viewField could just be a wrapper of variables
		if (fieldModel) {
			fieldModel._children = [];
		}
		for (var v in viewField.variables) {
			var variable = viewField.variables[v];
			if (fm._fields[getMappedFieldName(variable.name)]) {
				var child = fm._fields[getMappedFieldName(variable.name)];
				if (fieldModel) {
					fieldModel._children.push(getMappedFieldName(variable.name));
					child._parent = getMappedFieldName(viewField.name);
				}
				fields.push(child);
			}
			getNestedVariables(fm, fields, variable);
		}
	}
}

function getNestedFields(fm, fields, containers) {
	if (!containers) {
		return;
	}

	for (var _container in containers) {
		var container = containers[_container];
		if (container.columns) {
			for (var _col in container.columns) {
				var col = container.columns[_col];
				for (var _field in col.fields) {
					var field = col.fields[_field];
					if (field.type == 'container') {
						getNestedFields(fm, fields, [field]);
					} else if (field.type == 'checkbox_container') {
						getNestedFields(fm, fields, field.containers);
					} else if (field.type == 'field') {
						fields.push(fm._fields[getMappedFieldName(field.name)]);
					}
				}
			}
		}
	}
}

function parseCatalogDataLookUpResponse(lookupData, fields) {
	var result = {};
	_.forEach(fields, field => {
		result[field.name] = lookupData[field.variable_id];
	});
	return result;
}
export function* initializeFormData(metaData, options = {}) {
	let { httpClient, headers } = options;
	let { sourceId, sourceTable } = metaData;
	const requestBody = createRequestBody(metaData);
	const parentFields = _.cloneDeep(metaData.parentFields);
	if (typeof httpClient == 'undefined') {
		httpClient = snHttpFactory({
			xsrfToken: getGCKFromGlobal(),
			batching: false
		});
	}

	const [multiRowData, dataLookupsData] = yield Promise.all([
		sendMultRowWidgetRequest(httpClient, { headers, data: requestBody }),
		fetchDataLookupsForMultiRow(httpClient, requestBody.variable_set_id)
	]);

	let { variable_set_id } = requestBody;
	const formViewData = parseMultiRowWidgetResponse(
		variable_set_id,
		sourceTable,
		sourceId,
		multiRowData
	);
	formViewData[DATA_LOOKUP_FIELD] = parseCatalogDataLookUpResponse(
		dataLookupsData,
		formViewData['fields']
	);

	return new CatalogFormData(
		sourceTable,
		sourceId,
		parentFields,
		variable_set_id,
		formViewData['fields'],
		formViewData['variablesLayout'],
		formViewData['ui_policy'],
		formViewData['client_scripts'],
		formViewData['ui_scripts'],
		formViewData['validation_scripts'],
		formViewData[DATA_LOOKUP_FIELD]
	);
}
