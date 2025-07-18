import lowerCase from 'lodash/lowerCase';

import {
	KEY_ENTER,
	KEY_SPACE,
	KEY_SPACEBAR
} from '../../cellFiltering/constants';
import {LISTBOX_ITEM_CLICKED} from '../constants';

const ListBoxItem = (state, {dispatch}) => {
	const {
		properties: {
			focused,
			highlightValue,
			index,
			isSelected,
			model: {displayValue, isDisabled, rawValue}
		}
	} = state;

	const ariaLabel = isSelected ? '✓ ' + displayValue : displayValue;
	const checkboxClass = ['checkbox-label', isSelected ? 'is-selected' : '']
		.join(' ')
		.trim();
	const itemClass = [
		'listbox-item',
		focused ? 'focused' : '',
		isDisabled ? 'is-disabled' : ''
	]
		.join(' ')
		.trim();

	return (
		<li
			aria-selected={isSelected ? 'true' : 'false'}
			aria-label={ariaLabel}
			className={itemClass}
			id={`listbox-item-${index}`}
			tabIndex="0"
			on-click={() =>
				dispatch(LISTBOX_ITEM_CLICKED, {index, rawValue, isDisabled})
			}
			on-keydown={e => {
				if (
					e.key === KEY_ENTER ||
					e.key === KEY_SPACE ||
					e.key === KEY_SPACEBAR
				) {
					dispatch(LISTBOX_ITEM_CLICKED, {index, rawValue, isDisabled});
				}
			}}
			role="option">
			<span className="checkbox">
				<i aria-hidden="true" className={checkboxClass}></i>
			</span>
			<span data-truncation className="displayValue">
				{highlight(displayValue, highlightValue)}
			</span>
		</li>
	);
};

const highlight = (displayValue, filterValue) => {
	const matchLocation = lowerCase(displayValue).indexOf(lowerCase(filterValue));

	if (!filterValue || matchLocation === -1)
		return <span data-truncation>{displayValue}</span>;

	const displayValueParts = [
		displayValue.substring(0, matchLocation),
		filterValue,
		displayValue.substring(matchLocation + filterValue.length)
	];

	return (
		<span data-truncation>
			{displayValueParts.map(text => (
				<span>{text}</span>
			))}
		</span>
	);
};

export default ListBoxItem;
