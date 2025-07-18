import {isEmpty} from './utils';

export default (operands) => {
	if (operands.length < 1) {
		return true;
	}

	return isEmpty(operands[0]);
};
