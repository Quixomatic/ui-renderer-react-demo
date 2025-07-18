import {isArray} from '@devsnc/snowdash';

export default (operands) =>
	isArray(operands) && isArray(operands[0]) && operands.length > 0
		? operands[0].length
		: 0;
