import '@devsnc/sn-record-input';
import '@servicenow/now-button';
import '@servicenow/now-icon';
import {t} from 'sn-translate';

import {
	CHOICE_FILTER_CLEAR_INPUT_VALUE,
	COL_FILTER_INPUT_CHOICE_UPDATED
} from '../../constants';

const FilterInputView = ({properties}, dispatch) => {
	const {inputValue} = properties;
	return (
		<sn-record-input
			value={inputValue}
			placeholder={t('Filter choices')}
			onValueChange={e => {
				dispatch(COL_FILTER_INPUT_CHOICE_UPDATED, e.value);
			}}>
			<now-icon slot="left" icon="magnifying-glass-outline" size="md" />
			{inputValue && inputValue.length >= 1 ? (
				<now-button
					slot="controls"
					icon-name="close-outline"
					aria-label="Clear Current Filter"
					size="md"
					variant="tertiary"
					bare
					on-click={() => {
						dispatch(CHOICE_FILTER_CLEAR_INPUT_VALUE, '');
					}}
				/>
			) : null}
		</sn-record-input>
	);
};

export default FilterInputView;
