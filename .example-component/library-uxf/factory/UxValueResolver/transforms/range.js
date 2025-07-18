export default (operands) => {
	if (operands.length < 2) {
		return [];
	}

	const arr = [];
	const start = operands[0] ?? 0;
	const end = operands[1] ?? 0;

	if (typeof start !== 'number' || typeof end !== 'number' || start === end) {
		return [];
	}

	if (end < start) {
		for (let x = start; x >= end; x = x - 1) {
			arr.push(x);
		}
	} else {
		for (let x = start; x <= end; x = x + 1) {
			arr.push(x);
		}
	}

	return arr;
};
