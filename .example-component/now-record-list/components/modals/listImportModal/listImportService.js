import {t} from 'sn-translate';

export const LIST_IMPORT_TYPE = 'LIST_IMPORT_TYPE';
export const LIST_IMPORT_CREATE_EXCEL = 'LIST_IMPORT_CREATE_EXCEL';
export const LIST_IMPORT_INCLUDE_FIELDS = 'LIST_IMPORT_INCLUDE_FIELDS';
export const LIST_IMPORT_EXCEL_FORMAT = 'LIST_IMPORT_EXCEL_FORMAT';
export const LIST_IMPORT_FILE_TITLE = t('Title');
export const importFields = {
	[LIST_IMPORT_TYPE]: {
		name: LIST_IMPORT_TYPE,
		value: 'insert',
		radioOptions: [
			{id: 'insert', label: t('Insert'), checked: true},
			{id: 'update', label: t('Update'), checked: false}
		]
	},
	[LIST_IMPORT_CREATE_EXCEL]: {
		name: LIST_IMPORT_CREATE_EXCEL,
		value: true
	},
	[LIST_IMPORT_INCLUDE_FIELDS]: {
		name: LIST_IMPORT_INCLUDE_FIELDS,
		value: true
	},
	[LIST_IMPORT_EXCEL_FORMAT]: {
		name: LIST_IMPORT_EXCEL_FORMAT,
		value: 'xlsx',
		dropDownOptions: [
			{id: 'xls', label: t('XLS')},
			{id: 'xlsx', label: t('XLSX')}
		]
	}
};
