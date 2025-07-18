import '@servicenow/now-modal';
import {createCustomElement} from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';

import {IMPORT_MODAL, STEPPER_ITEMS} from '../../constants';

import {default as importActions} from './listImportModal/actions';
import {
	LIST_IMPORT_EXCEL_FORMAT,
	LIST_IMPORT_TYPE,
	importFields
} from './listImportModal/listImportService';
import {
	getFooterActions,
	getImportModalContent,
	getImportModalTitle,
	getModalSize
} from './listImportModal/listImportUtils';
import {default as progressActions} from './listImportModal/progressActions';
import styles from './styles.scss';

const view = (state, {dispatch}) => {
	const {
		properties: {componentId},
		currentStep
	} = state;
	const footerActions = getFooterActions(state);
	const modalTitle = getImportModalTitle(state);
	return (
		<now-modal
			component-name={componentId + '-embedded-modal'}
			size={getModalSize(currentStep)}
			header-label={modalTitle}
			footer-actions={footerActions}
			manage-opened
			opened={true}>
			{getImportModalContent(state, dispatch)}
		</now-modal>
	);
};

createCustomElement('sn-record-list-modal-import', {
	renderer: {
		type: snabbdom,
		view
	},
	initialState: {
		currentStep: 1,
		fields: importFields,
		stepperItems: STEPPER_ITEMS,
		insertUpdateRadioOptions: importFields[LIST_IMPORT_TYPE].radioOptions,
		showBrowse: true,
		uploadFile: {
			file: '',
			progress: false,
			uploadSuccess: true,
			progressValue: IMPORT_MODAL.DEFAULT_PROGRESS_VALUE,
			progressPath: 'positive'
		},
		trackerResults: {
			status: '0',
			percent: 0
		},
		notifications: {default: []},
		showProgress: false,
		dropDownOptions: importFields[LIST_IMPORT_EXCEL_FORMAT].dropDownOptions,
		showLoader: false,
		importSetId: '',
		previewLoader: false
	},
	properties: {
		columns: {},
		componentId: {default: 'sn-record-list-modal-import'},
		query: {},
		recordCount: {},
		shouldFocusOnOpen: {default: false},
		table: {},
		view: {},
		listImport: {default: {}},
		workspaceConfigId: {}
	},
	styles,
	actionHandlers: {...importActions, ...progressActions}
});
