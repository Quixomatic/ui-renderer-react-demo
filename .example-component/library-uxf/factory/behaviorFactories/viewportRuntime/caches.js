import {memoize} from '@servicenow/ui-utils';

export class ScriptedRequestsCache {
	constructor() {
		this.__cache = {};

		// memoize the stringify method so we don't have to
		// keep running JSON.stringify over and over
		this.stringify = memoize((input) => {
			if (typeof input === 'string') return input;

			try {
				return JSON.stringify(input);
			} catch (error) {
				console.warn(error);
			}
			return null;
		});
	}

	add(scriptedRoutes) {
		const key = this.stringify(scriptedRoutes);
		if (key && !this.isExcluded(key)) {
			let _resolve;
			this.__cache[key] = {
				promise: new Promise((resolve) => {
					_resolve = resolve;
				})
			};
			this.__cache[key].resolve = _resolve;
		}
	}

	getResolve(scriptedRoutes) {
		return this.__cache[this.stringify(scriptedRoutes)]?.resolve;
	}

	get(scriptedRoutes) {
		return this.__cache[this.stringify(scriptedRoutes)]?.promise;
	}

	isExcluded(scriptedRoutes) {
		const key = this.stringify(scriptedRoutes);
		return ScriptedRequestsCache.excludedPayloadKeys.every((item) => {
			return item.test(key);
		});
	}

	has(scriptedRoutes) {
		const key = this.stringify(scriptedRoutes);
		if (!key || this.isExcluded(key)) return false;
		return Object.prototype.hasOwnProperty.call(this.__cache, key);
	}

	clear() {
		this.__cache = {};
	}
}

ScriptedRequestsCache.excludedPayloadKeys = [
	/@data(.*?)\.table/,
	/@data(.*?)\.sysId/
];
