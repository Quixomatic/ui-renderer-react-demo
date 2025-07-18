import {runOperator, pick, correctArgLengthForOp, isValidOp} from './utils';

export default (operator, operands) => {
	const arr = operands[0];
	if (
		!isValidOp(operator) ||
		!correctArgLengthForOp(operator, operands.length)
	) {
		return arr;
	}
	const path = operands[1];
	const value = operands[2];

	if (!Array.isArray(arr)) {
		return null;
	}

	return arr.filter((item) => runOperator(operator, pick(item, path), value));
};
