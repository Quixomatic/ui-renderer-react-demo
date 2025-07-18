import get from 'lodash/get';

import {BEHAVIOR_PATH} from '../../../components/nowGrid/a11yColumnReorder/a11yColumnReorder';

export const getA11yColumnReorderIndexes = state => {
	const colDragDropIndexes = get(state, BEHAVIOR_PATH, {
		startingColumnIndex: -1,
		endingColumnIndex: -1,
		dragInitiated: false,
		destinationColumnIndex: -1
	});
	return colDragDropIndexes;
};

export const isElementInViewport = (parent, elem) => {
	const elemRect = elem.getBoundingClientRect();
	const parentRect = parent.getBoundingClientRect();
	return (
		elemRect.top >= parentRect.top &&
		elemRect.left >= parentRect.left &&
		elemRect.bottom <= parentRect.bottom &&
		elemRect.right <= parentRect.right
	);
};

export const scrollIntoView = element =>
	element.scrollIntoView({block: 'nearest'});
