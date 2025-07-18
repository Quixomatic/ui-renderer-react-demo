import './listboxItem/listboxItem';
import {LISTBOX_ITEM_ID_PREFIX} from './constants';

const ListBox = state => {
	const {
		behaviors: {
			listboxKeyControls: {currentFocused}
		},
		componentId,
		properties: {choices, selectedChoices, highlightValue, label}
	} = state;

	const activedescendant =
		currentFocused >= 0 ? LISTBOX_ITEM_ID_PREFIX + currentFocused : '';
	const itemProps = {
		currentFocused,
		highlightValue,
		selectedChoices
	};

	return (
		<ul
			id={`listbox-${componentId}`}
			className="listbox"
			aria-activedescendant={activedescendant}
			aria-label={label}
			aria-multiselectable="true"
			role="listbox">
			{choices.map((model, index) => renderItem({...itemProps, index, model}))}
		</ul>
	);
};

const renderItem = ({
	model,
	index,
	selectedChoices,
	highlightValue,
	currentFocused
}) => {
	const isSelected = selectedChoices.indexOf(model.rawValue) !== -1;
	const focused = currentFocused === index;
	const key = `ITEM${JSON.stringify(model)}`;

	const itemProps = {
		focused,
		highlightValue,
		index,
		model,
		isSelected,
		key
	};

	return <sn-record-list-column-filter-choice-listbox-item {...itemProps} />;
};

export default ListBox;
