import get from 'lodash/get';

import {
	IMPORT_MODAL_ACTIONS,
	IMPORT_MODAL_MESSAGES
} from '../../../../constants';
export const listImportPreviewSucceeded = coeffects => {
	const {action, updateState} = coeffects;
	const previewData = get(
		action,
		'payload.data.GlideListImport_Query.result',
		''
	);
	if (previewData) {
		updateState({
			path: 'previewData',
			value: previewData,
			operation: 'set'
		});
	}
};

export const listImportPreviewFailed = coeffects => {
	const {dispatch} = coeffects;
	dispatch(IMPORT_MODAL_ACTIONS.LIST_IMPORT_ADD_ERROR_NOTIFICATION, {
		message: IMPORT_MODAL_MESSAGES.PREVIEW_FAILURE_MSG
	});
};

export const getPreviewFeatureFlags = properties => {
	const previewFeatureFlags = {
		hideFilterPanel: true,
		hideHeader: true,
		hideLastRefreshedText: true,
		hideLinks: true,
		hideMultiEdit: true,
		hideDeclarativeActions: true,
		hidePagination: false,
		hideHighlightedValues: false,
		hidePanelAdvanced: true,
		hidePanelConditionDelete: true,
		hidePanelFooter: true,
		hidePanelRestore: true,
		hideRefreshButton: true,
		hideRowSelector: true,
		hideShiftRecordSelection: true,
		hideTitle: true,
		hideTitleRowCount: true,
		hideHighlightContent: true,
		hideViewAll: true,
		hideOptionToSaveAs: true,
		hideColumnResizing: false
	};
	return {
		...properties,
		...previewFeatureFlags
	};
};
