import resolveWith from '../resolveWith';
import {withEnv} from '../env';
import {propertyTypes} from '../../constants';

const {ENV_BINDING} = propertyTypes;

export default (operands, resolvers, repeaterItem) => {
	if (operands.length < 3) {
		return operands[0] ?? null;
	}

	const [arr, state, expr] = operands;

	const resolvedArr = resolveWith(resolvers, arr, repeaterItem);
	if (!Array.isArray(resolvedArr)) {
		return null;
	}
	const resolvedState = resolveWith(resolvers, state, repeaterItem);

	return resolvedArr.reduce((acc, it) => {
		return resolveWith(
			{
				...resolvers,
				[ENV_BINDING]: withEnv(resolvers, {it: it, acc})
			},
			expr,
			repeaterItem
		);
	}, resolvedState);
};
