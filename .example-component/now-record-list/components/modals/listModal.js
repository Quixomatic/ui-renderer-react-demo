import './listAdvancedViewModal';
import './listCascadeDeleteModal';
import './listDeleteModal';
import './listEditModal';
import './listExportModal';
import './listImportModal';
import './listRenameModal';
import './listSaveAsModal';
import './tagsEditModal';
import {createCustomElement} from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';

import {MODAL_TYPES} from '../../constants';

const view = state => {
	const {modalProps} = state.properties;

	switch (modalProps.type) {
		case MODAL_TYPES.RENAME_LIST:
			return <sn-record-list-modal-rename {...modalProps} />;
		case MODAL_TYPES.SAVE_AS:
			return <sn-record-list-modal-save-as {...modalProps} />;
		case MODAL_TYPES.EDIT:
			return <sn-record-list-modal-edit {...modalProps} />;
		case MODAL_TYPES.ADVANCED_VIEW:
			return <sn-record-list-modal-advanced-view {...modalProps} />;
		case MODAL_TYPES.EXPORT:
			return <sn-record-list-modal-export {...modalProps} />;
		case MODAL_TYPES.DELETE_LIST:
			return <sn-record-list-modal-delete-list {...modalProps} />;
		case MODAL_TYPES.CASCADE_DELETE:
			return <sn-record-list-modal-cascade-delete {...modalProps} />;
		case MODAL_TYPES.IMPORT:
			return <sn-record-list-modal-import {...modalProps} />;
		case MODAL_TYPES.EDIT_TAG:
			return <sn-record-list-modal-edit-tag {...modalProps} />;
		default:
			return null;
	}
};

createCustomElement('sn-record-list-modal', {
	renderer: {
		type: snabbdom,
		view
	},
	properties: {
		modalProps: {}
	}
});
