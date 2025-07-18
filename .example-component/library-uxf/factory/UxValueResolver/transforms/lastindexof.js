export default (operands) => {
	if (
		!Array.isArray(operands) ||
		operands.length < 2 ||
		(typeof operands[0] !== 'string' && !Array.isArray(operands[0]))
	) {
		return null;
	}

	const [val, valueToFind] = operands;

	return val.lastIndexOf(valueToFind);
};
