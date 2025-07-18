import EvalTimer from './evalTimer';
import {default as console} from '../../utils/getLogger.js';

export default function makeProvider(name, fn, registrySetFn) {
	return () => {
		delete window[name];

		const timer = new EvalTimer();

		try {
			fn();
		} catch (e) {
			console.error(`Received error when evaluating asset ${name}: ${e}`);
		}

		timer.stop();

		registrySetFn(name, timer.getTime());

		return window[name];
	};
}
