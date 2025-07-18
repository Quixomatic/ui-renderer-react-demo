import '@servicenow/now-loader';
import '@servicenow/now-modal';
import {createCustomElement} from '@servicenow/ui-core';
import {actionTypes} from '@servicenow/ui-core';
import {Fragment} from '@servicenow/ui-renderer-snabbdom';
import snabbdom from '@servicenow/ui-renderer-snabbdom';
import get from 'lodash/get';
import {t} from 'sn-translate';
import {getProperty} from 'sn-uxpage-presource';

import {
	CASCADE_DELETE_GRAPHQL_EFFECT,
	CASCADE_DELETE_GRAPHQL_POPUP_EFFECT,
	CASCADE_DELETE_PROPERTIES,
	CLOSE_MODAL,
	MODAL_ACTIONS
} from '../../constants';

import {
	getCascadeDetails,
	getCascadeMessage,
	getCascadeText,
	getDbViewCascadeText,
	getDbViewRecordText,
	getRecordText
} from './listCascadeDelete/listCascadeUtils';
import styles from './styles.scss';

const {COMPONENT_CONNECTED} = actionTypes;
const modalTitle = t('Delete');
const cancelTitle = t('Cancel');
const confirmTitle = t('Delete All');
const moreMsg = t('... and more');

const view = state => {
	const {
		properties: {
			table,
			cascadeProp,
			selectedRecords,
			content,
			isDBView,
			loading
		},
		deleteLoader
	} = state;
	const cascadeRecordsLen = get(content, 'cascadeRecords', []).length;

	const footerActions = [
		{label: confirmTitle, variant: 'primary-negative', disabled: loading},
		{label: cancelTitle, variant: 'tertiary', disabled: deleteLoader}
	];
	const noCascade =
		(cascadeProp !== true && cascadeProp !== 'true') ||
		cascadeProp === null ||
		!cascadeRecordsLen ||
		table === 'sys_attachment';

	const modalSize = noCascade || loading ? 'sm' : 'lg';

	const cascadeMsg = isDBView
		? getDbViewCascadeText(selectedRecords.length, content)
		: getCascadeText(cascadeRecordsLen, content);

	const noCascadeMsg = isDBView
		? getDbViewRecordText(selectedRecords.length)
		: getRecordText(selectedRecords.length);

	return (
		<Fragment>
			<now-modal
				size={modalSize}
				header-label={modalTitle}
				footer-actions={footerActions}
				manage-opened
				opened={true}>
				<div className="modal-md cascade-delete">
					{loading ? (
						<now-loader />
					) : noCascade ? (
						getCascadeMessage(noCascadeMsg)
					) : (
						<Fragment>
							{getCascadeMessage(cascadeMsg, 'cascade-message')}
							<div id="record-links">{getCascadeDetails(content)}</div>
							{get(content, 'limitExceeded', false) ? (
								<div className="cascade-message-more">{moreMsg}</div>
							) : null}
						</Fragment>
					)}
				</div>
			</now-modal>
		</Fragment>
	);
};

const footerActionClickedEffect = coeffects => {
	const footerActionLabel = get(coeffects, 'action.payload.footerAction.label');
	const {
		dispatch,
		updateState,
		properties: {table, selectedRecords}
	} = coeffects;

	if (footerActionLabel === confirmTitle) {
		dispatch(CASCADE_DELETE_GRAPHQL_EFFECT, {
			table,
			objSysIdStr: selectedRecords.join(',')
		});
		updateState({deleteLoader: true});
	}
	if (footerActionLabel === cancelTitle) closeModal(dispatch);
};

const closeModal = dispatch => dispatch(CLOSE_MODAL);

export const openedSetEffect = ({dispatch}) => closeModal(dispatch);
const cascadeDeleteRenderEffect = ({state, dispatch}) => {
	const {
		properties: {table, selectedRecords, cascadeProp}
	} = state;

	if (cascadeProp)
		dispatch(CASCADE_DELETE_GRAPHQL_POPUP_EFFECT, {
			table,
			objSysId: selectedRecords.join(','),
			stackName: ''
		});
};

createCustomElement('sn-record-list-modal-cascade-delete', {
	renderer: {
		type: snabbdom,
		view
	},
	actionHandlers: {
		[MODAL_ACTIONS.FOOTER_ACTION_CLICKED]: {
			effect: footerActionClickedEffect,
			stopPropagation: true
		},
		[MODAL_ACTIONS.OPENED_SET]: {
			effect: openedSetEffect,
			stopPropagation: true
		},
		[COMPONENT_CONNECTED]: {
			effect: cascadeDeleteRenderEffect,
			stopPropagation: true
		}
	},
	styles,
	properties: {
		selectedRecords: {
			default: ''
		},
		content: {
			default: ''
		},
		table: {},
		isDBView: false,
		cascadeProp: {
			default: getProperty(
				CASCADE_DELETE_PROPERTIES.CASCADE_DELETE_CONFIRM,
				true
			)
		},
		loading: {
			computed(state) {
				const {
					properties: {cascadeProp, content},
					deleteLoader
				} = state;
				return (cascadeProp && !content) || deleteLoader;
			}
		}
	},
	initialState: {
		deleteLoader: false
	}
});
