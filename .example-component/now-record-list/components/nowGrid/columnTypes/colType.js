import get from 'lodash/get';

export class ColType {
	constructor(column) {
		this.column = column;
	}

	field() {
		return get(this.column, 'columnName', 'string');
	}

	/**
	 * number (90), percent ("25%"), or function returning same (could created autosized columns based on data widths)
	 */
	width() {
		return ({column: {index}, props}) => {
			const initialWidth = get(
				props,
				`options.colResizing.columnSizesArray[${index}]`,
				-1
			);
			return initialWidth > 0 ? `${initialWidth}px` : 'auto';
		};
	}

	/**
	 * 'left', 'right', 'center' or function returning same
	 */
	textAlign() {
		return this.column.columnData.internalType === 'number' ? 'right' : 'left';
	}

	/**
	 * 'top', 'bottom', 'center' or function returning same
	 */
	verticalAlign() {
		return 'center';
	}

	/**
	 * Returns type of column. i.e String, date, reference, etc
	 */
	type() {
		return get(this.column, 'columnData.internalType', 'string');
	}

	isSortable() {
		return get(this.column, 'columnData.isSortable', true);
	}

	accessor() {
		return (row, column) => {
			return get(row, `${column.field}.columnData.displayValue`);
		};
	}
}
