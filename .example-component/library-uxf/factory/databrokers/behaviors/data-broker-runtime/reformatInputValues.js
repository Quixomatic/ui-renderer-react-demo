export default (inputValues) => {
	const newInputValues = [];
	const names = Object.getOwnPropertyNames(inputValues);
	for (const name of names) {
		const inputValue = inputValues[name];
		const {type, binding, value} = inputValue;
		newInputValues.push({
			name,
			type,
			value,
			binding
		});
	}

	return newInputValues;
};
