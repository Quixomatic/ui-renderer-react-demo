import get from 'lodash/get';

export const createPreSourceBehavior = (componentTagName, {name:dsName = 'undefined', transform = d => d}) => {
	const storeSeed = get(window, `ux_globals.presource['${componentTagName}:${dsName}']`, {});
	let initialState = storeSeed;
	try {initialState = (typeof transform === 'function') ? transform(storeSeed) : storeSeed;}catch(e) {console.error(e);initialState = storeSeed;}
	return {
		name: dsName, // this.props.behaviors[dsName], available onConnect
		initialState
	};
};

export const getBehaviorProp = (state, name, defVal = {}) => !name ? undefined : get(state, `behaviors['${name}']`, defVal);
