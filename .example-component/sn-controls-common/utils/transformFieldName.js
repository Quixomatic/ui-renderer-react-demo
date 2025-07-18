import { isEmpty } from 'lodash';

const checkIfFieldIsSelected = (value, path, selectedItems) => {
	let stagedPath = [];
	path.forEach(pathItem => {
		stagedPath.push(pathItem.field);
	});
	stagedPath.push(value);
	const updatedPath = stagedPath.join('.');
	return selectedItems.find(element => {
		if (element.id === updatedPath) {
			return true;
		}
	});
};

const getParentTableName = (parentPathArray, tableName, dataModel) => {
	let parentTableName = tableName;
	parentPathArray.forEach(item => {
		const tableData = dataModel.metadata[parentTableName];
		const fieldData = tableData && tableData[item];
		parentTableName = fieldData && fieldData.referenceDataKey;
	});
	return parentTableName;
};

/**
 * Transform field data into the structure needed for dot walk
 * @param {[{value: string, displayValue: string, isFieldReferenceType: boolean, referenceDataKey: string}]} fieldNameData
 * @return {{[field: string]: {displayValue: string, isReference: boolean, referenceDataKey: string}}} Transformed fieldNameData
 */
const transformFieldNameData = (
	fieldNameData,
	referenceTypes = '',
	allowDotWalking,
	selectedItems = [],
	path = ''
) => {
	// DictionaryAttributes - reference_types
	// list of valid reference types that are clickable separated by semicolons (";")
	const enabledTables = referenceTypes ? referenceTypes.split(';') : [];

	return fieldNameData.reduce((prev, curr) => {
		const {
			value: name,
			displayValue,
			isFieldReferenceType: isReference,
			referenceDataKey
		} = curr;

		const reducedValue = {
			...prev,
			[name]: {
				displayValue,
				disabled: isEmpty(selectedItems)
					? enabledTables.length && allowDotWalking
						? !enabledTables.includes(referenceDataKey)
						: false
					: checkIfFieldIsSelected(name, path, selectedItems)
					? true
					: false,
				isReference: allowDotWalking ? isReference : false,
				referenceDataKey
			}
		};
		if (enabledTables.length && allowDotWalking) {
			if (referenceDataKey || isReference) {
				return reducedValue;
			} else {
				return prev;
			}
		}
		return reducedValue;
	}, {});
};

/**
 * Transform path data into the structure needed for dot walk
 * @param  {{[field: string]: {displayValue: string, isReference: boolean, referenceDataKey: string}}} metaData
 * @param  {string} parentTableName
 * @param  {string} pathValue
 * @return {[{displayValue: string, field: string, parent: string}]} Transformed pathData
 */
const transformPathData = (metadata, tableName, pathValue) => {
	let path = [];

	if (metadata && !tableName) {
		tableName = Object.keys(metadata)[0];
	}

	if (pathValue && metadata) {
		//field List can have multiple
		const pathValueList = pathValue.split(',');
		path = pathValueList[0].split('.').reduce((prev, curr, idx) => {
			const tableNameCurrent =
				idx > 0 && prev[idx - 1].parentTableName
					? prev[idx - 1].parentTableName
					: tableName;
			const tableData = metadata[tableNameCurrent];
			if (!tableData) {
				return prev;
			}
			const fieldData = metadata[tableNameCurrent][curr];
			if (!fieldData) {
				return prev;
			}
			const reducedFieldData = [
				...prev,
				{
					displayValue: fieldData.displayValue,
					field: curr,
					parent: tableNameCurrent,
					parentTableName: fieldData.referenceDataKey
				}
			];
			return reducedFieldData;
		}, []);
	} else if (metadata) {
		const tableData = metadata[tableName];

		if (tableData) {
			const firstField = Object.keys(tableData)[0];
			const fieldData = tableData[firstField];
			path = [
				{
					displayValue: fieldData.displayValue,
					field: firstField,
					parent: tableName
				}
			];
		}
	}
	return path;
};

/**
 * Transform table metadata into the structure used in the Dot Walk Model
 * @param {[{tableName: string, fieldNameData: [{value: string, displayValue: string, isFieldReferenceType: boolean, referenceDataKey: string}] }]} fieldNameMetadata
 * @return {{[tableName: string]: {[field: string]: {displayValue: string, isReference: boolean, referenceDataKey: string}}} Transformed fieldNameMetadata
 */

export const transformFieldNameMetadata = (
	fieldValues,
	referenceTypes = '',
	allowDotWalking,
	selectedItems = [],
	path = []
) =>
	fieldValues.reduce((prev, curr) => {
		const reducedValue = {
			...prev,
			[curr.tableName]: transformFieldNameData(
				curr.fieldNameData,
				referenceTypes,
				allowDotWalking,
				selectedItems,
				path
			)
		};
		return reducedValue;
	}, {});

export const constructDataModel = (
	fieldValues,
	tableName,
	pathValue,
	leafPathSource,
	referenceTypes = '',
	allowDotWalking
) => {
	const model = {
		path: null,
		metadata: null,
		leafPathSource
	};

	if (fieldValues) {
		const transformedMetadata = transformFieldNameMetadata(
			fieldValues,
			referenceTypes,
			allowDotWalking
		);
		const transformedPath = transformPathData(
			transformedMetadata,
			tableName,
			pathValue
		);
		model.path = transformedPath;
		model.metadata = transformedMetadata;
	}

	return model;
};

export const getFieldNameValue = (path = []) =>
	path.map(p => p.field).join('.');

export const getFieldNameDisplayValue = (path = []) =>
	path.map(p => p.displayValue).join(' > ');

export const getDataModelWithToggledFields = (
	dataModel,
	flag,
	fieldToBeDeleted,
	tableName
) => {
	const path = dataModel.path;
	let name = dataModel.path[path.length - 1].parent;
	let fieldName = dataModel.path[path.length - 1].field;
	if (flag) {
		const updatedIdArray = fieldToBeDeleted.split('.');
		fieldName = updatedIdArray[updatedIdArray.length - 1];
		name =
			updatedIdArray.length === 1
				? tableName
				: getParentTableName(
						updatedIdArray.slice(0, updatedIdArray.length - 1),
						tableName,
						dataModel
				  );
	}
	let dataModelToUpdate = dataModel;
	//update only if the table info is available in dataModel
	if (dataModel.metadata[name]) {
		dataModelToUpdate = {
			...dataModel,
			metadata: {
				...dataModel.metadata,
				[name]: {
					...dataModel.metadata[name],
					[fieldName]: {
						...dataModel.metadata[name][fieldName],
						disabled: !flag
					}
				}
			}
		};
	}

	return dataModelToUpdate;
};
