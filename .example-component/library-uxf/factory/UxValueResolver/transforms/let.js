import {withEnv} from '../env';
import resolveWith from '../resolveWith';
import {propertyTypes} from '../../constants';

const {ENV_BINDING} = propertyTypes;

// eslint-disable-file no-console
export default (operands, resolvers, repeaterItem) => {
	if (
		operands.length < 1 ||
		operands[0].type !== 'JSON_LITERAL' ||
		typeof operands[0].value !== 'string'
	) {
		return null;
	}
	if (operands.length < 3) {
		return null;
	}

	const val = resolveWith(resolvers, operands[1], repeaterItem);
	const newEnv = {[operands[0].value]: val};
	return resolveWith(
		{
			...resolvers,
			[ENV_BINDING]: withEnv(resolvers, newEnv)
		},
		operands[2],
		repeaterItem
	);
};
