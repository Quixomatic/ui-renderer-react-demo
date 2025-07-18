import {get} from '@devsnc/snowdash';

export const isEmpty = (val) => val === undefined || val === null;

export const pick = (item, path) => get(item, path, null);

export const ops = {
	EQ: 'EQ',
	NEQ: 'NEQ',
	GT: 'GT',
	GTE: 'GTE',
	LT: 'LT',
	LTE: 'LTE',
	EMPTY: 'EMPTY',
	NOTEMPTY: 'NOTEMPTY',
	ONEOF: 'ONEOF',
	NOTONEOF: 'NOTONEOF'
};

export const isValidOp = (operator) => Object.values(ops).includes(operator);

export const correctArgLengthForOp = (operator, length) => {
	switch (operator) {
		case ops.EQ:
		case ops.NEQ:
		case ops.GT:
		case ops.GTE:
		case ops.LT:
		case ops.LTE:
		case ops.ONEOF:
		case ops.NOTONEOF:
			return length === 3;
		case ops.EMPTY:
		case ops.NOTEMPTY:
			return length === 2;
	}
};

export const runOperator = (operator, left, right) => {
	switch (operator) {
		case ops.EQ:
			return left === right;
		case ops.NEQ:
			return left !== right;
		case ops.GT:
			return left > right;
		case ops.GTE:
			return left >= right;
		case ops.LT:
			return left < right;
		case ops.LTE:
			return left <= right;
		case ops.EMPTY:
			return isEmpty(left);
		case ops.NOTEMPTY:
			return !isEmpty(left);
		case ops.ONEOF:
			return right.includes(left);
		case ops.NOTONEOF:
			return !right.includes(left);
	}
};
