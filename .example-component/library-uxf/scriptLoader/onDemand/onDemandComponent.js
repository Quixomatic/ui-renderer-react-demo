import getLazyProxy from './getLazyProxy';
import makeProvider from './makeProvider';
import forceEval from './forceEval';
import {setTag, hasSeenTag, setComponent, hasComponent} from './registries';
import startCallbackLoop from './forceEvalAssetsOnIdle';
import {default as console} from '../../utils/getLogger.js';

export default function onDemandComponent(name, tags, fn, useProxy) {
	if (hasComponent(name)) {
		console.warn(`Redefining component: ${name}`);
		return;
	}

	setComponent(name, false);
	const provider = makeProvider(name, fn, setComponent);

	if (!useProxy) {
		Object.defineProperty(window, name, {
			get: provider,
			configurable: true
		});
	} else {
		Object.defineProperty(window, name, {
			value: getLazyProxy(provider),
			configurable: true
		});
	}

	tags.forEach((tag) => {
		setTag(tag, name);
	});

	if (tags.some((tag) => hasSeenTag(tag))) {
		Promise.resolve().then(function() {
			forceEval(name);
		});
	}

	startCallbackLoop();
}
