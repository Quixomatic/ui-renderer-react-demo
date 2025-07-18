import makeProvider from './makeProvider';
import getLazyProxy from './getLazyProxy';
import {hasExternal, setExternal} from './registries';
import startCallbackLoop from './forceEvalAssetsOnIdle';
import {default as console} from '../../utils/getLogger.js';

export default function onDemandExternal(name, fn, useProxy) {
	if (hasExternal(name)) {
		console.warn(`Redefining external: ${name}`);
		return;
	}

	setExternal(name, false);
	const provider = makeProvider(name, fn, setExternal);

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

	startCallbackLoop();
}
