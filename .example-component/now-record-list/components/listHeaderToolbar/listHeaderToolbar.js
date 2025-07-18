import '@servicenow/now-dropdown';
import {addRetainedElement} from '@devsnc/sn-list-commons';
import {createCustomElement} from '@servicenow/ui-core';
import snabbdom, {Fragment} from '@servicenow/ui-renderer-snabbdom';
import cuid from 'cuid';
import get from 'lodash/get';
import isUndefined from 'lodash/isUndefined';
import {t} from 'sn-translate';

import ariaStatusBehavior from '../../behaviors/ariaStatusBehavior';
import {
	dirtyBehavior,
	dirtyModalInterceptor
} from '../../behaviors/dirtyBehavior/dirtyBehavior';
import {keyboardShortcutsBehavior} from '../../behaviors/keyboardShortcutsBehavior/keyboardShortcutsBehavior';
import {
	CLOSE_FILTER_PANEL,
	CLOSE_PANEL,
	DROPDOWN_ITEM_CLICKED,
	FILTER_BUTTON_CLICKED,
	INVALID_ACTION_ITEM,
	LIST_REFRESH_REQUESTED_INTERNAL,
	LIST_TYPES,
	METRIC_TRACKED,
	NOW_LIST_USE_NOW_GRID,
	NOW_TOGGLE_CHECKED_SET,
	OPEN_PANEL,
	PANEL_TYPE_FILTER,
	REFRESH_BUTTON_CLICKED,
	RESIZE_FLOATING_HEADER,
	SIZE_MEDIUM
} from '../../constants';
import {isEdge, isIE11} from '../../utils/browser';
import {
	REFRESH_LIST_EVENT,
	TOGGLE_FILTER_PANEL_EVENT
} from '../../utils/metrics/constants';
import {createFilterPanelButton} from '../filterPanelButton/filterPanelButton';
import {createCopyUrlButton} from '../listCopyUrlButton/listCopyUrlButton';
import {createRefreshButton} from '../listRefresh/listRefresh';

import styles from './listHeaderToolbar.scss';
import * as ListHeaderToolbarService from './listHeaderToolbarService';
const HIDE_PERSONALIZATION_FEATURE_NOT_AVAILABLE_LIST = [
	LIST_TYPES.REFERENCE,
	LIST_TYPES.PICKER
];
const LIST_ACTIONS = t('List Actions');

const view = ({properties}, {dispatch}) => {
	const {
		children,
		headerToolbarProps,
		hideColumnResizing,
		hideFilterPanel,
		hideMenuButton,
		hidePanel,
		hideRefreshButton,
		hideListSharing,
		hideLiveList,
		hidePersonalization,
		listTitle,
		listType,
		liveListCount,
		liveLists,
		menuSelection,
		panelOpened,
		panelConfig,
		parsedQueryCount
	} = properties;

	const isIE11orEdge = isIE11() || isEdge();
	const dropdownClass = isIE11orEdge
		? 'sn-list-header-toolbar-button-wrapper ie11edge-alignment'
		: 'sn-list-header-toolbar-button-wrapper';
	const isDefaultList = listType === LIST_TYPES.DEFAULT;

	// Default list have dropdown irrespective of hidePersonalization value
	// overrideHasDropdown decides the value of hasDropDown for related and simple lists wrt hidePersonalization value

	let overrideHasDropdown =
		listType !== LIST_TYPES.DEFAULT && !hideColumnResizing;

	if (!hidePersonalization && !isDefaultList)
		overrideHasDropdown = !HIDE_PERSONALIZATION_FEATURE_NOT_AVAILABLE_LIST.includes(
			listType
		);

	const hasDropdown =
		(!hideMenuButton &&
			ListHeaderToolbarService.isTableSupported(
				menuSelection,
				hideColumnResizing,
				listType,
				hidePersonalization
			)) ||
		overrideHasDropdown;

	const hasPanel = !hideFilterPanel && !hidePanel;
	const buttonVariant =
		listType === LIST_TYPES.SNAPSHOT ? 'tertiary' : 'secondary';
	const isBare = listType === LIST_TYPES.SNAPSHOT;
	const {panelType} = panelConfig;

	const refreshButtonProps = {
		triggerRefresh: headerToolbarProps.triggerRefresh,
		size: SIZE_MEDIUM,
		variant: buttonVariant,
		liveListCount,
		liveLists,
		listTitle,
		hideLiveList,
		panelType,
		bare: isBare
	};

	const copyUrlButtonProps = {
		size: SIZE_MEDIUM,
		variant: buttonVariant,
		listTitle
	};

	const filterButtonProps = {
		count: parseInt(parsedQueryCount, 10),
		size: SIZE_MEDIUM,
		variant: buttonVariant,
		panelConfig,
		panelOpened,
		listTitle
	};

	return (
		<div className="sn-list-header-toolbar">
			{children}

			{!hideRefreshButton
				? createRefreshButton(refreshButtonProps, dispatch)
				: null}

			{hasDropdown ? (
				<Fragment>
					<div className={dropdownClass}>
						{renderDropdown({
							properties,
							SIZE_MEDIUM,
							buttonVariant,
							overrideHasDropdown,
							listTitle
						})}
					</div>
				</Fragment>
			) : null}

			{!hideListSharing
				? createCopyUrlButton(copyUrlButtonProps, dispatch)
				: null}

			{hasPanel ? createFilterPanelButton(filterButtonProps, dispatch) : null}
		</div>
	);
};

const renderDropdown = ({
	properties,
	buttonSize,
	buttonVariant,
	overrideHasDropdown
}) => {
	const {
		menuSelection,
		hideColumnResizing,
		hideOptionToSaveAs,
		hidePersonalization,
		isListEditable,
		listType
	} = properties;
	const dropdownOptions = ListHeaderToolbarService.getOptions({
		menuSelection,
		hideColumnResizing,
		isListEditable,
		overrideHasDropdown,
		listType,
		hidePersonalization,
		hideOptionToSaveAs
	}).map((item, index) => ({
		id: index,
		label: item.title
	}));
	const disabledAttr = isUndefined(dropdownOptions) ? {disabled: true} : {};
	const dropdownAriaLabel = `${LIST_ACTIONS}`;

	return dropdownOptions.length ? (
		<div
			on-click={event => addRetainedElement('listActionsButton', event.target)}>
			<now-dropdown
				icon="gear-outline"
				size={buttonSize}
				variant={buttonVariant}
				select="none"
				tooltip-content={LIST_ACTIONS}
				hide-caret
				items={dropdownOptions}
				config-aria={{
					trigger: {'aria-label': dropdownAriaLabel}
				}}
				{...disabledAttr}
			/>
		</div>
	) : null;
};

createCustomElement('sn-record-list-header-toolbar', {
	renderer: {
		type: snabbdom,
		view
	},
	properties: {
		columns: {default: ''},
		headerToolbarProps: {default: {}},
		hideColumnResizing: {default: {}},
		hideFilterPanel: {default: {}},
		hideMenuButton: {default: {}},
		hidePanel: {default: {}},
		hideRefreshButton: {default: {}},
		hideListSharing: {default: false},
		hideLiveList: {default: true},
		isListEditable: {default: false},
		isTableEmpty: {default: false},
		isWorkspace: {default: true},
		listModel: {default: {}},
		listTitle: {default: ''},
		listType: {default: {}},
		menuSelection: {default: ''},
		panelConfig: {default: {}},
		panelOpened: {default: false},
		parsedQueryCount: {default: {}},
		query: {default: ''},
		recordCount: {default: 0},
		relatedListName: {default: ''},
		selectedListId: {default: ''},
		size: {default: SIZE_MEDIUM},
		table: {default: ''},
		userPreferences: {default: []},
		liveListCount: {default: 0},
		liveLists: {default: false},
		hideOptionToSaveAs: {default: false},
		hidePersonalization: {default: false}
	},
	styles: styles,
	actionHandlers: {
		[DROPDOWN_ITEM_CLICKED]: {
			effect: ({dispatch, action: {payload}, state}) => {
				const {overrideHasDropdown} = state;
				const {
					menuSelection,
					hideColumnResizing,
					hideOptionToSaveAs,
					hidePersonalization,
					isListEditable,
					listType
				} = state.properties;
				const {
					item: {id}
				} = payload;

				const dropdownOptions = ListHeaderToolbarService.getOptions({
					menuSelection,
					hideColumnResizing,
					isListEditable,
					overrideHasDropdown,
					listType,
					hidePersonalization,
					hideOptionToSaveAs
				});
				const option = get(dropdownOptions, id, {
					value: INVALID_ACTION_ITEM
				});
				option.action({dispatch, ...state.properties});
			},
			stopPropagation: true,
			interceptors: [dirtyModalInterceptor]
		},
		[REFRESH_BUTTON_CLICKED]: {
			effect: ({dispatch, properties}) => {
				const {
					panelConfig: {panelType}
				} = properties;

				if (panelType !== PANEL_TYPE_FILTER) dispatch(CLOSE_PANEL);
				dispatch(LIST_REFRESH_REQUESTED_INTERNAL, {
					timestamp: Date.now(),
					fromButton: true
				});
				dispatch(METRIC_TRACKED, {
					eventName: REFRESH_LIST_EVENT,
					metadata: {}
				});
			},
			stopPropagation: true,
			interceptors: [dirtyModalInterceptor]
		},
		[FILTER_BUTTON_CLICKED]: {
			effect: ({dispatch, properties}) => {
				const {
					panelOpened,
					panelConfig: {panelType}
				} = properties;

				const isFilterPanelOpen =
					panelOpened && panelType === PANEL_TYPE_FILTER;

				const action = isFilterPanelOpen ? 'hide' : 'show';
				dispatch(METRIC_TRACKED, {
					eventName: TOGGLE_FILTER_PANEL_EVENT,
					metadata: {action}
				});

				if (isFilterPanelOpen) {
					dispatch(CLOSE_FILTER_PANEL);
					return;
				}

				dispatch(OPEN_PANEL, {
					panelType: PANEL_TYPE_FILTER
				});

				dispatch(RESIZE_FLOATING_HEADER, {
					UUID: cuid()
				});
			},
			stopPropagation: true,
			interceptors: [dirtyModalInterceptor]
		},
		[NOW_TOGGLE_CHECKED_SET]: {
			effect: ({
				dispatch,
				action: {
					payload: {value}
				}
			}) => {
				dispatch(NOW_LIST_USE_NOW_GRID, {value});
			}
		}
	},
	behaviors: [dirtyBehavior, ariaStatusBehavior, keyboardShortcutsBehavior]
});
