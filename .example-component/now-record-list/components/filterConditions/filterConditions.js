import '@servicenow/now-button';
import '@servicenow/now-record-list-filter-panel';
import {createCustomElement} from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import {t} from 'sn-translate';

import {
	BUTTON_CLICKED,
	CLOSE_FILTER_PANEL,
	END_QUERY_DELIMITER,
	LIST_RESTORE_DEFAULTS,
	METRIC_TRACKED,
	MODAL_TYPES,
	OPEN_MODAL
} from '../../constants';
import {
	LAUNCH_ADVANCE_FILTER_EVENT,
	RESTORE_DEFAULT_FILTER_EVENT
} from '../../utils/metrics/constants';

import styles from './filterConditions.scss';

const ADVANCED_VIEW = t('Advanced view');
const RESTORE_DEFAULTS = t('Restore defaults');

const restoreDefaultsComponentName = 'RESTORE_DEFAULTS';
const advancedViewComponentName = 'ADVANCED_VIEW';

const restoreDefaults = (dispatch, properties) => {
	dispatch(CLOSE_FILTER_PANEL);
	dispatch(LIST_RESTORE_DEFAULTS, {
		originalConditions: properties.originalConditions
	});
	dispatch(METRIC_TRACKED, {
		eventName: RESTORE_DEFAULT_FILTER_EVENT,
		metadata: {}
	});
};

const onSelectAdvancedView = props => {
	const {dispatch} = props;
	dispatch(OPEN_MODAL, {
		modalProps: {
			type: MODAL_TYPES.ADVANCED_VIEW,
			...props
		}
	});
	dispatch(METRIC_TRACKED, {
		eventName: LAUNCH_ADVANCE_FILTER_EVENT,
		metadata: {}
	});
};

const stripQueryDelimiter = query => {
	return query.endsWith(END_QUERY_DELIMITER)
		? query.slice(0, -END_QUERY_DELIMITER.length)
		: query;
};

const isOriginal = (query, originalConditions) => {
	//query can be an empty object or empty string
	if (isEmpty(query) && isEmpty(originalConditions)) {
		return true;
	}
	return isEqual(
		stripQueryDelimiter(query),
		stripQueryDelimiter(originalConditions)
	);
};

const view = state => {
	const {properties} = state;
	const {
		loading,
		parsedQueryModel,
		query,
		hidePanelFooter,
		hidePanelRestore,
		hidePanelAdvanced,
		hidePanelConditionDelete,
		originalConditions
	} = properties;

	const disableRestoreDefaults =
		loading || isOriginal(query, originalConditions);
	const advancedDisabled = loading ? 'is-disabled' : '';

	return (
		<div className="filter-conditions" id="filterPanelBody">
			<div className="filter-conditions-body" aria-live="polite">
				<now-record-list-filter-panel
					query-model={parsedQueryModel}
					hide-pills={loading}
					hide-panel-condition-delete={hidePanelConditionDelete}
				/>
			</div>
			{!hidePanelFooter ? (
				<div className="filter-conditions-footer">
					{!hidePanelRestore ? (
						<div className="filter-conditions-footer-button">
							<now-button
								component-name={restoreDefaultsComponentName}
								className="filter-conditions-footer-btn"
								label={RESTORE_DEFAULTS}
								variant="tertiary"
								size="md"
								disabled={disableRestoreDefaults}
								config-aria={{'aria-label': `${RESTORE_DEFAULTS}`}}
							/>
						</div>
					) : null}
					{!hidePanelAdvanced ? (
						<div className="filter-conditions-footer-button">
							<now-button
								component-name={advancedViewComponentName}
								className={`filter-conditions-footer-btn ${advancedDisabled}`}
								label={ADVANCED_VIEW}
								variant="tertiary"
								size="md"
								disabled={loading}
								config-aria={{'aria-haspopup': 'dialog'}}
							/>
						</div>
					) : null}
				</div>
			) : null}
		</div>
	);
};

const buttonClickedEffect = ({dispatch, action, state}) => {
	const {
		meta: {componentName}
	} = action;

	switch (componentName) {
		case restoreDefaultsComponentName:
			{
				const {properties} = state;
				restoreDefaults(dispatch, properties);
			}
			return;
		case advancedViewComponentName:
			{
				const {
					properties: {query, fixedQuery, relatedListName, table}
				} = state;

				const advancedViewProps = {
					dispatch,
					query,
					fixedQuery,
					relatedListName,
					table
				};
				onSelectAdvancedView(advancedViewProps);
			}
			return;
		default:
			return;
	}
};

createCustomElement('filter-conditions', {
	renderer: {
		type: snabbdom,
		view
	},
	properties: {
		fixedQuery: {default: {}},
		hidePanelAdvanced: {default: {}},
		hidePanelConditionDelete: {default: {}},
		hidePanelFooter: {default: {}},
		hidePanelRestore: {default: {}},
		loading: {default: true},
		originalConditions: {default: ''},
		parsedQueryModel: {default: {}},
		query: {
			default: ''
		},
		relatedListName: {default: ''},
		table: {default: ''}
	},
	styles,
	actionHandlers: {
		[BUTTON_CLICKED]: {
			effect: buttonClickedEffect,
			stopPropagation: true
		}
	}
});
