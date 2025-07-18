import {
	COMPOSITION_ELEMENT_ID,
	CONTAINING_MACROPONENT_SYS_ID,
	internalActions
} from '../constants';
import {getControllerDependencyProp} from '../utils';
import {isArray} from '@devsnc/snowdash';
import {map} from '@devsnc/snowdash';

import {mapValues} from '@devsnc/snowdash';

const {CONTROLLER_PROP_RESOLVED, CONTROLLER_NODE_INSERTED} = internalActions;

const getAppendToMetaObject = (nodeId, containingMacroponentSysId) => {
	return {
		[COMPOSITION_ELEMENT_ID]: nodeId,
		[CONTAINING_MACROPONENT_SYS_ID]: containingMacroponentSysId
	};
};

export const renderProxyDataResourceMultiInstanceNodes = (
	controllerNodeIdWithGlideForm,
	dispatch,
	renderDependencies,
	children
) => {
	const {
		sysId,
		getResolvedPropValueFn,
		getComponentIdFn,
		proxydbNodes,
		nowAppProps
	} = renderDependencies;

	if (!isArray(proxydbNodes)) return null;

	return map(proxydbNodes, (proxydbNode) => {
		const {
			propertyValues,
			nodeId,
			tagName: ElementTagName,
			derived,
			definitionSysId
		} = proxydbNode;

		if (derived) return null;

		const props = mapValues(propertyValues, (propertyUxValue) =>
			getResolvedPropValueFn(propertyUxValue)
		);

		const componentId = getComponentIdFn(nodeId);

		const dependencyProps = {};
		Object.entries(proxydbNode.dependencies).map(([_, depObj]) => {
			depObj.dependencyProps.map((dataProp) => {
				const dataBindingUxValue = {
					type: 'DATA_OUTPUT_BINDING',
					binding: {
						address: [depObj.controllerElementId, dataProp]
					}
				};
				const evaluated = getResolvedPropValueFn(dataBindingUxValue);
				const dependencyPropName = getControllerDependencyProp(
					depObj.name,
					dataProp
				);
				dependencyProps[dependencyPropName] = evaluated;
			});
		});
		dispatch(CONTROLLER_PROP_RESOLVED, {
			properties: props,
			nodeId,
			containerSysId: sysId,
			definitionSysId
		});

		const insertNode = ({elm}) => {
			dispatch(CONTROLLER_NODE_INSERTED, {
				node: elm,
				nodeId,
				containerSysId: sysId,
				definitionSysId: definitionSysId
			});
		};
		const hooks = {
			insert: insertNode,
			update: insertNode
		};
		return (
			<ElementTagName
				{...{...props, nowAppProps}}
				{...dependencyProps}
				component-id={componentId}
				hook={{...hooks}}
				style={{
					display: controllerNodeIdWithGlideForm === nodeId ? 'initial' : 'none'
				}}
				append-to-meta={getAppendToMetaObject(nodeId, sysId)}>
				{controllerNodeIdWithGlideForm === nodeId && children}
			</ElementTagName>
		);
	});
};
