// helpers expose the browser APIs for now, but may get swapped out for
// something that uses Seismic queues instead
import {isFunction} from '@devsnc/snowdash';

// native setTimeout/setInterval accept a code string that gets evaluated, but
// we don't want to allow this.
const ensureFunctionArg = (name) => (...args) => {
	if (isFunction(args[0])) {
		const timeoutFn = globalThis[name];
		return timeoutFn.apply(globalThis, args);
	} else {
		throw new TypeError(
			`${name} must be called with a function as the first argument`
		);
	}
};

export default {
	setTimeout: ensureFunctionArg('setTimeout'),
	setInterval: ensureFunctionArg('setInterval'),
	clearTimeout: (...args) => clearTimeout.apply(globalThis, args),
	clearInterval: (...args) => clearInterval.apply(globalThis, args)
};
