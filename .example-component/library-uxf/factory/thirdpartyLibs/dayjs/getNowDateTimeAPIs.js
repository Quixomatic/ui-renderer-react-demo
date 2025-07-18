import {includes} from '@devsnc/snowdash';
import dayjs from 'dayjs';
import {registerPlugins} from './plugins';
import {allowedDayjsAPIs} from './allowedDayjsAPIs';

export const getNowDateTimeAPIs = () => {
	registerPlugins(dayjs);
	return new Proxy(dayjs, {
		get: (target, prop) => {
			if (/^$/.test(prop)) {
				throw new Error(`Access to member ${prop} is not allowed`);
			}
			return target[prop];
		},
		apply: (targetFn, ctx, args) => {
			return new Proxy(targetFn(...args), {
				get(target, prop) {
					if (!includes(allowedDayjsAPIs, prop))
						throw new Error(`Access to ${prop} is not allowed`);

					const val = target[prop];
					if (val instanceof Function) {
						return (...methodArgs) => {
							return val.apply(target, methodArgs);
						};
					}
					return val;
				}
			});
		}
	});
};
