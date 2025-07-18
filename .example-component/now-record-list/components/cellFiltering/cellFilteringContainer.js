import {
	activateFocusTrap,
	addRetainedElement,
	getAndClearRetainedFocus
} from '@devsnc/sn-list-commons';
import tooltipBehavior from '@servicenow/behavior-tooltip';
import truncationBehavior from '@servicenow/behavior-truncation';
import {createCustomElement} from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';
import get from 'lodash/get';
import {t} from 'sn-translate';

import cellFilterEventHandlers from '../../behaviors/cellFilterKeyEventHandlers';
import {dirtyBehavior} from '../../behaviors/dirtyBehavior/dirtyBehavior';
import {focusTrap} from '../../behaviors/focusTrap';
import {GRID_CELL_LIST, PROPERTIES_SET} from '../../constants';
import * as ListHelper from '../../utils/listHelper';
import styles from '../list/list.scss';

import actionHandlers from './cellFilteringActions';
import {CELL_FILTERING_OPTION_CLICKED} from './constants';

export const CELL_FILTERING_CONTAINER_COMPONENT_NAME =
	'sn-record-list-cell-filter';

const view = ({properties}, {dispatch}) => {
	const {listInstanceId, selectionIndex, menuInitialized, popover} = properties;
	const menuOptionBaseId = `${listInstanceId}-cell-filter-menu-option-`;
	const options = ListHelper.getOptions(GRID_CELL_LIST);
	const cellValue = get(popover, 'context.columnData.displayValue', '');
	const cellTextValue =
		cellValue === '' || cellValue === null ? 'empty value' : cellValue;
	return (
		<div
			role="menu"
			className="cell-filtering-container"
			aria-label={t('Cell Filter')}
			ref={el => {
				if (el && !menuInitialized) {
					addRetainedElement(listInstanceId);
					el.focus();
					dispatch(PROPERTIES_SET, {menuInitialized: true});
				}
			}}
			tabIndex="0"
			aria-activedescendant={menuOptionBaseId + selectionIndex}>
			{options.map((option, index) => (
				<a
					data-truncation
					className={`cell-filtering-button ${
						index === selectionIndex ? 'is-focus' : ''
					}`}
					key={index}
					id={menuOptionBaseId + index}
					role="menuitem"
					tabIndex="-1"
					aria-label={`${option.title}  ${cellTextValue}`}
					on-mouseover={() => {
						dispatch(PROPERTIES_SET, {selectionIndex: index});
					}}
					on-click={() => {
						dispatch(CELL_FILTERING_OPTION_CLICKED, {index});
					}}>
					{option.title}
				</a>
			))}
		</div>
	);
};

createCustomElement(CELL_FILTERING_CONTAINER_COMPONENT_NAME, {
	renderer: {
		type: snabbdom,
		view
	},
	properties: {
		listInstanceId: {default: ''},
		menuInitialized: {default: false},
		selectionIndex: {default: 0},
		popover: {
			onChange(newValue, oldValue, {dispatch}) {
				dispatch('PROPERTIES_SET', {menuInitialized: false});
			}
		}
	},
	behaviors: [focusTrap, dirtyBehavior, tooltipBehavior, truncationBehavior],
	actionHandlers,
	eventHandlers: cellFilterEventHandlers,
	onDisconnect(host) {
		getAndClearRetainedFocus(host.listInstanceId);
	},
	onConnect(host) {
		activateFocusTrap(host.listInstanceId, host);
	},
	styles
});

export default CELL_FILTERING_CONTAINER_COMPONENT_NAME;
