/*
 * Overriding Event Propagation.
 *
 * This functionality as provided with UIB preview as its main use case.
 * When UIB is previewing a page, certain actions may want to be ignored.
 *
 * For this case, UIB can simply call blockEvents, exposed through
 * window.uxf.overrideEventPropagation.blockEvents() with a list of events
 * that will be ignored.
 *
 * When preview is complete, blockEvents() should be called again with either
 * an empty list or no parameter at all to make sure that all events are once again
 * handled at run-time.
 */

/*
 * Events currently blocked/ignored.
 */
const macroponentBlockedEvents = {};

/**
 * Block the events via addEventListener to document with capture.
 * @param {Array} events : List of events to be ignored
 * @return void
 */
export const blockEvents = (events = []) => {
	removeEventListeners();

	for (const evt of events) {
		let action = (e) => {
			if (e?.detail?.payload?.skipBlocking) return;
			e.stopPropagation();
			e.stopImmediatePropagation();
		};
		document.addEventListener(evt, action, true);
		macroponentBlockedEvents[evt] = action;
	}
};

/**
 * Remove all event listeners from the document that are stored
 * in macroponentBlockedEvents.
 * @return void
 */
const removeEventListeners = () => {
	for (const [evt, action] of Object.entries(macroponentBlockedEvents)) {
		document.removeEventListener(evt, action, true);
		delete macroponentBlockedEvents[evt];
	}
};
