import runBinaryFn from './binary';
import resolveWith from './resolveWith';
import {propertyTypes} from '../constants';
import {identity} from '@devsnc/snowdash';

const {RUNTIME_INLINE_SCRIPT} = propertyTypes;

const resolveForBinary = (resolvers, uxValue, repeaterItem) => {
	return resolveWith(
		{
			...resolvers,
			[RUNTIME_INLINE_SCRIPT]: identity
		},
		uxValue,
		repeaterItem
	);
};

export default (resolvers, operation, repeaterItem) => {
	const {operator, left: leftUxValue, right: rightUxValue} = operation;
	const left = resolveForBinary(resolvers, leftUxValue, repeaterItem);
	// Short circuit
	if (operator === 'AND' && !left) {
		return false;
	}
	if (operator === 'OR' && left == true) {
		return true;
	}

	const right = resolveForBinary(resolvers, rightUxValue, repeaterItem);
	return runBinaryFn(operator, left, right);
};
