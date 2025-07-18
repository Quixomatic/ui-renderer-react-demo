import {isArray} from '@devsnc/snowdash';

export default (operands) => (isArray(operands) ? operands.join('') : '');
