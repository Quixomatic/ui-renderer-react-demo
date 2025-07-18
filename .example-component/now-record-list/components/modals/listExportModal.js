import './listExportModal/fieldSet';
import './listExportModal/progress';
import '@servicenow/now-alert';
import '@servicenow/now-modal';
import {createCustomElement} from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';
import {preUserData} from 'sn-uxpage-presource';

import {EXPORT_MODAL_BOOTSTRAP} from '../../constants';

import actionHandlers from './listExportModal/actions';
import styles from './listExportModal/listExportModal.scss';
import {
	EXPORT_MODAL_PROGRESS,
	EXPORT_MODAL_TYPE_SELECTION,
	defaultExportFields,
	defaultPreferencesMap,
	getFooterActionsHelper,
	transformExportFieldsState
} from './listExportModal/listExportService';

const getValueChangeHandler = (fields, updateState) => {
	return (e, name, value) => {
		updateState({
			path: `userPrefsState.${name}.value`,
			value,
			operation: 'set'
		});
	};
};

const view = (state, {updateState}) => {
	const {
		properties: {componentId, notifications = [], shouldFocusOnOpen},
		fields,
		modalType,
		bootstrapped,
		status,
		message
	} = state;

	if (!bootstrapped) return null;

	const modalHelper = getFooterActionsHelper(modalType);
	const modalProperties = modalHelper(state);
	const {footerActions, modalTitle} = modalProperties;

	return (
		<now-modal
			component-name={componentId + '-embedded-modal'}
			size="md"
			header-label={modalTitle}
			footer-actions={footerActions}
			manage-opened
			opened={true}>
			{modalType === EXPORT_MODAL_TYPE_SELECTION ? (
				<div className="sn-export-modal--content">
					{notifications.length > 0 ? (
						<div className="sn-export-modal--alerts-container">
							<div className="sn-export-modal--alerts">
								<now-alert-list items={notifications} manageItems={true} />
							</div>
						</div>
					) : null}
					<sn-record-list-modal-export-field-set
						instanceId={componentId + '-field-set'}
						fields={[...fields]}
						shouldFocusOnOpen={shouldFocusOnOpen}
						onValueChange={getValueChangeHandler([...fields], updateState)}
						onStagedValueChange={getValueChangeHandler(
							[...fields],
							updateState
						)}
					/>
				</div>
			) : null}
			{modalType === EXPORT_MODAL_PROGRESS ? (
				<sn-record-list-modal-export-progress
					status={status}
					message={message}
				/>
			) : null}
		</now-modal>
	);
};

createCustomElement('sn-record-list-modal-export', {
	renderer: {
		type: snabbdom,
		view,
		transformState(state) {
			const transformedFields = transformExportFieldsState(state);
			return {
				...state,
				...transformedFields
			};
		}
	},
	initialState: {
		bootstrapped: false,
		confirmationDisabled: false,
		fields: defaultExportFields,
		message: '',
		modalType: EXPORT_MODAL_TYPE_SELECTION,
		status: '',
		userPrefsState: defaultPreferencesMap
	},
	properties: {
		columns: {},
		componentId: {default: 'sn-record-list-modal-export'},
		notifications: {default: []},
		query: {},
		recordCount: {},
		shouldFocusOnOpen: {default: false},
		table: {},
		userPreferences: {default: []},
		view: {},
		workspaceConfigId: {}
	},
	onBootstrap(host, dispatch) {
		dispatch(EXPORT_MODAL_BOOTSTRAP);
	},
	actionHandlers,
	styles,
	behaviors: [preUserData]
});
