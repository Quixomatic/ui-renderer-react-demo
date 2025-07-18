import get from 'lodash/get';
import {t} from 'sn-translate';

import {DIRTY_CHANGED, PROPERTIES_SET} from '../../constants';

import {
	FOOTER_ACTION_CLICKED,
	MODAL_OPENED_SET,
	OPEN_DIRTY_MODAL
} from './dirtyModalConstants';

const title = t('Discard your changes?');
const message = t('You have made changes which will not be saved.');
const cancelTitle = t('Cancel');
const confirmTitle = t('Discard Changes');
const footerActions = `[{"variant": "primary","label": "${confirmTitle}"}, {"variant": "secondary","label": "${cancelTitle}"}]`;

const BEHAVIOR_NAME = 'dirtyModalBehavior';

const setModal = ({coeffects, dirtyModalOpen}) => {
	coeffects.updateProperties({dirtyModalOpen});
};

const getBehaviorState = state => get(state, `behaviors.${BEHAVIOR_NAME}`, {});

const actionEffect = coeffects => {
	const {dispatch, state} = coeffects;
	const {callbacks} = getBehaviorState(state);

	setModal({coeffects, dirtyModalOpen: false});
	const footerActionLabel = get(coeffects, 'action.payload.footerAction.label');

	if (footerActionLabel === confirmTitle) {
		callbacks.confirmationCallback();
		dispatch(DIRTY_CHANGED, {isDirty: false});
		dispatch(PROPERTIES_SET, {isDirty: false});
	}

	callbacks.closeCallBack();
};

const openDirtyModalEffect = coeffects => {
	const {isDirty} = coeffects.properties;
	const {payload} = coeffects.action;

	if (!isDirty) {
		payload.confirmationCallback();
		return;
	}

	coeffects.updateState({
		path: `behaviors.${BEHAVIOR_NAME}.callbacks`,
		value: {...payload},
		operation: 'set'
	});
	setModal({coeffects, dirtyModalOpen: true});
};

export const dirtyModalBehavior = {
	name: BEHAVIOR_NAME,
	initialState: {},
	properties: {
		dirtyModalOpen: {
			default: false,
			selectable: true
		}
	},
	actionHandlers: {
		[FOOTER_ACTION_CLICKED]: {
			effect: actionEffect,
			stopPropagation: true
		},
		[MODAL_OPENED_SET]: {
			effect: actionEffect,
			stopPropagation: true
		},
		[OPEN_DIRTY_MODAL]: {
			effect: openDirtyModalEffect,
			stopPropagation: true
		}
	},
	onBootstrap(host) {
		const modal = document.createElement('NOW-MODAL');
		const componentId = host.attributes['component-id'].value;
		modal.setAttribute('opened', `@${componentId}/dirtyModalOpen`);
		modal.setAttribute('manage-opened', 'true');
		modal.setAttribute('header-label', title);
		modal.setAttribute('content', message);
		modal.setAttribute('footer-actions', footerActions);
		host.shadowRoot.appendChild(modal);
	}
};
