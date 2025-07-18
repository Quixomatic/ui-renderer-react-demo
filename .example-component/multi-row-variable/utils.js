import _ from 'lodash';
export function buildColumnsNameIdMap(fields) {
	return _.reduce(
		fields,
		(acc, field) => {
			return {
				...acc,
				[field.name]: field.id
			};
		},
		{}
	);
}

export const buildValueFromRowData = rowData => prop => {
	const valueJson = [];
	for (const rowDetails of rowData) {
		const rowValue = {};
		for (const colDetails of rowDetails.row) {
			rowValue[colDetails.name] = colDetails[prop];
		}
		valueJson.push(rowValue);
	}
	if (valueJson.length === 0) {
		return '';
	}
	return JSON.stringify(valueJson);
};

export const parseRowData = (fields = [], value = '', displayValue = '') => {
	if (_.isEmpty(value)) {
		value = '[]';
	}
	if (_.isEmpty(displayValue)) {
		displayValue = '[]';
	}
	const valueJson = JSON.parse(value);
	const displayValueJson = JSON.parse(displayValue);
	const rowData = [];
	for (let i = 0; i < valueJson.length; i++) {
		let rowObj = { row: [] };
		const rowDisplayValue = displayValueJson[i] || {};
		for (const colField of fields) {
			const val = valueJson[i][colField.name];
			const dispVal = rowDisplayValue[colField.name] || val;
			rowObj.row.push({
				name: colField.name,
				value: val,
				displayValue: dispVal,
				id: colField.id
			});
		}
		rowData.push(rowObj);
	}
	return rowData;
};
