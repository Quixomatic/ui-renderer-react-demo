export const transformState = state => ({
	...state,
	properties: {
		...state.properties,
		value: state.properties.value === true ? '' : state.properties.value
	}
});
