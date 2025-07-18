export default (operands) => {
	const arr = operands[0];

	if (!Array.isArray(arr)) {
		return null;
	}

	return arr.reduce((acc, item) => {
		return Number.isFinite(item) ? acc + item : acc;
	}, 0);
};
