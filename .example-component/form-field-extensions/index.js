import _ from 'lodash';

function populateChildrenInfo(fields, variablesLayout) {
	for (let layoutItem of variablesLayout) {
		if (
			layoutItem.type === 'container' ||
			layoutItem.type === 'checkbox_container'
		) {
			let children = [];
			for (let column of layoutItem.columns) {
				for (let field of column.fields) {
					children.push(field.name);
				}
			}
			fields[layoutItem.name]._children = children;
			if (
				layoutItem.type === 'checkbox_container' &&
				layoutItem.captionDisplay
			) {
				fields[layoutItem.name].mandatory = children.some(
					vname => fields[vname].mandatory
				);
			}
		}
	}
}

function populateParentInfo(fields, variablesLayout) {
	for (let layoutItem of variablesLayout) {
		if (
			layoutItem.type == 'container' ||
			layoutItem.type === 'checkbox_container'
		) {
			let children = fields[layoutItem.name]._children;
			for (let child of children) {
				fields[child]._parent = layoutItem.name;
				if (layoutItem.type === 'checkbox_container') {
					fields[child].hideMandatory = !!layoutItem.captionDisplay;
				}
			}
		} else {
			fields[layoutItem.name]._parent = '';
		}
	}
}
const buildValue = rowData => prop => {
	const valueJson = _.reduce(
		rowData,
		(acc, row) => {
			acc.push(
				_.reduce(
					row.row,
					(rowDetails, colDetails) => {
						rowDetails[colDetails.name] = colDetails[prop];
						return rowDetails;
					},
					{}
				)
			);
			return acc;
		},
		[]
	);
	if (valueJson.length === 0) {
		return '';
	}
	return JSON.stringify(valueJson);
};

function setMultiRowVariableProperties(fields) {
	_.map(fields, field => {
		if (field.type === 'container' && field.containerType === 'one_to_many') {
			field.value = buildValue(field.rowData)('value');
			field.displayValue = buildValue(field.rowData)('displayValue');
			field.mandatory = false;
		}
	});
}

export const massageVariableFields = (fields, variablesLayout) => {
	const fieldMap = _.reduce(
		fields,
		(acc, field) => {
			return {
				...acc,
				[field.name]: field
			};
		},
		{}
	);
	populateChildrenInfo(fieldMap, variablesLayout);
	populateParentInfo(fieldMap, variablesLayout);
	setMultiRowVariableProperties(fields);
	return fields;
};
