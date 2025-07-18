import {
	getComponentKeys,
	getExternalKeys,
	addIdleForceEvaledAsset,
	hasIdleForceEvaledAsset
} from './registries';
import wasComponentEvaled from './wasComponentEvaled';
import wasExternalEvaled from './wasExternalEvaled';
import forceEval from './forceEval';

let isForceEvalAssetsOnIdle = false;

function getAssetToEval(names, fn) {
	return names.find((name) => !fn(name) && !hasIdleForceEvaledAsset(name));
}

function getRequestIdleCallbackShim(initialDelayInMs, delayInMs) {
	let currentDelayInMs = initialDelayInMs;
	return function requestIdleCallbackShim(cb) {
		/**
		 * Commented out since this is not used by the current implementation.
		 */
		// var start = Date.now();
		return setTimeout(function() {
			currentDelayInMs = delayInMs;
			cb({
				didTimeout: false
				// timeRemaining: function() {
				// 	return Math.max(0, 50 - (Date.now() - start));
				// }
			});
		}, currentDelayInMs);
	};
}

function isIFramed() {
	try {
		return window.top !== window.self;
	} catch (e) {
		return false;
	}
}

const runOnIdle =
	window.requestIdleCallback && !isIFramed()
		? window.requestIdleCallback
		: getRequestIdleCallbackShim(2000, 1);

export default function startCallbackLoop() {
	if (!isForceEvalAssetsOnIdle) {
		isForceEvalAssetsOnIdle = true;
		runOnIdle(() => {
			forceEvalAssetsOnIdle();
		});
	}
}

function forceEvalAssetsOnIdle() {
	const assetToEval =
		getAssetToEval(getExternalKeys(), wasExternalEvaled) ||
		getAssetToEval(getComponentKeys(), wasComponentEvaled);

	if (!assetToEval) {
		isForceEvalAssetsOnIdle = false;
		return;
	}

	addIdleForceEvaledAsset(assetToEval);
	forceEval(assetToEval);

	runOnIdle(() => {
		forceEvalAssetsOnIdle();
	});
}
