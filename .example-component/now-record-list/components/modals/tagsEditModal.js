import '@servicenow/now-button';
import '@servicenow/now-dropdown';
import '@servicenow/now-modal';
import '@servicenow/now-text-link';
import {createCustomElement} from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';

import {
	FILTER_LABEL,
	FILTER_TAG_LABEL,
	FOOTER_ACTIONS,
	INVALID_TAG_NAME_ALERT,
	TAG_MAX_LENGTH,
	TAG_MODAL_HEADER,
	TAG_NAME_LABEL
} from '../tags/constants';

import styles from './styles.scss';
import actionHandlers from './tagsEditModal/actions';
import {viewableByView} from './tagsEditModal/tagsGroupAndUsersView';

const view = state => {
	const {
		tagDetails,
		invalidTagName,
		properties: {canEdit}
	} = state;
	const canEditTag = canEdit && tagDetails.name?.canWrite;

	return (
		<now-modal
			size="md"
			header-label={TAG_MODAL_HEADER}
			footer-actions={canEditTag ? FOOTER_ACTIONS : []}
			manage-opened
			opened>
			<div className="modal-content">
				<now-input
					className="edit-tag-modal-content-input"
					type="text"
					value={tagDetails.name?.value}
					label={TAG_NAME_LABEL}
					required
					manageInvalid
					invalid={invalidTagName}
					disabled={!canEditTag}
					maxlength={TAG_MAX_LENGTH}
					messages={invalidTagName ? INVALID_TAG_NAME_ALERT : []}
				/>
				<span className="edit-tag-modal-text-link">
					<now-button-bare
						label={FILTER_TAG_LABEL}
						variant="primary"
						size="sm"
						icon-start="document-outline"
						high-contrast
						config-aria={{
							button: {'aria-label': FILTER_LABEL}
						}}
					/>
				</span>
				{canEditTag && viewableByView(state)}
			</div>
		</now-modal>
	);
};

createCustomElement('sn-record-list-modal-edit-tag', {
	renderer: {
		type: snabbdom,
		view
	},
	initialState: {
		selectedUsers: [],
		selectedGroups: [],
		users: [],
		groups: [],
		tagDetails: {},
		isSaveClicked: false,
		invalidTagName: false
	},
	properties: {
		tagId: {default: ''},
		canEdit: {default: false}
	},
	actionHandlers,
	styles
});
