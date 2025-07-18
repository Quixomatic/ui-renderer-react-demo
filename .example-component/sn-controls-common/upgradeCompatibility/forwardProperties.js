import React from 'react';

//TODO - Can be removed once all components are converted to seismic
export const ForwardProperties = Component =>
	function RegisteredComponent({ properties, ...rest }) {
		return React.createElement(Component, {
			...properties,
			...rest,
			properties
		});
	};
