import resolveWith from '../resolveWith';
import {withEnv} from '../env';
import {propertyTypes} from '../../constants';

const {ENV_BINDING} = propertyTypes;

export default (operands, resolvers, repeaterItem) => {
	if (operands.length < 2) {
		return operands[0] ?? null;
	}

	const [arr, expr] = operands;

	const resolvedArr = resolveWith(resolvers, arr, repeaterItem);

	if (!Array.isArray(resolvedArr)) {
		return null;
	}
	return resolvedArr.find((item) => {
		return resolveWith(
			{
				...resolvers,
				[ENV_BINDING]: withEnv(resolvers, {it: item})
			},
			expr,
			repeaterItem
		);
	});
};
