import {default as console} from '../utils/getLogger.js';

function lazyParser(parser) {
	return (src, name = '(anonymous)') => {
		let fn;
		return (...args) => {
			try {
				fn = fn || parser(src);
				return fn.apply(null, args);
			} catch (e) {
				console.error(`Could not evaluate function '${name}'`, e);
			}
		};
	};
}

/**
 * Creates an evaluator to run arbitrary code in a sandbox environment. All
 * global variables are set to `undefined` except those that are explicitly
 * allowed.
 */
export const createSandboxedEvaluator = (allowedGlobals) => {
	allowedGlobals = new Set(allowedGlobals);
	const proxy = new Proxy(
		{},
		{
			// prohibit variable access that is not part of `allowedGlobals`
			has: (target, key) => !allowedGlobals.has(key),

			// prohibit assignment to the proxy object itself
			set: () => false
		}
	);

	return lazyParser((src) => {
		const strictWrapper = `with(proxy){ return (function(){"use strict";\nreturn (${src});})() }`;
		return new Function('proxy', strictWrapper)(proxy);
	});
};

/**
 * Unlike the sandbox variant, this creates an evaluator that runs in
 * compatibility mode: all globals are allowed other than the few that are
 * explicitly blocked. This is necessary becuase we have some client
 * scripts/includes that were written before the sandbox feature was
 * implemented and are relying on these globals.
 *
 * Note that we intentionally don't try to stop scripts from walking up to
 * access a blocked variable. `setTimeout` may be blocked, but
 * `global.setTimeout` is all good.
 */
export const createCompatibilityEvaluator = (denylist) => {
	return lazyParser((src) => {
		const allNulls = Array(denylist.length).fill(null);
		const strictWrapper = `"use strict";\nreturn (${src});`;
		return new Function(...denylist, strictWrapper).apply(globalThis, allNulls);
	});
};

export const defaultAllowedGlobals = () => [
	// Types
	'Array',
	'BigInt',
	'BigInt64Array',
	'BigUint64Array',
	'Boolean',
	'Date',
	'Float32Array',
	'Float64Array',
	'Generator',
	'GeneratorFunction',
	'Infinity',
	'Int16Array',
	'Int32Array',
	'Int8Array',
	'Math',
	'Number',
	'Object',
	'Promise',
	'RegExp',
	'String',
	'Symbol',
	'Uint16Array',
	'Uint32Array',
	'Uint8Array',
	'Uint8ClampedArray',
	'Map',
	'Proxy',
	'Reflect',
	'Set',
	'WeakMap',
	'WeakSet',
	'undefined',

	// Errors
	'Error',
	'EvalError',
	'InternalError',
	'RangeError',
	'ReferenceError',
	'SyntaxError',
	'TypeError',
	'URIError',

	// Utils
	'Intl',
	'JSON',
	'console',
	'decodeURI',
	'decodeURIComponent',
	'encodeURI',
	'encodeURIComponent',
	'isFinite',
	'isNaN',
	'parseFloat',
	'parseInt',
	'DOMParser'
];

export const sandboxEvaluator = createSandboxedEvaluator(
	defaultAllowedGlobals()
);

export const compatibilityEvaluator = createCompatibilityEvaluator([
	'window',
	'document',
	'setTimeout',
	'setInterval'
]);
