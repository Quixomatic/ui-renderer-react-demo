import createComponentLoaderEffect from '@devsnc/uxf-effect-component-loader';
import {actionTypes} from '@servicenow/ui-core';
import {createGraphQLEffect} from '@servicenow/ui-effect-graphql';
import {t} from 'sn-translate';

import {
	IMPORT_MODAL_ACTIONS,
	IMPORT_MODAL_MESSAGES
} from '../../../../constants';
import {listPreviewQuery} from '../schemas';

import {
	listImportPreviewFailed,
	listImportPreviewSucceeded
} from './previewUtils';

const {COMPONENT_RENDERED, COMPONENT_BOOTSTRAPPED} = actionTypes;

export default {
	[COMPONENT_BOOTSTRAPPED]: {
		effect({dispatch, state}) {
			const {
				properties: {importSetId}
			} = state;
			if (importSetId) {
				dispatch(IMPORT_MODAL_ACTIONS.LIST_IMPORT_PREVIEW_REQUESTED, {
					importSetId
				});
			} else {
				dispatch(
					IMPORT_MODAL_ACTIONS.LIST_IMPORT_ADD_ERROR_NOTIFICATION,
					IMPORT_MODAL_MESSAGES.INVALID_IMPORT_SET_ID_MSG
				);
			}
		}
	},
	[IMPORT_MODAL_ACTIONS.LIST_IMPORT_PREVIEW_REQUESTED]: createGraphQLEffect(
		listPreviewQuery,
		{
			variableList: ['importSetId'],
			successActionType: IMPORT_MODAL_ACTIONS.LIST_IMPORT_PREVIEW_SUCCEEDED,
			errorActionType: IMPORT_MODAL_ACTIONS.LIST_IMPORT_PREVIEW_FAILED
		}
	),
	[IMPORT_MODAL_ACTIONS.LIST_IMPORT_PREVIEW_SUCCEEDED]: {
		effect: listImportPreviewSucceeded,
		stopPropagation: true
	},
	[IMPORT_MODAL_ACTIONS.LIST_IMPORT_PREVIEW_FAILED]: {
		effect: listImportPreviewFailed,
		stopPropagation: true
	},
	[COMPONENT_RENDERED]: {
		effect({dispatch}) {
			dispatch(IMPORT_MODAL_ACTIONS.COMPONENT_LOAD_REQUESTED, {
				tagName: 'now-record-list-connected'
			});
		},
		stopPropagation: true
	},
	[IMPORT_MODAL_ACTIONS.COMPONENT_LOAD_REQUESTED]: createComponentLoaderEffect({
		successActionType: IMPORT_MODAL_ACTIONS.COMPONENT_LOAD_COMPLETED,
		errorActionType: IMPORT_MODAL_ACTIONS.COMPONENT_LOAD_FAILED
	}),
	[IMPORT_MODAL_ACTIONS.COMPONENT_LOAD_COMPLETED]: {
		effect: ({updateState, dispatch, state}) => {
			updateState({
				componentLoaded: true
			});
			const {
				previewData: {numErrorRows}
			} = state;
			if (numErrorRows) {
				const message = t(
					'{0} row(s) with errors in import set!',
					numErrorRows
				);
				dispatch(IMPORT_MODAL_ACTIONS.LIST_IMPORT_ADD_ERROR_NOTIFICATION, {
					message
				});
			}
		},
		stopPropagation: true
	},
	[IMPORT_MODAL_ACTIONS.COMPONENT_LOAD_FAILED]: {
		effect: ({updateState}) => {
			updateState({
				componentLoaded: false
			});
		},
		stopPropagation: true
	}
};
