import runUnaryFn from './unary';
import resolveWith from './resolveWith';
import {propertyTypes} from '../constants';
import {identity} from '@devsnc/snowdash';

const {RUNTIME_INLINE_SCRIPT} = propertyTypes;

const resolveForUnary = (resolvers, uxValue, repeaterItem) => {
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
	const {operator, operand} = operation;
	const value = resolveForUnary(resolvers, operand, repeaterItem);
	return runUnaryFn(operator, value);
};
