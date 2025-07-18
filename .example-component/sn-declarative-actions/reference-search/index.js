import {createCustomElement} from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';

import actionHandlers from './actions';
import style from './view.scss';
import view from './view';

export const SNDeclarativeReferenceSearchElement = 'sn-declarative-reference-search';

createCustomElement(SNDeclarativeReferenceSearchElement, {
	renderer: {
		type: snabbdom,
		view
	},
	initialState: {
		active: true,
		fetchingTreePicker: true,
		componentLoading: true,
		treePickerConfig: {},
		selectedItems: {value: [], display_value_list: []}
	},
	properties: {
		fieldName: '',
		tableName: '',
		recordSysId: '',
		label: '',
		serializedChanges: '',
		encodedRecord: '',
		context: '',
		chars: '',
		componentId: '',
		referenceTable: '',
		ignoreDepAsRefQual: '',
		dictionary: {},
		dependentField: '',
		dependentValue: '',
		referenceQualifier: '',
		referenceKey: '',
		fieldType: ''
	},
	styles: style,
	actionHandlers
});
