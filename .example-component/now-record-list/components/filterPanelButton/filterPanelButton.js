import '@servicenow/now-badge';
import '@servicenow/now-button';

import {addRetainedElement} from '@devsnc/sn-list-commons';
import {t} from 'sn-translate';

import {FILTER_BUTTON_CLICKED, PANEL_TYPE_FILTER} from '../../constants';

export const createFilterPanelButton = (properties, dispatch) => {
	const {count, panelOpened, panelConfig, size, variant} = properties;

	const isFilterPanelOpen =
		panelOpened && panelConfig.panelType === PANEL_TYPE_FILTER;

	let filterDescription;
	if (isFilterPanelOpen) {
		if (count >= 2) {
			filterDescription = t('Hide filter panel ({0} conditions)', count);
		} else {
			filterDescription = t('Hide filter panel ({0} condition)', count);
		}
	} else {
		if (count >= 2) {
			filterDescription = t('Show filter panel ({0} conditions)', count);
		} else {
			filterDescription = t('Show filter panel ({0} condition)', count);
		}
	}

	const ariaConfig = {
		'aria-haspopup': 'dialog',
		'aria-label': filterDescription
	};

	return (
		<div
			className={`sn-record-list-header-toolbar-button-filter-panel -${size}`}>
			<div className={`with-badge ${count > 9 ? 'badged' : ''}`}>
				<now-button
					icon-name="filter-outline"
					size={size}
					variant={variant}
					tooltip-content={filterDescription}
					config-aria={ariaConfig}
					ref={el => {
						if (el) {
							const button = el.shadowRoot.querySelector('button');
							addRetainedElement('filterPanelButton', button);
						}
					}}
					on-click={() => {
						dispatch(FILTER_BUTTON_CLICKED);
					}}
				/>
				{count > 0 ? (
					<now-badge
						size="sm"
						status="info"
						value={count}
						variant="secondary"
						round
					/>
				) : null}
			</div>
		</div>
	);
};
