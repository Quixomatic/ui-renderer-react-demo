export const keys = (operands) => {
	if (operands.length < 1 || typeof operands[0] !== 'object' || !operands[0]) {
		return null;
	}

	const [obj] = operands;

	return Object.keys(obj);
};

export const values = (operands) => {
	if (operands.length < 1 || typeof operands[0] !== 'object' || !operands[0]) {
		return null;
	}

	const [obj] = operands;

	return Object.values(obj);
};

export const entries = (operands) => {
	if (operands.length < 1 || typeof operands[0] !== 'object' || !operands[0]) {
		return null;
	}

	const [obj] = operands;

	return Object.entries(obj);
};

export const withCT = (operands) => {
	if (
		operands.length < 3 ||
		typeof operands[0] !== 'object' ||
		!operands[0] ||
		typeof operands[1] !== 'string'
	) {
		return null;
	}

	const [obj, key, value] = operands;

	return {
		...obj,
		[key]: value
	};
};
