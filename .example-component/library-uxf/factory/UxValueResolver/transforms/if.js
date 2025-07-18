import {isArray} from '@devsnc/snowdash';

export default (operands) => {
	if (isArray(operands) && operands.length === 3) {
		if (operands[0]) {
			return operands[1] ?? null;
		} else {
			return operands[2] ?? null;
		}
	} else {
		return null;
	}
};
