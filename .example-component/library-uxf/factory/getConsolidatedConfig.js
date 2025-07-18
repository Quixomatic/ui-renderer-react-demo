import {get} from '@devsnc/snowdash';
import {
	UXF_INTERNAL_HANDLING_SCOPE_SAFETY,
	UXF_VIEWPORT_SCREEN_TAG
} from './constants';
import {isNil} from '@devsnc/snowdash';
import {isArray} from '@devsnc/snowdash';

import {mergeWith} from '@devsnc/snowdash';

const mergeActions = (objValue, srcValue) => {
	// IMPORTANT: we get handlingScope behind a "safety" to prevent handlingScope injection from metadata
	if (isHandlingScopeContainer(srcValue)) return {...srcValue};
	return isArray(objValue) ? objValue.concat(srcValue) : undefined;
};

function isHandlingScopeContainer(container) {
	return typeof container?.[UXF_INTERNAL_HANDLING_SCOPE_SAFETY] === 'string';
}

// fixme: all these functions are candidates to be moved into the java layer
const getConsolidatedConfig = (
	descendants,
	node,
	offRowEventMappingsByNodeId = {}
) => {
	const {
		nodeId,
		eventMappings = [],
		properties = [],
		dataBrokers,
		dependencies,
		tagName,
		definitionSysId,
		derived = false
	} = node;

	const children = descendants[nodeId] || [];
	const childrenConfigs = children.map((child) =>
		getConsolidatedConfig(descendants, child, offRowEventMappingsByNodeId)
	);

	const dataElemEventMappings = (dataBrokers ? dataBrokers : [])
		.reduce((acc, dataElem) => {
			const eventMappings = (
				dataElem.eventMappings ? dataElem.eventMappings : []
			).map((em) => ({
				...em,
				dataElementId: dataElem.id
			}));
			return [...acc, ...eventMappings];
		}, [])
		.reduce((acc, mapping) => {
			const {sourceEventName} = mapping;
			acc[sourceEventName] = [
				...(acc[sourceEventName] ? acc[sourceEventName] : []),
				mapping
			];
			return acc;
		}, {});

	const offRowEventMappings = get(offRowEventMappingsByNodeId, [nodeId], []);

	const dependentControllerMappings = (
		dependencies ? Object.values(dependencies) : []
	).reduce((acc, dep) => [...acc, ...(dep.eventMappings || [])], []);

	const compElemEventMappings = getConsolidatedEventMappings(nodeId, [
		...eventMappings,
		...offRowEventMappings,
		...dependentControllerMappings
	]);

	const selectableProperties = properties
		.filter(({selectable}) => selectable)
		.map(({name: propName}) => ({nodeId, propName, derived, definitionSysId}));

	return mergeConfigs(
		[
			{
				eventMappings: {...compElemEventMappings, ...dataElemEventMappings},
				selectableProperties,
				hasViewportScreenNode: tagName === UXF_VIEWPORT_SCREEN_TAG
			}
		].concat(childrenConfigs)
	);
};

const mergeConfigs = (configs) => {
	return configs.reduce(
		(acc, config) => {
			const {eventMappings, selectableProperties, hasViewportScreenNode} =
				config;
			return {
				eventMappings: {
					...mergeWith(acc.eventMappings, eventMappings, mergeActions)
				},
				selectableProperties:
					acc.selectableProperties.concat(selectableProperties),
				hasViewportScreenNode:
					hasViewportScreenNode || acc.hasViewportScreenNode
			};
		},
		{eventMappings: {}, selectableProperties: [], hasViewportScreenNode: false}
	);
};

// fixme: this is a candidate function for move to the Java layer
export const getConsolidatedEventMappings = (nodeId, eventMappings = []) => {
	return eventMappings.reduce((acc, eventMapping) => {
		const {sourceEventName} = eventMapping;
		acc[sourceEventName] = [
			...(acc[sourceEventName] ? acc[sourceEventName] : []),
			{
				nodeId,
				...eventMapping
			}
		];
		return acc;
	}, {});
};

export default (
	descendants,
	rootNode,
	csdbNode,
	pdbNodes,
	offRowEventMappingsByNodeId,
	serverProducedConsolidatedConfig
) => {
	const consolidatedConfig = serverProducedConsolidatedConfig
		? serverProducedConsolidatedConfig
		: getConsolidatedConfig(descendants, rootNode, offRowEventMappingsByNodeId);
	const hasPdbNode = isArray(pdbNodes) && pdbNodes.length > 0;
	if (isNil(csdbNode) && !hasPdbNode) return consolidatedConfig;
	else {
		const configs = [consolidatedConfig];
		if (!isNil(csdbNode)) configs.push(getConsolidatedConfig([], csdbNode));
		if (hasPdbNode) {
			for (const pdbNode of pdbNodes) {
				configs.push(getConsolidatedConfig([], pdbNode));
			}
		}
		return mergeConfigs(configs);
	}
};
