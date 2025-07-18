/**
 * Invokes `func` with `partials` prepended to the arguments it receives,
 * without altering the `this` value.
 *
 * Invokes `func` with `partials` prepended to the arguments it receives.
 * Returns the new function.
 * @param {Function} func The function to partially apply arguments to.
 * @param {...*} partials The arguments to partially apply to the function.
 * @returns {Function} Returns the new partially applied function.
 */
export default function partial(func, ...partials) {
	if (typeof func != 'function')
		throw new TypeError('Expected func to be of type function');
	return function(...args) {
		const fullArgs = partials
			.map((partialArg) =>
				partialArg === partial.placeholder ? args.shift() : partialArg
			)
			.concat(args);
		return func.apply(this, fullArgs);
	};
}
partial.placeholder = Symbol();
