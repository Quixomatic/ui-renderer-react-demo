import PropTypes from 'prop-types';
import { isFunction } from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';

/**
 * TODO - 	This component might not be required when Textarea and DumbTextInput are migrated to seismic
 * 			Revisit once these components are migrated to Seismic
 *
 * React does not always play nicely with WebComponents, especially when they
 * are polyfilled by ShadyDOM. We have some cases where `onBlur` or `onFocus`
 * is not correctly called in Firefox or IE, but natively attaching an event is
 * all good.
 *
 * https://code.devsnc.com/dev/sn-component-form-controls/pull/124
 *
 * This component expects a single child and hijacks any `onBlur` or `onFocus`
 * callback, replacing it with a native event instead.
 *
 * Will throw an exception with multiple children, or when the single child is
 * not a React component... so don't go passing stupid values in.
 */
export default class ShadyDOMEventFixer extends React.PureComponent {
	static propTypes = {
		children: PropTypes.element
	};

	addListeners(props) {
		const child = React.Children.only(props.children);
		const node = ReactDOM.findDOMNode(this);

		if (node && child.props.onBlur) {
			node.addEventListener('blur', child.props.onBlur);
		}

		if (node && child.props.onFocus) {
			node.addEventListener('focus', child.props.onFocus);
		}
	}

	removeListeners(props) {
		const child = React.Children.only(props.children);
		const node = ReactDOM.findDOMNode(this);

		if (node && child.props.onBlur) {
			node.removeEventListener('blur', child.props.onBlur);
		}

		if (node && child.props.onFocus) {
			node.removeEventListener('focus', child.props.onFocus);
		}
	}

	componentDidMount() {
		if (!window.ShadyDOM) return;
		this.addListeners(this.props);
	}

	componentWillReceiveProps(nextProps) {
		if (!window.ShadyDOM) return;
		this.removeListeners(this.props);
		this.addListeners(nextProps);
	}

	render() {
		const child = React.Children.only(this.props.children);
		if (
			window.ShadyDOM &&
			(isFunction(child.props.onBlur) || isFunction(child.props.onFocus))
		) {
			return React.cloneElement(child, {
				...child.props,
				onBlur: undefined,
				onFocus: undefined
			});
		}

		return child;
	}
}