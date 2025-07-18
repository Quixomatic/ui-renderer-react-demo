import reformatInputValues from './reformatInputValues';
import isGraphQLTransportEnabled from './isGraphQLTransportEnabled';

export default (payload) => {
	if (!isGraphQLTransportEnabled()) return payload;

	if (!payload.data)
		throw new Error(
			'Databroker payload formatted incorrectly: \n ${JSON.stringify(payload)}'
		);

	const data = payload.data.map((node) => {
		const {type, priority, instanceId, parentResourceId} = node;
		return {
			sysId: node.definitionSysId,
			type,
			priority,
			instanceId,
			parentResourceId,
			inputValues: reformatInputValues(node.inputValues)
		};
	});

	return {data};
};
