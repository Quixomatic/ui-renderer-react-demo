import {actionTypes} from '@servicenow/ui-core';
import {isEmpty} from '@devsnc/snowdash';
import {isEqual} from '@devsnc/snowdash';
import {camelCase} from '../../../factory/utils';
import {memoize} from '@servicenow/ui-utils';

import getResolversForView from '../../../factory/UxValueResolver/getResolversForView';
import resolveForView from '../../../factory/UxValueResolver/resolveForView';
import {getNodeId, getNodeIds} from '../../../factory/utils';
import {
	UXF_MACROPONENT_OUTPUT_PROPERTY_UPDATED,
	propertyTypes,
	INPUTS,
	MACROPONENT_VALUE_UPDATED
} from '../../constants';

const {COMPONENT_RENDER_REQUESTED} = actionTypes;

const buildOutputPropsMetadata = memoize(
	(
		sysId,
		outputPropMappings,
		csdbNode,
		proxydbNodes,
		macroponentPropertyDefinitions,
		externalControllerDependencies,
		controllerAliasMap,
		controllerRenderSkipEnabled
	) => {
		const csdbNodeId = getNodeId(csdbNode);
		const pdbNodeIds = getNodeIds(proxydbNodes);

		const resolversForOutputProperties = getResolversForView(
			sysId,
			macroponentPropertyDefinitions,
			csdbNodeId,
			pdbNodeIds,
			externalControllerDependencies,
			proxydbNodes,
			controllerAliasMap
		);

		const selectableProperties = {};
		for (const [outputPropName] of Object.entries(outputPropMappings)) {
			selectableProperties[camelCase(outputPropName)] = {
				selectable: true,
				shouldRenderWhenSet: !controllerRenderSkipEnabled
			};
		}

		return {resolversForOutputProperties, selectableProperties};
	}
);

const getOutputPropertyValues = (
	outputPropMappings,
	resolversForOutputProperties,
	seismicProperties,
	state
) => {
	const {CLIENT_TRANSFORM_SCRIPT} = propertyTypes;
	const EXCLUDED_TYPES = [CLIENT_TRANSFORM_SCRIPT];
	const newOutputPropertyValues = {};

	for (const [outputPropName, uxValue] of Object.entries(outputPropMappings)) {
		const {type} = uxValue;

		if (EXCLUDED_TYPES.includes(type)) continue;

		const selectablePropName = camelCase(outputPropName);
		const newPropValue = resolveForView(
			resolversForOutputProperties,
			seismicProperties,
			state,
			uxValue
		);

		if (!isEqual(seismicProperties[selectablePropName], newPropValue)) {
			newOutputPropertyValues[selectablePropName] = newPropValue;
		}
	}
	return newOutputPropertyValues;
};

const updateOutputProps = (
	newOutputPropertyValues,
	inputPropMatchings,
	updateProperties,
	dispatch,
	state,
	mcpSysId,
	dispatchMcpUpdates
) => {
	if (!isEmpty(newOutputPropertyValues)) {
		if (dispatchMcpUpdates) {
			// Dispatching the new props for UIB's WYSIWYG stage
			dispatch(MACROPONENT_VALUE_UPDATED, {
				macroponentSysId: mcpSysId,
				data: newOutputPropertyValues
			});
		}

		// UXF runtime expects that selectable properties will be exposed containing
		// the output data
		updateProperties(newOutputPropertyValues);
		// UI Builder designtime expects that an event will be dispatched notifying
		// that output data has been updated.
		// TODO: Only dispatch this when used in a UIB context (will require public API change)
		const inputProps = getInputProps(state.properties, inputPropMatchings);
		newOutputPropertyValues[INPUTS] = inputProps;
		dispatch(UXF_MACROPONENT_OUTPUT_PROPERTY_UPDATED, newOutputPropertyValues);
	}
};

const getInputProps = (properties, inputPropMatchings) => {
	const inputPropVals = {};
	inputPropMatchings.forEach((key) => {
		if (properties[key.name]) inputPropVals[key.name] = properties[key.name];
	});
	return inputPropVals;
};

export default (
	outputPropMappings,
	inputPropMatchings,
	tree,
	macroponentPropertyDefinitions,
	externalControllerDependencies,
	controllerAliasMap,
	controllerRenderSkipEnabled,
	dispatchMcpUpdates = false
) => {
	const {
		id,
		clientStateDataBrokerNode: csdbNode,
		proxyDataBrokerNodes: proxydbNodes
	} = tree;

	const {resolversForOutputProperties, selectableProperties} =
		buildOutputPropsMetadata(
			id,
			outputPropMappings,
			csdbNode,
			proxydbNodes,
			macroponentPropertyDefinitions,
			externalControllerDependencies,
			controllerAliasMap,
			controllerRenderSkipEnabled
		);

	return {
		name: 'outputPropertyResolver',
		actionHandlers: {
			[COMPONENT_RENDER_REQUESTED]: {
				effect: ({
					properties: seismicProperties,
					state,
					updateProperties,
					dispatch
				}) => {
					const newOutputPropertyValues = getOutputPropertyValues(
						outputPropMappings,
						resolversForOutputProperties,
						seismicProperties,
						state
					);

					updateOutputProps(
						newOutputPropertyValues,
						inputPropMatchings,
						updateProperties,
						dispatch,
						state,
						id,
						dispatchMcpUpdates
					);
				}
			}
		},
		properties: selectableProperties
	};
};
