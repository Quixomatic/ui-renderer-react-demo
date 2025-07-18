/**
 * Return the direction of selection if the SHIFT key is used
 * @param {string} key The pressed key identifier.
 * @param {boolean} shift Boolean that indicates wheter or not shift was held.
 * @param {string} shiftDirection current state of shift direction
 */
function getShiftDirection(key, shift, shiftDirection) {
	// If the shift button is being used...
	if (shift) {
		// ...and we have do not have a direction already set, set the direction
		if (shiftDirection === '') {
			return key;

			// ...otherwise return the currently set direction
		} else {
			return shiftDirection;
		}

		// ...otherwise set the direction state to blank.
	} else {
		return '';
	}
}

/**
 * Return a list of indexes for selected items from keyboard arrow key inputs.
 * @param {string} key The pressed key identifier.
 * @param {boolean} shift Boolean that indicates wheter or not shift was held.
 * @param {string} shiftDirection Parameter for the shift direction.
 * @param {array} selectedItems The array of currently selected item indexes.
 * @param {integer} numberOfItems Total number of items available.
 * @return {array} Mutated selectedItems array.
 */
function getSelectedItems(
	key,
	shift,
	shiftDirection,
	selectedItems,
	numberOfItems
) {
	switch (key) {
		case 'ArrowUp':
			return getForwardListSelection(
				false,
				numberOfItems,
				selectedItems,
				shift,
				shiftDirection != 'ArrowDown',
				false
			);

		case 'ArrowDown':
			return getForwardListSelection(
				true,
				numberOfItems,
				selectedItems,
				shift,
				shiftDirection != 'ArrowUp',
				false
			);

		case 'ArrowLeft':
			return getReverseListSelection(
				true,
				numberOfItems,
				selectedItems,
				shift,
				shiftDirection != 'ArrowRight',
				false
			);

		case 'ArrowRight':
			return getReverseListSelection(
				false,
				numberOfItems,
				selectedItems,
				shift,
				shiftDirection != 'ArrowLeft',
				true
			);

		default:
			return [];
	}
}

/**
 * Generic utility for selecting items in a list going from the beginning
 * @param {boolean} isForward flag if we are traversing the list forward or back.
 * @param {number} numberOfItems total amount of items in the list we are traversing.
 * @param {array} currentlySelectedIndexes The array of currently selected item indexes.
 * @param {boolean} isAccumulating flag if we are accumulating indexes or replacing them.
 * @param {boolean} isAccumulativeDirection flag if we are accumulating in the same direction as when started.
 * @param {boolean} allowNoSelection flag to allow clearing selection
 * @return {array} new array of selected indexes.
 */
function getForwardListSelection(
	isForward,
	numberOfItems,
	currentlySelectedIndexes,
	isAccumulating,
	isAccumulativeDirection,
	allowNoSelection
) {
	let numberSelected = currentlySelectedIndexes.length,
		firstItem = currentlySelectedIndexes[0],
		lastItem = currentlySelectedIndexes[currentlySelectedIndexes.length - 1],
		selectedItems = currentlySelectedIndexes.slice(0); // clone the array so we're not mutating anything.

	if (numberOfItems <= 0) {
		return [-1];
	}
	// If we are moving down the list...
	if (isForward) {
		// ...and nothing had been selected, return the first item
		if (numberSelected == 0) {
			return [0];
		} else {
			// ...otherwise there is something has been selected...
			// ...and the list is not accumulating...
			if (!isAccumulating) {
				// ... and we're not on the last item already, select the next item
				if (lastItem != numberOfItems - 1) return [lastItem + 1];
				else {
					// ... otherwise if we already do have the last item selected
					// ...and we allow clearing selection, then we return an empty selection
					if (allowNoSelection) return [];
					// ...otherwise we return the last item
					else return [lastItem];
				}
			} else {
				// ...or the list is accumulating...
				//...and I'm moving in the same direction as when I started
				if (isAccumulativeDirection) {
					//...and we're have not selected the last item, append next item to my selected list
					if (lastItem != numberOfItems - 1) selectedItems.push(lastItem + 1);

					// ...otherwise if we aren't moving in the same direction, but we have multiple items selected, remove an item
				} else if (numberSelected > 1) {
					selectedItems.shift();
				}
			}
		}
		//...
	} else {
		// If we are moving up the list...
		// ...and there items in the list...
		if (numberSelected > 0) {
			// ...and the list is not accumulating...
			if (!isAccumulating) {
				// ...and we've already selected the first item

				if (firstItem === 0) {
					// ...and we allow clearing selection, then we return an empty selection
					if (allowNoSelection) return [];
					// ...otherwise we return the first item
					else return [firstItem];
				} else {
					if (firstItem < 0)
						// if the first item is already -1 return it
						return [firstItem];
					// ...otherwise return the previous item
					else return [firstItem - 1];
				}
			} else {
				// ...otherwise if we are accumulating selections...
				// ...in the same direction as the current selection...
				if (isAccumulativeDirection) {
					// ...and the first item is not selected, add the previous item into the beginning of the selection
					if (firstItem !== 0) {
						selectedItems.unshift(firstItem - 1);
					}
				} else if (numberSelected > 1) {
					// ...and we're not moving in the same direction, but have multiple items selected, remote the last index
					selectedItems.pop();
				}
			}
		}
	}

	return selectedItems;
}

/**
 * Generic utility for selecting items in a list going from the end. Since the logic is the same, but the direction is opposite,
 * we can just reuse the getForwardListSelection logic, but just reversing the currentSelectionIndexes.
 * @param {boolean} isForward flag if we are traversing the list forward or back.
 * @param {number} numberOfItems total amount of items in the list we are traversing.
 * @param {array} currentlySelectedIndexes The array of currently selected item indexes.
 * @param {boolean} isAccumulating flag if we are accumulating indexes or replacing them.
 * @param {boolean} isAccumulativeDirection flag if we are accumulating in the same direction as when started.
 * @param {boolean} allowNoSelection flag to allow clearing selection
 * @return {array} new array of selected indexes.
 */
function getReverseListSelection(
	isForward,
	numberOfItems,
	currentlySelectedIndexes,
	isAccumulating,
	isAccumulativeDirection,
	allowNoSelection
) {
	// Reverse the current indexes
	let reversedSelection = reverseSelection(
		currentlySelectedIndexes,
		numberOfItems
	);

	// Get the new selection list from getForwardListSelection
	let reversedList = getForwardListSelection(
		isForward,
		numberOfItems,
		reversedSelection,
		isAccumulating,
		isAccumulativeDirection,
		allowNoSelection
	);

	// Reverse the new list again to get the actual selection
	let newSelection = reverseSelection(reversedList, numberOfItems);

	return newSelection;
}

/**
 * utility that reverses the selection indexes array.
 * @param {array} currentlySelectedIndexes The array of currently selected item indexes.
 * @param {integer} numberOfItems Total number of items available.
 * @return {array} new array of reversed indexes.
 */
function reverseSelection(currentlySelectedIndexes, numberOfItems) {
	if (!Array.isArray(currentlySelectedIndexes)) {
		throw Error('Valid source index array must be passed in.');
	}

	let numberSelected = currentlySelectedIndexes.length,
		lastItem = currentlySelectedIndexes[currentlySelectedIndexes.length - 1];

	if (
		numberSelected === 0 ||
		!numberOfItems ||
		typeof numberOfItems !== 'number' ||
		numberOfItems < 1
	)
		return [];
	let firstItem = numberOfItems - 1 - lastItem,
		reversedSelection = [firstItem];
	for (let i = 1; i < numberSelected; i++) {
		reversedSelection.push(firstItem + i);
	}
	return reversedSelection;
}

export {
	getShiftDirection,
	getSelectedItems,
	getForwardListSelection,
	getReverseListSelection,
	reverseSelection
};
