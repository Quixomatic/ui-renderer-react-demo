function getUxfSysProp(name, defaultValue) {
	return window?.ux_globals?.libuxf?.sysprops?.[name] ?? defaultValue;
}

const MIN_THRESHOLD_FOR_PAGE_LOAD_SCREEN_MACROPONENT_IDLE_MAX_WAIT_MS = parseInt(
	getUxfSysProp(
		'glide.uxf.lib.timeout.screen_macroponent_page_load_min_threshold_ms',
		4000
	)
);

const QUEUED_PROMISE_RESOLVERS = [];

let SCREEN_MACROPONENT_IDLE = false;

export function signalPageLoadComplete() {
	if (SCREEN_MACROPONENT_IDLE) return;

	for (const promiseResolver of QUEUED_PROMISE_RESOLVERS) {
		promiseResolver();
	}

	QUEUED_PROMISE_RESOLVERS.length = 0;
	SCREEN_MACROPONENT_IDLE = true;
}

document.addEventListener(
	'__DO_NOT_USE__UXF_INTERNAL#SCREEN_MACROPONENT_IDLE_TIMESTAMP_MARKED',
	signalPageLoadComplete,
	{once: true}
);

export function whenScreenMacroponentIdleDuringPageLoad({maxWait = 0} = {}) {
	if (SCREEN_MACROPONENT_IDLE) return Promise.resolve();

	maxWait =
		maxWait > MIN_THRESHOLD_FOR_PAGE_LOAD_SCREEN_MACROPONENT_IDLE_MAX_WAIT_MS
			? maxWait
			: MIN_THRESHOLD_FOR_PAGE_LOAD_SCREEN_MACROPONENT_IDLE_MAX_WAIT_MS;

	return new Promise((resolve) => {
		let timedOut = false;

		const timeoutId = setTimeout(() => {
			timedOut = true;
			resolve();
		}, maxWait);

		QUEUED_PROMISE_RESOLVERS.push(() => {
			if (timedOut) return;

			clearTimeout(timeoutId);
			resolve();
		});
	});
}
