import {runOperator, pick, isValidOp, correctArgLengthForOp} from './utils';

export default (operator, operands) => {
	const arr = operands[0];
	if (
		!isValidOp(operator) ||
		!correctArgLengthForOp(operator, operands.length)
	) {
		return false;
	}
	if (operands.length < 2) {
		return arr;
	}
	const path = operands[1];
	const value = operands[2];

	if (!Array.isArray(arr)) {
		return null;
	}

	return arr.every((item) => runOperator(operator, pick(item, path), value));
};
