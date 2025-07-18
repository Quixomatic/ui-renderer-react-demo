import {
	MODAL_SUBMIT_CLICKED,
	MODAL_CLOSED,
	MODAL_CLOSE_CLICKED
} from './constants';
import { t } from 'sn-translate';
import { UPDATE_MULTI_ROW_DATA } from '../multi-row-variable/constants';

const modalSubmitClicked = ({ dispatch, state, properties }) => {
	/* eslint-disable-line */
	console.log('Modal submit clicked'); /* eslint-disable-line */
	const { gForm, fields } = state;
	const {
		rowId,
		onModalCloseActionType,
		parentFields,
		variableSetName,
		rowData
	} = properties;
	let duplicateUniqueFields = getDuplicateUniqueFields(
		fields,
		parentFields,
		rowData,
		variableSetName,
		gForm
	);
	if (duplicateUniqueFields.length > 0) {
		let errMsg = t(
			'The following fields are not unique: {0}',
			duplicateUniqueFields.join(', ')
		);
		gForm.addErrorMessage(errMsg);
	} else {
		let isValid = gForm.submit();
		if (isValid) {
			const data = gForm.serialize();
			const formDirty = gForm.isUserModified();
			dispatch(UPDATE_MULTI_ROW_DATA, { rowId, data, formDirty });
			dispatch(onModalCloseActionType);
		}
	}
};

const getDuplicateUniqueFields = (
	fields,
	parentFields,
	rowData,
	variableSetName,
	gForm
) => {
	let duplicateUniqueFields = [];
	let uniqueColumnNames = {};
	let uniqueColumnData = {};
	let parentGridData = {};
	let currentVisibleCol = [];

	if (parentFields[variableSetName]['value']) {
		parentGridData = JSON.parse(parentFields[variableSetName]['value']);
	}

	if (parentFields[variableSetName]['fields']) {
		let currentData = parentFields[variableSetName]['fields'];
		for (let index in currentData) {
			currentVisibleCol.push(currentData[index]['name']);
		}
	}

	for (let field in fields) {
		if (fields[field]['unique'] && rowData) {
			let variableName = fields[field]['variable_name'];
			let currentColumnData = gForm.getValue(variableName);
			let existingColumnData = rowData[variableName];
			if (
				(!existingColumnData ||
					(currentColumnData &&
						currentColumnData.toLowerCase() !==
							existingColumnData.toLowerCase())) &&
				currentVisibleCol.includes(variableName)
			) {
				uniqueColumnNames[variableName] = fields[field]['label'];
				uniqueColumnData[variableName] = {};
			}
		}
	}

	//populate existing grid data into the uniqueColumnData to match later for uniqueness
	for (let col in parentGridData) {
		let row = parentGridData[col];
		if (row !== null && typeof row === 'object') {
			for (let uniqueColumnName in uniqueColumnNames) {
				let columnValue = row[uniqueColumnName];
				if (columnValue) {
					columnValue = columnValue.toLowerCase();
					if (!uniqueColumnData[uniqueColumnName][columnValue]) {
						uniqueColumnData[uniqueColumnName][columnValue] = true;
					}
				}
			}
		}
	}
	//now compare the current data with existing uniqueColumnData for any duplicates
	for (let uniqueColName in uniqueColumnNames) {
		let currentColData = gForm.getValue(uniqueColName);
		if (
			currentColData &&
			uniqueColumnData[uniqueColName][currentColData.toLowerCase()]
		) {
			//already the same data exists for this column
			duplicateUniqueFields.push(uniqueColumnNames[uniqueColName]);
		}
	}
	return duplicateUniqueFields;
};

const closeModalAction = ({ properties, dispatch }) => {
	let { onModalCloseActionType } = properties;
	dispatch(onModalCloseActionType);
};

export default {
	[MODAL_SUBMIT_CLICKED]: {
		effect: modalSubmitClicked
	},
	[MODAL_CLOSED]: {
		effect: closeModalAction
	},
	[MODAL_CLOSE_CLICKED]: {
		effect: closeModalAction
	}
};
