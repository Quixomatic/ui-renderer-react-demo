import {t} from 'sn-translate';

import {CHECKBOX_CHECKED_SET} from '../../constants';
import getTooltip from '../../utils/tooltipUtil';

const focusHandler = evt => {
	const parent = evt.target.parentNode;
	parent.classList.add('is-focus');
};

const blurHandler = evt => {
	const parent = evt.target.parentNode;
	parent.classList.remove('is-focus');
	parent.classList.remove('checkbox-shift');
};

export const renderCheckBox = ({
	checkboxClasses,
	checkboxID,
	checked,
	rowDisplayValue,
	dispatch,
	sysId,
	allSysIds
}) => {
	const clickHandler = evt => {
		const isChecked = evt.target.checked;
		const label = evt.target.parentNode;
		const shiftKey = evt.shiftKey;
		if (isChecked) label.classList.add('is-selected');
		else label.classList.remove('is-selected');

		const newCheckedSysIdIndex = allSysIds?.indexOf(sysId) ?? sysId;

		dispatch(CHECKBOX_CHECKED_SET, {
			checked: isChecked,
			shiftKey,
			checkedRowIndex: newCheckedSysIdIndex,
			value: sysId,
			allSysIds,
			event: evt
		});
	};

	return (
		<div className="sn-grid-checkbox">
			<label className={checkboxClasses.join(' ')} htmlFor={checkboxID}>
				<input
					on-blur={blurHandler}
					on-click={clickHandler}
					on-focus={focusHandler}
					data-tooltip={t('Select record')}
					{...getTooltip(dispatch)}
					aria-label={t('Select record {0}', rowDisplayValue)}
					data-ariadescribedby={t('Select record')}
					id={checkboxID}
					type="checkbox"
					className="sn-grid-checkbox-native"
					checked={checked}
				/>
			</label>
		</div>
	);
};
