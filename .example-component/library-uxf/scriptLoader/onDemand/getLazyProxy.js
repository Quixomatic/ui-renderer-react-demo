import {isObject} from '@devsnc/snowdash';

function memoizeProvider(provider) {
	let memoized = false;
	let obj = null;

	return () => {
		if (!memoized) {
			obj = provider();
			if (!isObject(obj)) obj = {};
			memoized = true;
		}
		return obj;
	};
}

export default function getLazyProxy(provider) {
	const target = memoizeProvider(provider);

	return new Proxy(function() {}, {
		apply(_, thisArg, args) {
			return Reflect.apply(target(), thisArg, args);
		},

		construct(_, args) {
			return Reflect.construct(target(), args);
		},

		defineProperty(_, prop, descriptor) {
			return Reflect.defineProperty(target(), prop, descriptor);
		},

		deleteProperty(_, prop) {
			return Reflect.deleteProperty(target(), prop);
		},

		get(_, prop, receiver) {
			return Reflect.get(target(), prop, receiver);
		},

		getOwnPropertyDescriptor(_, prop) {
			return Reflect.getOwnPropertyDescriptor(target(), prop);
		},

		getPrototypeOf(_) {
			return Reflect.getPrototypeOf(target());
		},

		has(_, prop) {
			return Reflect.has(target(), prop);
		},

		isExtensible(_) {
			return Reflect.isExtensible(target());
		},

		ownKeys(_) {
			return Reflect.ownKeys(target());
		},

		preventExtensions(_) {
			return Reflect.preventExtensions(target());
		},

		set(_, prop, value) {
			return Reflect.set(target(), prop, value);
		},

		setPrototypeOf(_, proto) {
			return Reflect.setPrototypeOf(target(), proto);
		}
	});
}
