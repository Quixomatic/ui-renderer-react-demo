import _ from 'lodash';
import { VariableType } from '../common';
import '../container-variable';
import '../variable';
import makeClass from 'classnames';

export default (fields, variablesLayout, formData, formProps) => column => {
	return (
		<div className="sc-section-form-column">
			{_.map(column.fields, fieldLayout => {
				let field = fields[fieldLayout.name];
				let layout = _.find(variablesLayout, { name: fieldLayout.name });
				if (!field) {
					return null;
				}
				if (
					fieldLayout.type !== VariableType.CONTAINER &&
					fieldLayout.type !== VariableType.CHECKBOX_CONTAINER
				) {
					// Do not want to pass parent object to all fields. So seeting invalid here only
					if (field.type === VariableType.CHECKBOX && !field.hideMandatory) {
						const isInvalid = (fields[field._parent] || {}).isInvalid;
						field = { ...field, isInvalid };
					}

					let sectionChildClassName = makeClass(
						'sc-section-form-column-child',
						{
							'sc-section-form-column-child-checkbox':
								field.type === VariableType.CHECKBOX && field.visible
						}
					);

					return (
						<div className={sectionChildClassName}>
							<sn-catalog-form-variable
								field={field}
								formData={formData}
								formProps={formProps}
							/>
						</div>
					);
				}
				return (
					<sn-catalog-form-container-variable
						layout={layout}
						parent={field._parent}
						columns={layout.columns}
						formData={formData}
						formProps={formProps}
						fields={fields}
						variablesLayout={variablesLayout}
					/>
				);
			})}
		</div>
	);
};
