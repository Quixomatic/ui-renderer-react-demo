import {get} from '@devsnc/snowdash';
import {getNodeId} from '../utils';

export const renderConditionalNode = (
	rendererDependencies,
	{node, renderer: Renderer, repeaterItem = null}
) => {
	const {
		getChildrenFn: getChildren,
		getResolvedPropValueFn
	} = rendererDependencies;

	const nodeId = getNodeId(node);
	const conditionalSlot = get(node, ['slot']);

	const children = getChildren(nodeId);
	for (let i = 0; i < children.length; i++) {
		const conditionalNode = children[i];
		const evaluatedCondition = conditionalNode.conditional
			? getResolvedPropValueFn(conditionalNode.conditional, repeaterItem)
			: true;
		if (evaluatedCondition) {
			conditionalNode.slot = conditionalSlot;

			return (
				<Renderer
					renderer={Renderer}
					node={conditionalNode}
					repeaterItem={repeaterItem}
				/>
			);
		}
	}
	return null;
};
