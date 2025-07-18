import {resetScroll} from '@devsnc/sn-list-commons';
import {
	NOW_GRID_CONTAINER_SCROLL,
	NOW_GRID_POPOVER_CLOSED
} from '@servicenow/now-grid';
import {actionTypes} from '@servicenow/ui-core';
import get from 'lodash/get';

import packageJson from '../../../../package.json';
import {GRID_BASE_SELECTOR} from '../../../behaviors/constants';
import {dirtyModalInterceptor} from '../../../behaviors/dirtyBehavior/dirtyBehavior';
import {
	CELL_URL_CLICKED,
	CLICK_HANDLER_POPOVER,
	CLICK_HANDLER_QUICK_EDIT,
	CLOSE_PANEL,
	COLUMN_APPLY_COLOR,
	COMPONENT_PROPERTY_CHANGED,
	DA_WRAPPED_CLICKED,
	DECLARATIVE_ACTIONS,
	GRID_A11Y_COLUMN_REORDER,
	GRID_COLUMN_SELECT,
	ITEM_SELECTED,
	LIST_DA_WRAPPED_CLICKED,
	LIST_SCROLL_UPDATED,
	LIST_VIEW_ALL,
	LIST_VIEW_ALL_CLICKED,
	METRIC_TRACKED,
	MODAL_TYPES,
	MODEL_PATH,
	NOW_LIST_USE_NOW_GRID,
	OPEN_MODAL,
	PANEL_TYPE_FILTER,
	PANEL_TYPE_MULTI_EDIT,
	PANEL_TYPE_QUICK_EDIT,
	RESET_GRID_SCROLL,
	SELECT_VIEW_ALL_EVENT,
	TEXT_LINK_CLICKED,
	UPDATE_PANEL
} from '../../../constants';
import {clearClickHandler} from '../../../utils/clickHandlerHelpers';
import {CLICK_LIST_LINK_EVENT} from '../../../utils/metrics/constants';
import querySelector from '../../../utils/querySelector';
import {cascadeDelete} from '../../listHeaderToolbar/listHeaderToolbarService';
import {
	exportList,
	importList
} from '../../listHeaderToolbar/listHeaderToolbarService';
import {a11yColumnReorderEffect} from '../../nowGrid/a11yColumnReorder/a11yColumnReorder';
import {
	columnApplyColorEffect,
	columnSelectionEffect
} from '../../nowGrid/columnSelection/columnSelection';
import {generateTransform} from '../../nowGrid/templates/generateTemplates';
import {inlineDependentTemplateName} from '../../nowGrid/templates/inlineDependentPopoverTemplate';
import {inlineEditTemplateName} from '../../nowGrid/templates/inlineEditPopoverTemplate';
import {inlineTagsTemplateName} from '../../nowGrid/templates/inlineTagsTemplate';
import {TAG_CLICKED} from '../../tags/constants';

const {
	COMPONENT_CONNECTED,
	COMPONENT_DISCONNECTED,
	COMPONENT_BOOTSTRAPPED
} = actionTypes;
const privatelyHandledDAs = [
	DECLARATIVE_ACTIONS.EDIT,
	DECLARATIVE_ACTIONS.EXPORT,
	DECLARATIVE_ACTIONS.DELETE,
	DECLARATIVE_ACTIONS.IMPORT
];

export const listDAExportEffect = ({dispatch, properties}) => {
	const {
		listModel,
		table,
		view,
		userPreferences,
		parsedQueryModel,
		workspaceConfigId
	} = properties;
	const recordCount = get(listModel, MODEL_PATH.LAYOUT_QUERY.COUNT, 0);
	const query = parsedQueryModel.concatenatedGlideQuery.toQueryString() || '';

	const columns = Array.from(get(listModel, 'allColumns', []).keys()).join(',');
	const exportProps = {
		recordCount,
		dispatch,
		columns,
		table,
		query,
		view,
		userPreferences,
		workspaceConfigId
	};
	exportList(exportProps);
};

export const listDAImportEffect = ({dispatch, properties}) => {
	const {parsedQueryModel, listModel} = properties;
	const recordCount = get(listModel, MODEL_PATH.LAYOUT_QUERY.COUNT, 0);
	const query = get(parsedQueryModel, 'queryString', '');
	const columns = Array.from(get(listModel, 'allColumns', []).keys()).join(',');
	const importProps = {...properties, recordCount, query, columns};
	importList({...importProps, dispatch});
};

const listDACascadeDeleteEffect = ({dispatch, properties}) => {
	// perform cascade delete only when records are selected.
	const {
		selectedRecords = [],
		table,
		listModel: {
			tableMetadata: {isDBView}
		}
	} = properties;

	if (selectedRecords.length > 0) {
		cascadeDelete({
			selectedRecords,
			table,
			isDBView,
			dispatch
		});
	}
};

const handlePropertyChanged = ({
	action: {
		payload: {name, value}
	},
	dispatch,
	properties: {panelOpened = false, panelConfig = {}},
	updateState
}) => {
	if (
		name === 'parsedQueryModel' &&
		panelOpened &&
		panelConfig.panelType === PANEL_TYPE_FILTER
	) {
		dispatch(UPDATE_PANEL, {panelType: PANEL_TYPE_FILTER});
		return;
	}

	if (
		name === 'listModel' &&
		panelOpened &&
		panelConfig.panelType === PANEL_TYPE_QUICK_EDIT
	) {
		dispatch(CLOSE_PANEL);
		return;
	}

	if (
		name === 'selectedRecords' &&
		panelOpened &&
		panelConfig.panelType === PANEL_TYPE_MULTI_EDIT
	) {
		if (!value.length) {
			dispatch(CLOSE_PANEL);
			return;
		}
		dispatch(UPDATE_PANEL, {panelType: PANEL_TYPE_MULTI_EDIT});
	}
	if (name === 'inlineEditorPrefetchData') {
		updateState({
			inlineEditorPrefetchState: value
		});
	}
};

const onConnectedEffect = ({
	action: {
		payload: {host}
	}
}) => {
	if (!window.listComponentRegistry) {
		window.listComponentRegistry = new WeakMap();
	}
	window.listComponentRegistry.set(host, packageJson.version);
};

const onDisconnectEffect = ({
	action: {
		payload: {host}
	}
}) => {
	if (window.listComponentRegistry) {
		window.listComponentRegistry.delete(host);
	}

	clearClickHandler(CLICK_HANDLER_POPOVER);
	clearClickHandler(CLICK_HANDLER_QUICK_EDIT);
};

export const bootStrapActionHandler = {
	[COMPONENT_BOOTSTRAPPED]: {
		effect: ({updateState}) => {
			updateState({
				operation: 'set',
				path: 'applyStateTransformations',
				value: generateTransform(),
				shouldRender: false
			});
		}
	}
};
//
export const resetScrollEffect = coeffects => {
	const {host} = coeffects;
	const gridNode = querySelector(GRID_BASE_SELECTOR, host);
	if (!gridNode) return;

	const gridScrollContainer = gridNode.shadowRoot.querySelector(
		'div.container'
	);

	resetScroll(gridScrollContainer, false);
};

export const resetScrollActionHandler = {
	[RESET_GRID_SCROLL]: {
		effect: resetScrollEffect,
		stopPropagation: true
	}
};

const handleCellUrlClicked = coeffects => {
	const {
		dispatch,
		action: {
			payload: {column, rowIndex, sysId}
		}
	} = coeffects;

	// we want to keep track of rowIndex + 1 so we track metrics with row indices starting with 1
	dispatch(METRIC_TRACKED, {
		eventName: CLICK_LIST_LINK_EVENT,
		metadata: {fieldType: 'URL', rowIndex: rowIndex + 1, column, sysId}
	});
};

const handleListViewAllClicked = coeffects => {
	const {
		dispatch,
		properties: {
			listTitle: title,
			table,
			conditions: query,
			columns,
			workspaceConfigId
		}
	} = coeffects;

	const viewAllParams = {
		listTitle: title || table || '',
		table,
		query,
		columns,
		...(workspaceConfigId && {workspaceConfigId}),
		disableQuickEdit: true
	};

	dispatch(METRIC_TRACKED, {
		eventName: SELECT_VIEW_ALL_EVENT,
		metadata: {}
	});
	dispatch(ITEM_SELECTED, {
		renderer_type: 'layout',
		params: viewAllParams
	});

	const {listTitle} = viewAllParams;
	dispatch(LIST_VIEW_ALL_CLICKED, {
		listTitle,
		table,
		query,
		columns
	});
};

const handleTextLinkClicked = coeffects => {
	const {
		action: {
			payload: {type}
		}
	} = coeffects;

	if (type === LIST_VIEW_ALL) {
		handleListViewAllClicked(coeffects);
	} else if (type === CELL_URL_CLICKED) {
		handleCellUrlClicked(coeffects);
	}
};

export const listActionHandlers = {
	[COMPONENT_CONNECTED]: {
		effect: onConnectedEffect
	},
	[COMPONENT_DISCONNECTED]: {
		effect: onDisconnectEffect
	},
	[COMPONENT_PROPERTY_CHANGED]: {
		effect: handlePropertyChanged
	},
	[GRID_COLUMN_SELECT]: {
		effect: columnSelectionEffect,
		stopPropagation: true
	},
	[COLUMN_APPLY_COLOR]: {
		effect: columnApplyColorEffect,
		stopPropagation: true
	},
	[GRID_A11Y_COLUMN_REORDER]: {
		effect: a11yColumnReorderEffect,
		stopPropagation: true
	},
	[DECLARATIVE_ACTIONS.EXPORT]: {
		effect: listDAExportEffect,
		stopPropagation: true
	},
	[DECLARATIVE_ACTIONS.IMPORT]: {
		effect: listDAImportEffect,
		stopPropagation: true
	},
	[DECLARATIVE_ACTIONS.DELETE]: {
		effect: listDACascadeDeleteEffect,
		stopPropagation: true
	},
	[DA_WRAPPED_CLICKED]: {
		effect: ({action, dispatch}) => {
			const {
				payload: {wrapped_action_name, wrapped_payload}
			} = action;

			if (privatelyHandledDAs.includes(wrapped_action_name))
				dispatch(wrapped_action_name, wrapped_payload);

			dispatch(LIST_DA_WRAPPED_CLICKED, {
				wrappedAction: wrapped_action_name,
				wrappedPayload: wrapped_payload
			});
		},
		interceptors: [dirtyModalInterceptor],
		stopPropagation: false
	},
	[NOW_LIST_USE_NOW_GRID]: {
		effect: ({
			updateState,
			action: {
				payload: {value}
			}
		}) => {
			updateState({useNowGrid: value});
		},
		stopPropagation: true
	},
	[NOW_GRID_CONTAINER_SCROLL]: {
		effect: ({properties, dispatch, action}) => {
			const {
				payload: {timestamp}
			} = action;

			const {table, workspaceConfigId} = properties;

			if (workspaceConfigId) return;

			dispatch(LIST_SCROLL_UPDATED, {
				table,
				timestamp
			});
		},
		stopPropagation: true
	},
	[NOW_GRID_POPOVER_CLOSED]: {
		effect: ({updateState, action}) => {
			const {
				payload: {popoverTemplateName = ''}
			} = action;

			switch (popoverTemplateName) {
				case inlineEditTemplateName:
				case inlineDependentTemplateName:
				case inlineTagsTemplateName: {
					updateState({
						inlineEditorPrefetchState: {}
					});
					break;
				}
				default:
					break;
			}
		},
		stopPropagation: true
	},
	[TAG_CLICKED]: {
		effect(coeffects) {
			const {canEdit, tagId} = coeffects.action.payload;
			const {dispatch} = coeffects;
			dispatch(OPEN_MODAL, {
				modalProps: {
					type: MODAL_TYPES.EDIT_TAG,
					tagId,
					canEdit
				}
			});
		},
		stopPropagation: true
	},
	[TEXT_LINK_CLICKED]: {
		effect: handleTextLinkClicked,
		stopPropagation: true
	},
	...resetScrollActionHandler
};
