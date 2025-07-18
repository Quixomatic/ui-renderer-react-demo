import '@servicenow/now-modal';
import {createCustomElement} from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';
import get from 'lodash/get';
import {t} from 'sn-translate';

import {
	ADVANCED_VIEW_SET_QUERY,
	CANCEL_BUTTON_ID,
	CANCEL_LABEL,
	CLOSE_MODAL,
	CONDITION_BUILDER_ENCODED_QUERY_SET,
	METRIC_TRACKED,
	MODAL_ACTIONS,
	NOW_COMPARISON_ROW_VALUE_STAGED,
	UPDATE_BUTTON_ID,
	UPDATE_LABEL
} from '../../constants';
import {UPDATE_ADVANCE_FILTER_EVENT} from '../../utils/metrics/constants';

import styles from './styles.scss';

const advancedViewModalTitle = t('Advanced View');

const updateAndClose = (
	dispatch,
	updateState,
	{encodedQuery, querySerializing, updateRequested}
) => {
	if (updateRequested) return;
	if (querySerializing) {
		updateState({updateRequested: true});
		return;
	}
	dispatch(METRIC_TRACKED, {
		eventName: UPDATE_ADVANCE_FILTER_EVENT,
		metadata: {}
	});

	dispatch(ADVANCED_VIEW_SET_QUERY, {
		query: encodedQuery
	});

	dispatch(CLOSE_MODAL);
};

const footerActionClickedEffect = coeffects => {
	const {action, state, dispatch, properties, updateState} = coeffects;

	const id = get(action, 'payload.action.id', '');

	if (id === UPDATE_BUTTON_ID && state.conditionBuilderFormDirty) {
		updateAndClose(dispatch, updateState, state, properties);
	} else {
		dispatch(CLOSE_MODAL);
	}
};

const view = state => {
	const {
		properties: {
			listTitle,
			query,
			table,
			useNewConditionBuilder,
			userRoles,
			shouldExcludeOperators
		},
		updateRequested
	} = state;

	const footerButtons = [
		{
			label: UPDATE_LABEL,
			variant: 'primary',
			tooltipContent: UPDATE_LABEL,
			id: UPDATE_BUTTON_ID,
			disabled: updateRequested,
			configAria: {'aria-label': UPDATE_LABEL}
		},
		{
			label: CANCEL_LABEL,
			variant: 'secondary',
			tooltipContent: CANCEL_LABEL,
			id: CANCEL_BUTTON_ID,
			disabled: updateRequested,
			configAria: {'aria-label': CANCEL_LABEL}
		}
	];

	import('@servicenow/now-condition-builder');

	return (
		<now-modal
			size="lg"
			header-label={advancedViewModalTitle}
			manage-opened
			opened={true}
			footerActions={footerButtons}>
			<div className="condition-builder-wrapper">
				{useNewConditionBuilder ? (
					<now-condition-builder-connected
						tableName={table}
						tableLabel={listTitle}
						encodedQuery={query}
						hideRelatedListQueryConditions={true}
						hideFilterOverview={true}
						hideSortBy={true}
						userRoles={userRoles}
						shouldExcludeOperators={shouldExcludeOperators}
					/>
				) : (
					<now-condition-builder
						tableName={table}
						tableLabel={listTitle}
						encodedQuery={query}
						hideRelatedListQueryConditions={true}
						hideFilterOverview={true}
						legacy={true}
					/>
				)}
			</div>
		</now-modal>
	);
};

createCustomElement('sn-record-list-modal-advanced-view', {
	renderer: {
		type: snabbdom,
		view
	},
	initialState: {
		encodedQuery: '',
		conditionBuilderFormDirty: false,
		querySerializing: false,
		updateRequested: false
	},
	properties: {
		encodedListQuery: {
			default: ''
		},
		fixedQuery: {
			default: {}
		},
		listTitle: {
			default: ''
		},
		relatedListName: {
			default: ''
		},
		table: {
			default: ''
		},
		query: {
			default: ''
		},
		useNewConditionBuilder: {
			default: true,
			schema: {
				type: 'boolean'
			}
		},
		userRoles: {
			default: []
		},
		shouldExcludeOperators: {
			default: false
		}
	},
	actionHandlers: {
		[MODAL_ACTIONS.FOOTER_ACTION_CLICKED]: {
			effect: footerActionClickedEffect,
			stopPropagation: true
		},
		[MODAL_ACTIONS.OPENED_SET]: {
			effect: footerActionClickedEffect,
			stopPropagation: true
		},
		[NOW_COMPARISON_ROW_VALUE_STAGED]: {
			effect: ({updateState}) => {
				updateState({querySerializing: true});
			},
			stopPropagation: true
		},
		[CONDITION_BUILDER_ENCODED_QUERY_SET]: {
			effect: ({dispatch, action, state, properties, updateState}) => {
				const stateChanges = {
					encodedQuery: action.payload.value,
					conditionBuilderFormDirty: true,
					querySerializing: false,
					updateRequested: false
				};

				if (state.updateRequested)
					updateAndClose(
						dispatch,
						updateState,
						Object.assign({}, state, stateChanges),
						properties
					);

				updateState(stateChanges);
			},
			stopPropagation: true
		}
	},
	styles
});
