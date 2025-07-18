import get from 'lodash/get';
import {propertyTypes} from '../constants';
const {ENV_BINDING} = propertyTypes;

function createEnv(env = {}, prev = null) {
	return function (uxValue) {
		if (uxValue.type !== ENV_BINDING) {
			return null;
		}

		const [name, ...path] = uxValue.binding.address;

		if (!(name in env) && prev) {
			return prev(uxValue);
		}

		if (name in env) {
			const val = env[name];
			return path?.length > 0 ? get(val, path) : val;
		}

		return null;
	};
}

export default createEnv;

export const withEnv = (resolvers, env) => {
	return createEnv(env, resolvers[ENV_BINDING]);
};
