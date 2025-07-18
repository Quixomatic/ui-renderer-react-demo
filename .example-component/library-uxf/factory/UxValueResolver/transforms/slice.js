export default (operands) => {
	if (
		!Array.isArray(operands) ||
		operands.length < 2 ||
		(typeof operands[0] !== 'string' && !Array.isArray(operands[0])) ||
		typeof operands[1] !== 'number'
	) {
		return null;
	}

	const [val, start, end] = operands;

	return val.slice(start, typeof end === 'number' ? end : undefined);
};
