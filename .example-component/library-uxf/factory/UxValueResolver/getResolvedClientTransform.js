import runTransformFn from './transforms';
import resolveWith from './resolveWith';
import {propertyTypes} from '../constants';
import {identity} from '@devsnc/snowdash';
import _let from './transforms/let';
import find from './transforms/find';
import map from './transforms/map';
import reduce from './transforms/reduce';

const {RUNTIME_INLINE_SCRIPT, LIST_CONTAINER} = propertyTypes;

const resolveForClientTransform = (resolvers, uxValue, repeaterItem = null) => {
	return resolveWith(
		{
			...resolvers,
			[RUNTIME_INLINE_SCRIPT]: identity // using script as one of operands is not allowed
		},
		uxValue,
		repeaterItem
	);
};

const isEnvTransformOperator = (operator) => {
	return ['MAP', 'FIND', 'REDUCE', 'LET'].includes(operator);
};

export default (resolvers, transform, repeaterItem = null) => {
	const {operator, operands: operandsUxValue} = transform;
	if (isEnvTransformOperator(operator)) {
		return resolveEnvTransformFn(
			operator,
			operandsUxValue,
			resolvers,
			repeaterItem
		);
	}
	const operands = resolveForClientTransform(
		resolvers,
		operandsUxValue,
		repeaterItem
	);
	return runTransformFn(operator, operands);
};

const resolveEnvTransformFn = (operator, operands, resolvers, repeaterItem) => {
	if (operands?.type !== LIST_CONTAINER) {
		return null;
	}
	const ops = operands.container;
	switch (operator) {
		case 'LET':
			return _let(ops, resolvers, repeaterItem);
		case 'FIND':
			return find(ops, resolvers, repeaterItem);
		case 'MAP':
			return map(ops, resolvers, repeaterItem);
		case 'REDUCE':
			return reduce(ops, resolvers, repeaterItem);
	}
};
