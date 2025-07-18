function isLegacySelector(str) {
	const match =
		str && str.match(/^\[\s*component-id\s*\$=\s*(['"]?)([\w- ]+)\1\s*\]$/);
	if (!match) {
		return false;
	}

	return match[2];
}

export function getTargetElement(el, selector, isRecursing = false) {
	const elShadowRoot = el.shadowRoot;

	if (elShadowRoot) {
		const targetEl = elShadowRoot.querySelector(selector);
		if (targetEl) {
			return targetEl;
		}

		for (const child of elShadowRoot.children) {
			const shadowChildEl = getTargetElement(child, selector, true);
			if (shadowChildEl) {
				return shadowChildEl;
			}
		}
	}

	if (!elShadowRoot || !isRecursing) {
		for (const child of el.children) {
			const childEl = getTargetElement(child, selector, true);
			if (childEl) {
				return childEl;
			}
		}
	}

	return null;
}

export default function getElement(host, idOrSelector, checkHoisted = false) {
	if (!host) {
		return null;
	}

	const selector = isLegacySelector(idOrSelector)
		? idOrSelector
		: `[component-id$='${idOrSelector}']`;
	try {
		const childElement = host?.shadowRoot.querySelector(selector);
		if (childElement) {
			return childElement;
		}

		if (checkHoisted) {
			// this is a very specific scenario where the target element for the popover has been hoisted
			// in to a modal.  Since modal's are hoisted to the top of the dom tree, starting at the top of
			// the dom (the body element) will speed up the required dom traversal to find the target element
			// in question.
			return getTargetElement(document.querySelector('body'), selector);
		}
		// If we don't find the element in the current macroponent composition, we
		// walk up 1 parent macroponent and check there. This is done for
		// backwards-compatibility, but is hacky because there can be ID collisions
		// between elements in the parent and child macroponents.
		const parentMcp = host.getRootNode().host;
		return parentMcp?.shadowRoot.querySelector(selector);
	} catch (e) {
		// invalid query selector syntax, which we don't support
		return null;
	}
}
