import {pick} from './utils';

export default (operands) => {
	if (operands.length < 1) {
		return null;
	}

	const arr = operands[0] ?? null;

	if (operands.length < 2) {
		return arr;
	}

	if (!Array.isArray(arr)) {
		return null;
	}

	return arr.map((item) => pick(item, operands[1]));
};
