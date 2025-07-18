import { isEmpty, isFunction, some } from 'lodash';
import { getFocusableNodes } from '@servicenow/behavior-focus';

/**
 * Returns the first ancestor of the element that has the given class name
 */
export function findAncestor(el, className) {
	if (!(el instanceof HTMLElement)) {
		return null;
	}

	if (!el.classList.contains(className)) {
		while ((el = el.parentElement) && !el.classList.contains(className));
	}
	return el;
}

/**
 * Check whether a node was part of an event path
 * @returns {boolean} true if the event path includes the node
 */
export function isNodeInEventPath(node, event) {
	if (Array.isArray(node))
		return some(node, el => isNodeInEventPath(el, event));
	return (
		node instanceof HTMLElement &&
		event instanceof Event &&
		event.composedPath().includes(node)
	);
}

/**
 * Check whether a node contains an element with focus. ShadowDOM
 * makes this a little tricky...
 */
export function nodeContainsFocus(container, target = document) {
	if (Array.isArray(container)) {
		return some(container, el => nodeContainsFocus(el, target));
	}

	if (!(container instanceof HTMLElement) || !target) {
		return false;
	}

	const activeElement = target.activeElement;

	if (container.contains(activeElement)) {
		return true;
	}

	if (activeElement.shadowRoot) {
		return nodeContainsFocus(container, activeElement.shadowRoot);
	}
}

export const isSlotEmpty = slot => {
	const hasNoDirectChildren = slot.childElementCount === 0;

	return isFunction(slot.assignedNodes)
		? isEmpty(slot.assignedNodes()) && hasNoDirectChildren
		: hasNoDirectChildren;
};

export function getScrollParent(node) {
	const isElement = node instanceof HTMLElement;
	const overflowY = isElement && window.getComputedStyle(node).overflowY;
	const isScrollable = overflowY !== 'visible' && overflowY !== 'hidden';

	if (!node) {
		return null;
	} else if (isScrollable && node.scrollHeight >= node.clientHeight) {
		return node;
	}

	return getScrollParent(node.host || node.parentNode);
}

export function fitDropdownToViewport(dropdown, target) {
	if (!(dropdown instanceof HTMLElement)) {
		return;
	}

	let parentHeight = document.documentElement.clientHeight;

	// In IE/Edge, the container height is the entire page height.
	// So defer it until it gets its real height
	return new Promise(resolve => {
		setTimeout(() => {
			let { height } = dropdown.getBoundingClientRect();
			// Sometimes we use graphql requests and that changes the height of the
			// dropdown this is to attempt to account for the size chagne
			const MAX_DROPDOWN_HEIGHT = Math.min(height, 300);
			let {
				width: targetWidth,
				top: targetTop,
				bottom: targetBottom,
				left: targetLeft
			} = target.getBoundingClientRect();

			// Is bottom of the dropdown below the fold + can the dropdown fit above?
			// Move to be above the input field.
			const hasSpaceBelow = targetBottom + MAX_DROPDOWN_HEIGHT < parentHeight;
			const hasSpaceAbove = targetTop - MAX_DROPDOWN_HEIGHT > 0;
			//render above
			if (!hasSpaceBelow && hasSpaceAbove) {
				// Since height of the dropdown may change as results load,
				// set the bottom of the dropdown to ensure it loads above the input field
				dropdown.style.bottom = `${parentHeight - targetTop}px`;
			} else {
				dropdown.style.top = `${targetBottom}px`;
			}

			dropdown.style.width = `${targetWidth}px`;
			dropdown.style.left = `${targetLeft}px`;

			resolve();
		});
	});
}

// Workaround for PRB1343271 for mentions dropdown
export function fitDropdownToViewportOld(dropdown) {
	if (!(dropdown instanceof HTMLElement)) {
		return;
	}

	// Check if the element is in a scrollable container, otherwise use body
	const scrollParent = getScrollParent(dropdown);
	let parentHeight = document.documentElement.clientHeight;
	if (scrollParent) parentHeight = scrollParent.getBoundingClientRect().height;

	// In IE/Edge, the container height is the entire page height.
	// So defer it until it gets its real height
	return new Promise(resolve => {
		setTimeout(() => {
			let { height, top } = dropdown.getBoundingClientRect();
			if (scrollParent) top = top - scrollParent.getBoundingClientRect().top;

			// Is bottom of the dropdown below the fold + can the dropdown fit above?
			// Move to be above the input field.
			if (height > parentHeight - top && top > height) {
				dropdown.style.top = 'auto';
				dropdown.style.bottom = '100%';
			}

			resolve();
		});
	});
}

/**
 * Can be used to determine the direction of the browser window
 * and then for components rendering direction
 * @returns {boolean}
 */
export function isRTL() {
	return document.dir === 'rtl';
}

/**
 * Checks whether a node contains an element with selector inside a Shadow Dom
 * and then returns the element
 * @returns {HTMLElement}
 */
export const querySelectorDeep = (selector, rootEl = window.document.body) => {
	if (rootEl.matches && rootEl.matches(selector)) return rootEl;

	const children = rootEl.children;

	if (children) {
		for (let i = 0; i < children.length; i++) {
			if (children[i].matches && children[i].matches(selector))
				return children[i];

			const child = querySelectorDeep(selector, children[i]);
			if (child) return child;
		}
	}

	if (rootEl.shadowRoot)
		return querySelectorDeep(selector, rootEl.shadowRoot);

	return null;
};

/**
 * Focuses on the field when multiple focussable elements are present in the host
 */
export const fieldFocusHandler = (tagName = 'INPUT') => host => {
	const { tabbableNodes=[] } = getFocusableNodes(host);
	const nativeInputNode = tabbableNodes.filter(node => node.tagName === tagName);
	if (nativeInputNode.length) {
		nativeInputNode[0].focus();
	}
};
