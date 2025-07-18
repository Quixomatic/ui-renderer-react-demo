import {get} from '@devsnc/snowdash';
import {first} from '@devsnc/snowdash';

const SEISMIC_SYMBOL_HELPERS_DESCRIPTION = '__helpers_defer__';
const SEISMIC_SYMBOL_VARIABLES_DESCRIPTION = '__variables__';
const SEISMIC_SYMBOL_ANCESTOR_ROOT_NODE_DESCRIPTION = '__ancestor_root_node__';
const SEISMIC_DISPATCH_FN_NAME = 'dispatch';
import {MACROPONENT_ROOT_COMPONENT_ID} from '../constants.js';

import {
	getInstanceValue,
	getProxyInstanceValue
} from './macroponentInstanceRegistry';
import {default as console} from '../../utils/getLogger.js';
import {isNil} from '@devsnc/snowdash';

function getSeismicDispatchFn(hostEl, nodeId) {
	if (isNil(hostEl.shadowRoot)) {
		console.warn('Host does not contain any applicable children');
		return;
	}

	const nowId = hostEl.getAttribute('component-id');
	const domNode = hostEl.shadowRoot.querySelector(
		`[component-id="${nowId}-${nodeId}"]`
	);
	if (isNil(domNode)) {
		console.warn('Host does not contain the target node');
		return;
	}

	return getDispatchForDomNode(domNode);
}

function getDispatchForDomNode(domNode) {
	return get(getSeismicVariable(domNode, SEISMIC_SYMBOL_HELPERS_DESCRIPTION), [
		SEISMIC_DISPATCH_FN_NAME
	]);
}

function getSeismicVariable(domNode, symbolDescription) {
	const elementVariables = first(
		Object.getOwnPropertySymbols(domNode)
			.filter(
				(symbol) => SEISMIC_SYMBOL_VARIABLES_DESCRIPTION === symbol.description
			)
			.map((symbol) => domNode[symbol])
	);

	// Seismic >= 21.1.0 nests symbols in a __variables__ symbol
	// Seismic < 21.1.0 keeps the symbols on the host element
	const containingObject = elementVariables || domNode;
	return first(
		Object.getOwnPropertySymbols(containingObject)
			.filter((symbol) => symbolDescription === symbol.description)
			.map((symbol) => containingObject[symbol])
	);
}

export function getCsdbDispatchFn(hostEl, nodeId, macroponentDispatch) {
	const csdbDispatchFn = getInstanceValue(hostEl, 'csdbDispatchFn', () =>
		getSeismicDispatchFn(hostEl, nodeId)
	);
	return isNil(csdbDispatchFn) ? macroponentDispatch : csdbDispatchFn;
}

export function getMiPdbDispatchFn(hostEl, nodeId, macroponentDispatch) {
	const miPdbDispatchFn = getProxyInstanceValue(hostEl, nodeId, () =>
		getSeismicDispatchFn(hostEl, nodeId)
	);
	return isNil(miPdbDispatchFn) ? macroponentDispatch : miPdbDispatchFn;
}

export function getRootDispatchFn(hostEl, macroponentDispatch) {
	const rootDispatchFn = getInstanceValue(hostEl, 'rootDispatchFn', () => {
		return getSeismicDispatchFn(hostEl, MACROPONENT_ROOT_COMPONENT_ID);
	});
	return isNil(rootDispatchFn) ? macroponentDispatch : rootDispatchFn;
}

/**
 * Why get Parent Dispatch Function?
 *
 * This is introduced in support of Controller-cross-dependency Event Mapping
 * and hopefully will not be abused in the future for trivial use-cases.
 *
 * For the most part we want the framework to follow Seismic eventing paradigms,
 * as well, keep individual Macroponent Eventing encapsulated, not leaking
 * all over the DOM hierarchy.
 *
 * This is a special case, where we want to empower UIB users and App developers
 * to modularize their logic in such a way where they can be very expressive
 * with re-usable, composable building blocks (Controllers and Controller Dependencies)
 *
 * Because we normally don't let "Internal Framework" events bubble up to
 * the parent, we needed a way to "quantum tunnel" out to the parent, where
 * these cross-Dependency Event Handlers live
 * @param child
 * @param fallbackDispatch
 * @returns {*}
 */
export function getParentDispatchFn(child, fallbackDispatch) {
	const parentDispatchFn = getInstanceValue(child, 'parentDispatchFn', () => {
		const shadowHost = getAncestorRoot(child);
		// eslint-disable-next-line no-extra-boolean-cast
		return !!shadowHost ? getDispatchForDomNode(shadowHost) : null;
	});
	return isNil(parentDispatchFn) ? fallbackDispatch : parentDispatchFn;
}

function getAncestorRoot(child) {
	return getSeismicVariable(
		child,
		SEISMIC_SYMBOL_ANCESTOR_ROOT_NODE_DESCRIPTION
	);
}
