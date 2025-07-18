import isGraphQLTransportEnabled from './isGraphQLTransportEnabled';

export default (payload) => {
	if (!isGraphQLTransportEnabled()) return payload.result;

	if (!payload.data) return payload.errors;

	const resultNodes = payload.data.global.DataResource.DataResourceDataSet;
	resultNodes.forEach((node) => {
		if (typeof node.executionResult === 'string')
			node.executionResult = JSON.parse(node.executionResult);

		if (typeof node.errors === 'string') node.errors = JSON.parse(node.errors);
	});

	return resultNodes;
};
