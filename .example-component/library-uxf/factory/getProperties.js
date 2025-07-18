export default ({properties = []}) => {
	return properties.reduce((acc, property) => {
		const {name} = property;
		// fixme: finally add support for default values!
		acc[name] = {selectable: true};
		return acc;
	}, {});
};
