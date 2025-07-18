export default function getStateWrapper(seismicState) {
	// eslint-disable-next-line no-unused-vars
	const {behaviors, properties, ...macroponentState} = seismicState;
	return new Proxy(macroponentState, {
		get(target, statePropertyName) {
			// todo: only allow defined statePropertyNames to be retrieved
			return Reflect.get(target, statePropertyName);
		},
		set() {
			console.warn('Use setState for state updates. Operation was ignored.');
		}
	});
}
