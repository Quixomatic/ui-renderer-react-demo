export const stringify = (operands) => {
	try {
		return JSON.stringify(operands[0]);
	} catch (e) {
		return null;
	}
};

export const parse = (operands) => {
	if (typeof operands[0] !== 'string') {
		return null;
	}
	try {
		return JSON.parse(operands[0]);
	} catch (e) {
		return null;
	}
};
