export const replace = (operands) => {
	if (operands.length < 3) {
		return null;
	}

	const [val, pattern, replaceWith] = operands;

	if (
		typeof val !== 'string' ||
		typeof replaceWith !== 'string' ||
		typeof pattern !== 'string'
	) {
		return null;
	}

	return val.replace(new RegExp(pattern), replaceWith);
};

const _replaceAll = (str, pattern, replacement) => {
	let result = str;
	let index = result.indexOf(pattern);
	while (index > -1) {
		result = result.replace(pattern, replacement);
		index = result.indexOf(pattern);
	}
	return result;
};

export const replaceAll = (operands) => {
	if (operands.length < 3) {
		return null;
	}

	const [val, pattern, replaceWith] = operands;

	if (
		typeof val !== 'string' ||
		typeof replaceWith !== 'string' ||
		typeof pattern !== 'string'
	) {
		return null;
	}

	return _replaceAll(val, pattern, replaceWith);
};

const fallback = () => null;

export const trim = (mode, operands) => {
	if (operands.length < 1 || typeof operands[0] !== 'string') {
		return null;
	}

	const [val] = operands;

	switch (mode) {
		case 'both':
			return val.trim();
		case 'end':
			return val.trimEnd();
		case 'start':
			return val.trimStart();
		default:
			return fallback();
	}
};

export const uppercase = (operands) => {
	if (operands.length < 1 || typeof operands[0] !== 'string') {
		return null;
	}

	const [val] = operands;
	return val.toUpperCase();
};

export const lowercase = (operands) => {
	if (operands.length < 1 || typeof operands[0] !== 'string') {
		return null;
	}

	const [val] = operands;
	return val.toLowerCase();
};
