import { map } from 'lodash/fp';
import '../container-variable';
import '../variable-section';
import '../multi-row-variable';
import { default as createColumnWithContext } from './columnFactory';
import { VariableType } from '../common';

const mapWithIndex = map.convert({ cap: false });

export const renderSectionFactory = (
	fields,
	variablesLayout,
	formData,
	formProps
) => section => {
	if (section.type === 'multi_row_container') {
		const field = fields[section.name];
		return (
			<sn-catalog-form-multi-row-variable
				field={field}
				parentFields={fields}
				sourceTable={formData.tableName}
				sourceId={formData.sysId}
				parent={section.parent}
			/>
		);
	}
	if (
		section.type != VariableType.CONTAINER &&
		section.type != VariableType.CHECKBOX_CONTAINER
	) {
		let columnRenderer = createColumnWithContext(
			fields,
			variablesLayout,
			formData,
			formProps
		);
		return (
			<sn-catalog-form-variable-section>
				{mapWithIndex(column => {
					return columnRenderer(column);
				}, section.columns)}
			</sn-catalog-form-variable-section>
		);
	}
	if (section.parent !== '') {
		return;
	}
	return (
		<sn-catalog-form-container-variable
			layout={section}
			parent={section.parent}
			formData={formData}
			formProps={formProps}
			columns={section.columns}
			fields={fields}
			variablesLayout={variablesLayout}
		/>
	);
};

const createDefaultSection = fields => {
	return {
		layout: 'normal',
		name: '',
		caption: '',
		captionDisplay: '',
		parent: '',
		type: 'default',
		columns: [{ fields }]
	};
};

export const createSections = variablesLayout => {
	let sections = [];
	let section = [];
	for (let i = 0; i < variablesLayout.length; i++) {
		let variable = variablesLayout[i];
		if (variable.type === 'multi_row_container') {
			if (section.length > 0) {
				sections.push(createDefaultSection(section));
				section = [];
			}
			sections.push(variable);
			continue;
		}
		if (variable.type != 'container' && variable.type != 'checkbox_container') {
			section.push(variable);
			continue;
		}
		if (section.length > 0) {
			sections.push(createDefaultSection(section)); //Create a new section for all variables so far
			section = [];
		}
		sections.push(variable); //Create a section for the container
	}
	if (section.length > 0) {
		sections.push(createDefaultSection(section));
	} //Create a new section for the remaining varaibles
	return sections;
};
