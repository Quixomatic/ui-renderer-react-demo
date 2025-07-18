import '@servicenow/now-button';
import {createCustomElement} from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';
import {t} from 'sn-translate';

import {BUTTON_CLICKED, TOGGLE_LIST_MENU} from '../../constants';

import styles from './slidingMenuButton.scss';

const view = ({properties: {menuOpened}}) => {
	const OPEN_MENU_TOOLTIP = t('Open List Menu');
	const CLOSE_MENU_TOOLTIP = t('Close List Menu');
	const toggleMenuTooltip = menuOpened ? CLOSE_MENU_TOOLTIP : OPEN_MENU_TOOLTIP;
	const icon = menuOpened ? 'list-hide-fill' : 'list-show-fill';
	const ariaConfig = {
		'aria-label': toggleMenuTooltip
	};

	return (
		<now-button
			bare
			tooltip-content={toggleMenuTooltip}
			config-aria={ariaConfig}
			icon-name={icon}
			size="md"
			variant="tertiary"
		/>
	);
};

createCustomElement('sn-record-list-header-button-slide-menu', {
	actionHandlers: {
		[BUTTON_CLICKED]: {
			effect: ({dispatch}) => {
				dispatch(TOGGLE_LIST_MENU);
			},
			stopPropagation: true
		}
	},
	properties: {
		menuOpened: {default: false}
	},
	renderer: {
		type: snabbdom,
		view
	},
	styles
});
