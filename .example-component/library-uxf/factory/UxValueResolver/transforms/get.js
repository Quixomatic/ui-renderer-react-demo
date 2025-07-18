import {pick} from './utils';

export default (operands) => {
	if (
		!Array.isArray(operands) ||
		operands.length < 1 ||
		typeof operands[0] !== 'object'
	) {
		return null;
	}

	const [obj, ...rest] = operands;

	if (rest.some((s) => typeof s !== 'string' && typeof s !== 'number')) {
		return null;
	}
	if (rest.length === 0) {
		return obj;
	}
	return pick(obj, rest);
};
