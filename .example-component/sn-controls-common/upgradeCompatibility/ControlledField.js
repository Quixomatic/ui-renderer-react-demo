/**
 * TODO - Remove this file once all react components are converted.
 * Use SeismicComponentFieldPropDefaults wherever needed.
 *
 * react-docgen needs this to be an exported React class (_not_ PureComponent)
 * in order for the docs to be generated correctly.
 *
 * If you want to use these proptypes, just import via
 * the index.js file instead
 */
import PropTypes from 'prop-types';
import React from 'react';
import ComponentBase from './ComponentBase';

/**
 * Prop types for controlled components. Note that this is just a subset of the
 * [React events](https://reactjs.org/docs/events.html#supported-events). The
 * payload for each event is identical to the React event.
 */
export default class ControlledField extends React.Component {
	static displayName = 'Controlled Fields';
	static propTypes = {
		...ComponentBase.propTypes,

		/**
		 * onChange event callback
		 */
		onChange: PropTypes.func,

		/**
		 * onSelect event callback
		 */
		onSelect: PropTypes.func,
		/**
		 * onClick event callback
		 */
		onClick: PropTypes.func,

		/**
		 * onMouseEnter event callback
		 */
		onMouseEnter: PropTypes.func,

		/**
		 * onMouseLeave event callback
		 */
		onMouseLeave: PropTypes.func,

		/**
		 * onFocus event callback
		 */
		onFocus: PropTypes.func,

		/**
		 * onBlur event callback
		 */
		onBlur: PropTypes.func,

		/**
		 * onKeyDown event callback
		 */
		onKeyDown: PropTypes.func,

		/**
		 * onKeyUp event callback
		 */
		onKeyUp: PropTypes.func,

		/**
		 * onKeyPress event callback
		 */
		onKeyPress: PropTypes.func
	};
}
