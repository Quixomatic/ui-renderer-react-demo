export const getValueListFromField = field => {
	let value = field.value;
	let display_value_list = field.display_value_list;
	const valList = !value ? [] : value.split(',');

	const valuesList = [];
	for (let i in valList) {
		valuesList.push({
			value: valList[i],
			displayValue: display_value_list[i]
		});
	}
	return valuesList;
};
