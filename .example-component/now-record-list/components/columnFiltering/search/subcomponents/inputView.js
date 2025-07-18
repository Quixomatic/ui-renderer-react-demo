import '@devsnc/sn-record-input';
import '@servicenow/now-icon';
import {t} from 'sn-translate';

import {
	COL_FILTER_APPLY_BUTTON_CLICKED,
	COL_FILTER_INPUT_SEARCH_UPDATED,
	ENTER_KEY
} from '../../constants';

const FilterInputView = ({properties}, dispatch) => {
	const {inputValue} = properties;

	return (
		<div className="input-container">
			<sn-record-input
				label={t('Contains')}
				value={inputValue}
				onValueChange={e => {
					dispatch(COL_FILTER_INPUT_SEARCH_UPDATED, e.value);
				}}
				onKeyPress={e => {
					if (e.key === ENTER_KEY) {
						dispatch(COL_FILTER_APPLY_BUTTON_CLICKED);
						e.stopPropagation();
					}
				}}>
				<now-icon slot="controls" icon="magnifying-glass-outline" size="md" />
			</sn-record-input>
		</div>
	);
};

export default FilterInputView;
