import PropTypes from 'prop-types';
import React from 'react';
import { noop, isFunction, values, size } from 'lodash';
import { nodeContainsFocus, isNodeInEventPath } from '../utils/dom';
import {
	addOutsideScrollListener,
	removeOutsideScrollListener
} from '../utils/outside-scroll';

/**
 * Execute a callback when the node loses focus (either by tabbing off the
 * element or clicking outside).
 *
 * @returns an object containing a `remove()` method to clean up event
 * handlers.
 */
export function onLeave(node, callback, { handleOutsideScroll }) {
	const singleNode = Array.isArray(node) ? node[0] : node;

	function keyboardHandler(event) {
		// This setTimeout is here in order to prevent the race condition between
		// the callback and the keydown event firing. Keydown event happens BEFORE
		// focus is lost, where mousedown happens AFTER. Without the setTimeout,
		// mouse clicks work fine, but pressing TAB does not register as leaving
		// the field.
		setTimeout(() => {
			if (!nodeContainsFocus(node)) {
				callback(event);
			}
		});
	}

	function mouseHandler(event) {
		if (!isNodeInEventPath(node, event)) {
			callback(event);
		}
	}

	function scrollHandler(event) {
		callback(event);
		node.forEach(n => n.blur());
	}

	document.addEventListener('mousedown', mouseHandler);
	document.addEventListener('keydown', keyboardHandler);
	if (handleOutsideScroll) {
		addOutsideScrollListener(singleNode, scrollHandler);
	}

	return {
		remove: () => {
			document.removeEventListener('mousedown', mouseHandler);
			document.removeEventListener('keydown', keyboardHandler);
			removeOutsideScrollListener(singleNode);
			return null;
		}
	};
}

/**
 * Component that handles focus state management setup and cleanup across
 * separate nodes. This is typically used to defer blur events on an input when
 * a sibling dropdown is active.  It will wrap the component passed through and
 * handle calling the passed in `onBlur` when focus leaves the component(s) set
 * by `setFocusTarget`.
 *
 * The child must be a function that returns a React element. The function
 * will be called with a `setFocusTarget` parameter that the child can use to flag
 * specific nodes that need to listen to blur events.
 *
 * Call setFocusTarget with a string that acts as a key to handle multiple refs and duplicates. Then pass that result through
 * to any ref prop in a Component. i.e. <Component ref={setFocusTarget('my-key')} />
 *
 * @param {function} props.onBlur - The function to call when focus is lost
 * @param {function} props.children - The child *must* be a function that returns your actual component.
 *
 * @example
 * const handleBlur = () => console.log("no longer active!");
 *
 * const Component = ({ isActive }) => (
 *   <FocusWatcher onBlur={handleBlur}>
 *     { setFocusTarget => (
 *       // my real component
 *       <input ref={setFocusTarget('my-ref')} />
 *     )}
 *   </FocusWatcher>
 * )
 */
export default class FocusWatcher extends React.Component {
	constructor(props) {
		super(props);

		if (!isFunction(props.children)) {
			throw new Error('The child must be a function');
		}

		this.nodes = {};
		this.globalListener = null;
		this.focused = false;
	}

	componentWillUnmount() {
		this.globalListener && this.globalListener.remove();
	}

	componentWillReceiveProps(nextProps) {
		if (this.props.onBlur !== nextProps.onBlur) {
			this.setupGlobalListener(nextProps.onBlur);
		}
	}

	setupGlobalListener = callback => {
		if (this.globalListener) {
			this.globalListener = this.globalListener.remove();
		}

		if (size(this.nodes) > 1) {
			this.globalListener = onLeave(values(this.nodes), callback, {
				handleOutsideScroll: this.props.handleOutsideScroll
			});
		}
	};

	setFocusTarget = key => {
		return ref => {
			if (ref === null) {
				delete this.nodes[key];
			} else {
				this.nodes[key] = ref;
				ref.addEventListener('blur', this.onNodeBlur);
				ref.addEventListener('focus', this.onFocus);
			}

			this.setupGlobalListener(this.onGlobalBlur);

			return ref;
		};
	};

	onNodeBlur = (...args) => {
		if (size(this.nodes) <= 1) {
			this.focused = false;
			this.onGlobalBlur(...args);
		}
	};

	onGlobalBlur = (...args) => {
		if (!this.props.persistant || (this.props.persistant && this.focused)) {
			this.focused = false;
			this.props.onBlur(...args);
		}
	};

	onFocus = () => {
		this.focused = true;
	};

	render() {
		return this.props.children(this.setFocusTarget);
	}
}

FocusWatcher.propTypes = {
	children: PropTypes.func.isRequired,
	onBlur: PropTypes.func,
	handleOutsideScroll: PropTypes.bool
};

FocusWatcher.defaultProps = {
	onBlur: noop,
	handleOutsideScroll: false
};
