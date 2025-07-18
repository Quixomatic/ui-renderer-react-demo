import forceEval from './forceEval';
import {getTag, addSeenTag, hasSeenTag} from './registries';

const loaderObserver = new MutationObserver((records) => {
	records.forEach((record) => {
		record.addedNodes.forEach(observeTree);
	});
});

function registerObserver(node) {
	loaderObserver.observe(node, {childList: true, subtree: true});
}

function observe(node) {
	const tagName = node.tagName;
	if (!tagName || !tagName.includes('-')) return;

	const name = tagName.toLowerCase();
	if (hasSeenTag(name)) return;

	addSeenTag(name);

	const component = getTag(name);
	if (!component) return;

	Promise.resolve().then(function() {
		forceEval(component);
	});
}

function observeTree(node) {
	observe(node);

	if (node.childNodes) node.childNodes.forEach(observeTree);
}

function observeTopLevel(node) {
	observeTree(node);
	registerObserver(node);
}

export default function addNodeObservers() {
	const nativeAttachShadow = HTMLElement.prototype.attachShadow;

	HTMLElement.prototype.attachShadow = function(option) {
		const shadow = nativeAttachShadow.call(this, option);
		registerObserver(shadow);
		return shadow;
	};

	document.addEventListener(
		'DOMContentLoaded',
		function() {
			document
				.querySelectorAll('body > [component-id]')
				.forEach(observeTopLevel);
		},
		false
	);
}
