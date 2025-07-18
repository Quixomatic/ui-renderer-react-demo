import {
	addRetainedElement,
	getAndClearRetainedFocus
} from '@devsnc/sn-list-commons';
import {Logger} from '@devsnc/sn-list-commons';
import cuid from 'cuid';
import get from 'lodash/get';
import has from 'lodash/has';
import isEmpty from 'lodash/isEmpty';
import {t} from 'sn-translate';

import {dirtyModalInterceptor} from '../../../behaviors/dirtyBehavior/dirtyBehavior';
import {
	CLICK_HANDLER_QUICK_EDIT,
	CLOSE_FILTER_PANEL,
	CLOSE_PANEL,
	DECLARATIVE_ACTIONS,
	DIRTY_CHANGED,
	FILTER_PANEL_BUTTON_SELECTOR,
	HIGHLIGHT_SELECTOR,
	LIST_FORM_EDIT_PREVIEW_RECORD_CLICKED,
	LIST_REFRESH_REQUESTED_INTERNAL,
	MULTI_FORM,
	NOW_PANEL_OPENED_SET,
	OPEN_PANEL,
	PANEL_TYPE_FILTER,
	PANEL_TYPE_FROM_DA,
	PANEL_TYPE_MULTI_EDIT,
	PANEL_TYPE_QUICK_EDIT,
	QUICK_EDIT_CLICKED,
	QUICK_FORM,
	RECORD_LIST_NOTIFICATION_ADDED,
	UPDATE_PANEL
} from '../../../constants';
import {
	addClickHandler,
	clearClickHandler,
	eventPath
} from '../../../utils/clickHandlerHelpers';
import {getListPanelConfig} from '../../../utils/listPanelHelper';
import querySelector from '../../../utils/querySelector';

const LOG = Logger().createLog('List Panel Actions');

const openNowPanelEffect = ({action, updateProperties, host}) => {
	const {panelOpened, panelConfig} = action.payload;
	if (panelOpened)
		addRetainedElement(
			'filterPanelButton',
			querySelector(FILTER_PANEL_BUTTON_SELECTOR, host)
		);
	else {
		getAndClearRetainedFocus('filterPanelButton');
	}
	updateProperties({
		panelOpened,
		panelConfig
	});
};

const openPanelEffect = async coeffects => {
	const {dispatch, properties, action, host} = coeffects;

	const panelConfig = await getListPanelConfig(
		{
			...properties,
			...action.payload
		},
		dispatch
	);

	if (host) {
		const ariaExpanded =
			panelConfig.panelType === PANEL_TYPE_FILTER ? 'true' : 'false';
		const elementRef = querySelector(FILTER_PANEL_BUTTON_SELECTOR, host);
		elementRef && elementRef.setAttribute('aria-expanded', ariaExpanded);
	}

	dispatch(NOW_PANEL_OPENED_SET, {
		panelOpened: true,
		panelConfig
	});
};

const removeQuickEditHightlight = (host, shouldRefocus = false) => {
	if (!host) return;

	const gridElementRef = querySelector(HIGHLIGHT_SELECTOR, host);
	if (gridElementRef) {
		gridElementRef.classList.remove('quick-edit-highlight');

		if (shouldRefocus) {
			const quickEditElement = querySelector(
				'.quick-edit-button',
				gridElementRef
			);
			if (!quickEditElement) return;

			quickEditElement.focus();
		}
	}
};

const closePanelEffect = coeffect => {
	const {host, updateProperties} = coeffect;

	removeQuickEditHightlight(host, true);

	updateProperties({
		panelOpened: false,
		panelConfig: {}
	});
};

const closeFilterPanelEffect = coeffects => {
	const {updateProperties, host, dispatch} = coeffects;

	if (host) {
		const elementRef = querySelector(FILTER_PANEL_BUTTON_SELECTOR, host);
		elementRef && elementRef.setAttribute('aria-expanded', 'false');
	}

	closePanelEffect({updateProperties, host, dispatch});
};

const updatePanelEffect = async coeffects => {
	const {
		properties: {panelOpened, panelConfig},
		action: {payload}
	} = coeffects;

	if (!panelOpened) return;
	if (panelConfig.panelType !== payload.panelType) return;

	await openPanelEffect(coeffects);
};

const listDAMultiEditEffect = ({action, dispatch}) => {
	const {
		payload: {listPanelConfig: listPanelConfigFromDA}
	} = action;

	if (!listPanelConfigFromDA) {
		dispatch(OPEN_PANEL, {
			panelType: PANEL_TYPE_MULTI_EDIT
		});
		return;
	}

	dispatch(OPEN_PANEL, {
		panelType: PANEL_TYPE_FROM_DA,
		listPanelConfigFromDA
	});
};

const updateQuickEditRowHighlight = ({host, quickEditSysId}) => {
	if (!host) return;

	removeQuickEditHightlight(host);

	const gridRowSelector = `>>> now-grid >>> tr[data-id='${quickEditSysId}']`;

	const rowElementRef = querySelector(gridRowSelector, host);
	if (rowElementRef) {
		rowElementRef.classList.add('quick-edit-highlight');
	}
};

const quickEditClickedEffect = ({
	dispatch,
	action,
	updateProperties,
	host,
	properties
}) => {
	const {quickEditSysId} = action.payload;
	const {workspaceConfigId, table} = properties;

	if (isEmpty(workspaceConfigId)) {
		dispatch(LIST_FORM_EDIT_PREVIEW_RECORD_CLICKED, {
			quickEditSysId,
			table
		});
	}

	updateQuickEditRowHighlight({host, quickEditSysId});

	updateProperties({quickEditSysId});
	dispatch(OPEN_PANEL, {
		panelType: PANEL_TYPE_QUICK_EDIT,
		quickEditSysId
	});
};

const quickEditSaveSuccessEffect = ({
	dispatch,
	action,
	updateProperties,
	host
}) => {
	const displayValue = get(action, 'payload.displayValue', '');
	let notificationContent;
	if (displayValue) {
		notificationContent = `${displayValue} ${t('successfully updated')}`;
	} else {
		notificationContent = t('Record successfully updated');
	}

	dispatch(DIRTY_CHANGED, {isDirty: false});
	updateProperties({isDirty: false});
	dispatch(RECORD_LIST_NOTIFICATION_ADDED, {
		alertList: [
			{
				status: 'positive',
				content: notificationContent,
				action: {type: 'dismiss'},
				id: `now_alert_success_${cuid()}`
			}
		]
	});
	closePanelEffect({updateProperties, host, dispatch});
	dispatch(LIST_REFRESH_REQUESTED_INTERNAL, {timestamp: Date.now()});

	addClickHandler({
		updateProperties,
		dispatch,
		handlerCallback: quickEditClickHandler,
		key: CLICK_HANDLER_QUICK_EDIT
	});
};

const quickEditSaveFailEffect = ({
	dispatch,
	action,
	updateProperties,
	host
}) => {
	const displayValue = get(action, 'payload.displayValue', '');
	let notificationContent;
	if (displayValue) {
		notificationContent = t('{0} not updated', displayValue);
	} else {
		notificationContent = t('Record not updated');
	}

	dispatch(DIRTY_CHANGED, {isDirty: false});
	updateProperties({isDirty: false});
	dispatch(RECORD_LIST_NOTIFICATION_ADDED, {
		alertList: [
			{
				status: 'critical',
				content: notificationContent,
				action: {type: 'dismiss'},
				id: `now_alert_failure_${cuid()}`
			}
		]
	});
	closePanelEffect({updateProperties, host, dispatch});

	addClickHandler({
		updateProperties,
		dispatch,
		handlerCallback: quickEditClickHandler,
		key: CLICK_HANDLER_QUICK_EDIT
	});
};

const quickEditCloseEffect = ({dispatch, updateProperties, host}) => {
	dispatch(DIRTY_CHANGED, {isDirty: false});
	updateProperties({
		quickEditSysId: '',
		isDirty: false
	});
	closePanelEffect({updateProperties, host, dispatch});
};

const multiEditSaveResultEffect = ({dispatch, action, updateProperties}) => {
	multiEditCloseEffect({dispatch, updateProperties});

	let alertList = [];

	if (
		has(action, 'payload.result.errorCount') &&
		has(action, 'payload.result.recordCount')
	) {
		const successfulRecordCount =
			action.payload.result.recordCount - action.payload.result.errorCount;

		if (successfulRecordCount > 0) {
			alertList.push({
				status: 'positive',
				content: t('{0} record(s) updated successfully', successfulRecordCount),
				action: {type: 'dismiss'},
				id: `now_alert_success_${cuid()}`
			});
		}
		if (action.payload.result.errorCount > 0) {
			alertList.push({
				status: 'critical',
				content: t(
					'{0} record(s) not updated',
					action.payload.result.errorCount
				),
				action: {type: 'dismiss'},
				id: `now_alert_failure_${cuid()}`
			});
		}

		dispatch(RECORD_LIST_NOTIFICATION_ADDED, {
			alertList
		});

		dispatch(LIST_REFRESH_REQUESTED_INTERNAL, {timestamp: Date.now()});
	}
};

const multiEditCloseEffect = ({dispatch, updateProperties, host}) => {
	dispatch(DIRTY_CHANGED, {isDirty: false});
	closePanelEffect({updateProperties, host, dispatch});
};

const dirtyEffect = ({action, dispatch, updateProperties, properties}) => {
	const {isDirty: isDirtyProp} = properties;
	const isDirtyPayload = get(action, 'payload.isDirty', false);

	if (!isDirtyProp && isDirtyPayload) {
		dispatch(DIRTY_CHANGED, {isDirty: true});
		updateProperties({isDirty: true});
	}

	if (isDirtyProp && !isDirtyPayload) {
		dispatch(DIRTY_CHANGED, {isDirty: false});
		updateProperties({isDirty: false});
	}
};

const quickEditClickHandler = ({updateProperties}) => evt => {
	try {
		const getEventPath = eventPath(window);
		const path = getEventPath(evt);

		let containsQuickEdit = false;
		let containsNowAlertButton = false;

		path.some(item => {
			containsQuickEdit =
				containsQuickEdit ||
				(item.classList && item.classList.contains('-quick-edit'));

			containsNowAlertButton =
				containsNowAlertButton ||
				(item.classList && item.classList.contains('now-alert-button'));

			return containsQuickEdit || containsNowAlertButton;
		});

		if (containsNowAlertButton) return;

		clearClickHandler(CLICK_HANDLER_QUICK_EDIT);

		if (!containsQuickEdit) updateProperties({quickEditSysId: ''});
	} catch (ex) {
		LOG.log(`ERROR: failed to parse event path: ${ex}`);
	}
};

const actionHandlers = {
	[CLOSE_PANEL]: {
		effect: closePanelEffect,
		stopPropagation: true,
		interceptors: [dirtyModalInterceptor]
	},
	[CLOSE_FILTER_PANEL]: {
		effect: closeFilterPanelEffect,
		stopPropagation: true
	},
	[DECLARATIVE_ACTIONS.EDIT]: {
		effect: listDAMultiEditEffect,
		stopPropagation: true
	},
	[MULTI_FORM.CLOSE]: {
		effect: multiEditCloseEffect,
		stopPropagation: true
	},
	[MULTI_FORM.DIRTY_CHANGED]: {
		effect: dirtyEffect,
		stopPropagation: true
	},
	[MULTI_FORM.SAVE_FAILED]: {
		effect: multiEditSaveResultEffect,
		stopPropagation: true
	},
	[MULTI_FORM.SAVE_SUCCEEDED]: {
		effect: multiEditSaveResultEffect,
		stopPropagation: true
	},
	[NOW_PANEL_OPENED_SET]: {
		effect: openNowPanelEffect,
		stopPropagation: true
	},
	[OPEN_PANEL]: {
		effect: openPanelEffect
	},
	[QUICK_EDIT_CLICKED]: {
		effect: quickEditClickedEffect,
		stopPropagation: true,
		interceptors: [dirtyModalInterceptor]
	},
	[QUICK_FORM.CLOSE]: {
		effect: quickEditCloseEffect,
		stopPropagation: true
	},
	[QUICK_FORM.DIRTY_CHANGED]: {
		effect: dirtyEffect,
		stopPropagation: true
	},
	[QUICK_FORM.SAVE_FAILED]: {
		effect: quickEditSaveFailEffect,
		stopPropagation: true
	},
	[QUICK_FORM.SAVE_SUCCEEDED]: {
		effect: quickEditSaveSuccessEffect,
		stopPropagation: true
	},
	[UPDATE_PANEL]: {
		effect: updatePanelEffect,
		stopPropagation: true
	}
};
export default actionHandlers;
