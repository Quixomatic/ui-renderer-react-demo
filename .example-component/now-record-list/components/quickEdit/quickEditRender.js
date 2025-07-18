import '@servicenow/now-icon';
import {t} from 'sn-translate';

import {QUICK_EDIT_CLICKED} from '../../constants';
import getTooltip from '../../utils/tooltipUtil';

export const renderQuickEdit = ({
	dispatch,
	rowDisplayValue,
	rowSysId,
	invisibleControlClass
}) => {
	const ariaLabel = t('Open preview of {0}', rowDisplayValue);
	const ttLabel = t('Open preview');

	const clickHandler = () => {
		dispatch(QUICK_EDIT_CLICKED, {
			quickEditSysId: rowSysId
		});
	};

	return (
		<button
			aria-label={ariaLabel}
			className={`quick-edit-button ${invisibleControlClass}`}
			on-click={evt => clickHandler(evt)}
			data-ariadescribedby={ttLabel}
			data-tooltip={ttLabel}
			{...getTooltip(dispatch)}>
			<span className="info-icon" aria-hidden="true">
				<now-icon icon="circle-info-outline" size="sm"></now-icon>
			</span>
		</button>
	);
};
