import {runOperator, pick, isValidOp, correctArgLengthForOp} from './utils';

export default (operator, operands) => {
	const arr = operands[0];
	if (
		!isValidOp(operator) ||
		!correctArgLengthForOp(operator, operands.length)
	) {
		return false;
	}
	const path = operands[1];

	if (!path) {
		return false;
	}

	const value = operands[2];

	if (!Array.isArray(arr)) {
		return null;
	}

	return arr.some((item) => runOperator(operator, pick(item, path), value));
};
