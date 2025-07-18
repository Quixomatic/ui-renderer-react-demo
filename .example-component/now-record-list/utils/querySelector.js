/*
I copied this functions over directly from https://code.devsnc.com/dev/sn-tectonic/blob/master/test-api/element-helpers/query-selector.js
as they are part of the tectonic/test-api and we can't include that as part of our dependency package. Tectonic packages should only be
listed as devDependency to prevent false positives of unapproved third party libraries.
*/

function isDeepSelector(selector) {
	return ~selector.indexOf('>>>');
}

export default function querySelector(selector, el = document) {
	if (!isDeepSelector(selector)) return el.querySelector(selector);

	const selectors = selector.split('>>>').map(selector => selector.trim());
	const {length} = selectors;
	let selected = el;

	for (let i = 0; i < length; i++) {
		if (selectors[i]) selected = selected.querySelector(selectors[i]);

		if (!selected) return selected;

		selected = i !== length - 1 ? selected.shadowRoot : selected;
	}

	return selected;
}
