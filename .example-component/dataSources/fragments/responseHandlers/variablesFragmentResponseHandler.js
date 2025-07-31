import {
	VARIABLES_VALUES_CHANNEL,
	VARIABLES_VALUES_CHANNEL_VARIABLE_VALUES_PROVIDER,
	VARIABLES_LAYOUT_CHANNEL,
	VARIABLES_LAYOUT_CHANNEL_VARIABLES_LAYOUT_PROVIDER,
} from '../channelConstants';
import _ from 'lodash';
import * as formViewDataConstants from '../../../tf-library-catalog-form/src/environment/formViewDataConstants';
import { massageVariableFields } from '../../../tf-library-catalog-form/src/formFieldExtensions';
import { convertToMap } from '../fragmentUtils';
export const variablesFragmentResponseHandler = async (response = [], channelService = {}) => {
	if (!Array.isArray(response)) {
		response = [];
	}
	let variables = [...response] || [];
	const variableValuesProvider = channelService.listen(VARIABLES_VALUES_CHANNEL);
	const variableValuesMap = await variableValuesProvider(VARIABLES_VALUES_CHANNEL_VARIABLE_VALUES_PROVIDER);
	try {
		variables = _.map(variables, (fieldElement) => {
			const { name } = fieldElement;
			if (variables[name]) {
				// eslint-disable-next-line no-console
				console.warn('Already defined field ! ');
				return;
			}
			// variables attributes are key value pairs separated by comma. ex: max_length=5,max_units=hours
			const attributes = _.get(fieldElement, 'variableAttributes', '')
				.split(',')
				.reduce((acc, attr) => {
					const parts = attr.split('=', 2);
					if (parts.length > 0) {
						const value = parts.length === 2 ? parts[1] : '';
						acc[_.camelCase(parts[0])] = value;
					}
					return acc;
				}, {});

			const id = _.get(fieldElement, 'id', '');
			const canWrite = _.get(fieldElement, 'canWrite', true);
			const canCreate = _.get(fieldElement, 'canCreate', true);
			const canRead = _.get(fieldElement, 'canRead', true);
			const readonly = _.get(fieldElement, 'readOnly', false);
			const hidden = !_.get(fieldElement, 'visible', true);
			const mandatory = _.get(fieldElement, 'mandatory', false);
			const field = _.assign(
				{},
				fieldElement,
				{
					canWrite: canWrite,
					sys_readonly: !canCreate, //TODO: Flow today is just requestor, so checking only for canCreate
					readonly: readonly || !canCreate,
					visible: !hidden && canRead,
					mandatory: mandatory,
					variable_name: fieldElement.variableName,
					_cat_variable: true /*Need this for gForm Operation*/,
					is_variable: true /*Need this for Save Operation*/,
					maxLength: attributes.maxLength,
					maxUnit: attributes.maxUnit,
					variable_id: 'IO:' + id,
				},
				variableValuesMap[name]
			);
			if (field.type === 'masked') {
				field.confirmationValue = field.value;
			}
			if (field.type === 'container' && hidden) {
				field._cascade_hidden = true;
			}
			return field;
		});
	} catch (exception) {
		// eslint-disable-next-line no-console
		console.log('Error while processing catalog elements', exception);
	}

	const variablesLayoutProvider = channelService.listen(VARIABLES_LAYOUT_CHANNEL);
	const variablesLayout = await variablesLayoutProvider(VARIABLES_LAYOUT_CHANNEL_VARIABLES_LAYOUT_PROVIDER);
	const massagedFields = massageVariableFields(variables, variablesLayout);
	return {
		formData: {
			[formViewDataConstants.FIELDS]: convertToMap(massagedFields, 'name'),
		},
	};
};
