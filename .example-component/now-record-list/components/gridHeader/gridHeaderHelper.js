import get from 'lodash/get';

/**
 * This function flattens the columns and its subcolumns and builds an array of rows
 * @param {array} columns
 * @param {boolean} hasButtons
 */
export const buildListHeader = (columns, hasButtons) => {
	let newColumnProps = new WeakMap();
	const {depth, headerRows} = buildHeaderRows(columns, newColumnProps);

	columns.forEach(column => {
		const col = get(column, 'column', column);
		calculateColSpan(col, newColumnProps);
		calculateRowSpan(col, depth, newColumnProps);
	});

	if (!hasButtons) {
		const firstColumn = columns.values().next().value;
		styleFirstColumn(firstColumn, newColumnProps);
	}

	return {
		headerRows,
		newColumnProps
	};
};

/**
 * This function finds first subsequent subcolumn of the first column and updates column props with class name
 * @param {map} column
 * @param {map} columnProps
 */
export const styleFirstColumn = (column, columnProps) => {
	const props = columnProps.get(column);
	columnProps.set(column, {
		...props,
		class: 'sn-grid-row-first-cell'
	});
	const subColumns = get(column, 'subColumns', new Map());
	if (subColumns.size) {
		const firstSubColumn = subColumns.values().next().value;
		styleFirstColumn(firstSubColumn, columnProps);
	}
};

/**
 * This function calcuates colspan by counting number of subcolumns
 * @param {map} column
 * @param {map} columnProps
 */
export const calculateColSpan = (column, columnProps) => {
	const subColumns = get(column, 'subColumns', new Map());

	if (!subColumns.size) {
		columnProps.set(column, {...columnProps.get(column), colSpan: 1});
		return 1;
	}

	let length = 0;
	subColumns.forEach(
		subColumn => (length += calculateColSpan(subColumn, columnProps))
	);
	columnProps.set(column, {...columnProps.get(column), colSpan: length});

	return length;
};

/**
 * This function calculates rowspan of each cell using max depth of the list header and the cell level
 * @param {map} column
 * @param {number} maxDepth
 * @param {map} columnProps
 */
export const calculateRowSpan = (column, maxDepth, columnProps) => {
	const subColumns = get(column, 'subColumns', new Map());
	const props = columnProps.get(column);
	const rowSpan = subColumns.size == 0 ? maxDepth - props.level + 1 : 1;

	columnProps.set(column, {...props, rowSpan});

	subColumns.forEach(subColumn =>
		calculateRowSpan(subColumn, maxDepth, columnProps)
	);
};

/**
 * This function uses BFS to calculate the max depth or total number of rows in the list header
 * It also builds array of rows to render the list header
 * @param {array} columns
 * @param {map} columnProps
 */
export const buildHeaderRows = (columns, columnProps) => {
	if (!columns.size) return 0;

	let depth = 0;
	let queue = [];
	let headerRows = [];

	//Add top level columns to the queue
	[...columns.values()].map(column => {
		queue.push(column);
	});

	// Run BFS to calcuate level of each cell and max depth of the list header
	while (queue.length) {
		let length = queue.length;
		depth++;
		let row = new Map();
		while (length--) {
			const column = queue.shift();
			row.set(column.columnName, column);

			if (column.subColumns && column.subColumns.size > 0)
				queue = queue.concat([...column.subColumns.values()]);

			if (!columnProps.has(column)) columnProps.set(column, {level: depth});
		}
		// add rows to column groups array to render header rows
		headerRows.push({row: row});
	}
	return {depth, headerRows};
};

/**
 * This function checks if a column name is inside the list of filtered column names while accounting for referenceDisplayName
 * @param {Arary<String>} filteredColumnNames
 * @param {String} columnName
 * @param {String} referenceDisplayName
 */
export const checkIfFiltered = (
	filteredColumnNames,
	columnName,
	referenceDisplayName
) =>
	filteredColumnNames.some(filteredColumnName => {
		if (!filteredColumnName) return false;

		return (
			filteredColumnName === columnName ||
			filteredColumnName === `${columnName}.${referenceDisplayName}`
		);
	});
