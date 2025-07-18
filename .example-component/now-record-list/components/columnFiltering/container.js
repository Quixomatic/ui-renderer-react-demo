import './advanced/advancedFilter';
import './choice/choiceFilter';
import './search/searchFilter';
import './value/valueFilter';
import {
	addRetainedElement,
	findActiveElement,
	updateFocusTrap
} from '@devsnc/sn-list-commons';
import rtlBehavior from '@servicenow/behavior-rtl';
import {createCustomElement} from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';
import isEmpty from 'lodash/isEmpty';
import {t} from 'sn-translate';

import {
	ADVANCED_FILTER,
	CHOICE_FILTER,
	FILTERS_OPERATED_VIA_VALUE_COMPONENT,
	SEARCH_FILTER,
	UPDATE_FOCUS_TRAP
} from '../../constants';
import {
	getColumnFilteringProps,
	isDataCurrent
} from '../columnFiltering/helpers';

import {CHOICE_FILTER_RESET} from './constants';

export const COLUMN_FILTERING_COMPONENT_NAME = 'sn-record-list-column-filter';

const view = state => {
	const {
		properties: {
			column: {filterType}
		}
	} = state;

	if (isEmpty(filterType)) return null;

	const filterProps = getColumnFilteringProps(state);
	const {
		column: {
			columnData: {label}
		}
	} = filterProps;

	return (
		<div
			role="dialog"
			aria-label={t('Filter {0} column', label)}
			style={{minHeight: '49px', minWidth: '100px'}}>
			{getFilterComponent(filterProps)}
		</div>
	);
};

const getFilterComponent = filterProps => {
	const {type} = filterProps;
	if (FILTERS_OPERATED_VIA_VALUE_COMPONENT.indexOf(type) !== -1) {
		return <sn-record-list-column-filter-value {...filterProps} />;
	} else if (type === ADVANCED_FILTER) {
		return <sn-record-list-column-filter-advanced {...filterProps} />;
	} else if (type === CHOICE_FILTER) {
		return (
			<sn-record-list-column-filter-choice
				/* below workaround for hook-update, it broke in seismic: DEF0057763 */
				hook={{
					update: isDataCurrent('column.columnName', CHOICE_FILTER_RESET)
				}}
				{...filterProps}
			/>
		);
	} else if (type === SEARCH_FILTER) {
		return <sn-record-list-column-filter-text {...filterProps} />;
	}
};

createCustomElement(COLUMN_FILTERING_COMPONENT_NAME, {
	renderer: {
		type: snabbdom,
		view
	},
	properties: {
		column: {},
		parsedQueryModel: {},
		filterId: {},
		isGrouped: {default: false},
		isFilterable: {default: true},
		isGroupable: {default: true},
		listInstanceId: {default: ''},
		hideColumnGrouping: {},
		hideColumnFiltering: {},
		table: {},
		nowTableReturnFocus: {default: () => {}},
		isGlideQuery: {default: true},
		nonGlideFilterProps: {},
		tableMetadata: {}
	},
	onConnect(host) {
		addRetainedElement(host.listInstanceId, findActiveElement());
	},
	actionHandlers: {
		[UPDATE_FOCUS_TRAP]: {
			effect: ({
				state: {
					properties: {listInstanceId}
				}
			}) => {
				updateFocusTrap(listInstanceId);
			},
			stopPropagation: true
		}
	},
	behaviors: [rtlBehavior]
});
