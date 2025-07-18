import {default as console} from '../../../utils/getLogger.js';
import {INPUTS} from '../../constants';

const CONTROLLER_SELF_OUTPUT_PROPS = Symbol(
	'_INTERNAL_CONTROLLER_SELF_OUTPUT_PROPS_'
);

function getControllerDataOutputBindingMap(uxControllerNodes) {
	return uxControllerNodes.reduce((acc, uxControllerNode) => {
		if (uxControllerNode.dependencies) {
			const initialObject = uxControllerNode.dependencies
				? {
						[CONTROLLER_SELF_OUTPUT_PROPS]: [
							...uxControllerNode.properties.map((prop) => prop.name)
						]
				  }
				: {};

			acc[uxControllerNode.nodeId] = Object.values(
				uxControllerNode.dependencies
			).reduce((acc, controllerDependencies) => {
				acc[controllerDependencies.name] = {
					nodeId: controllerDependencies.controllerElementId,
					dependencyProps: [...controllerDependencies.dependencyProps]
				};
				return acc;
			}, initialObject);
		}

		return acc;
	}, {});
}

function getDataBinding(address) {
	return {
		type: 'DATA_OUTPUT_BINDING',
		binding: {
			address
		}
	};
}

function getResolvedAddress(controllerDependencyMap, uxValue) {
	const {
		binding: {address = []}
	} = uxValue;

	// if controllerDependencyMap is undefined/empty, continue legacy single controller flow
	if (
		!controllerDependencyMap ||
		Object.keys(controllerDependencyMap).length == 0
	) {
		return address;
	}

	const [dependencyKey, ...newAddress] = address;

	if (
		!dependencyKey ||
		Object.keys(controllerDependencyMap).length === 0 ||
		!controllerDependencyMap[dependencyKey]
	) {
		console.error('Dependency key not found in controller map!');
		return address;
	}

	// The first element of the array is the depKey which is not needed for subsequent data binding resolution
	return newAddress;
}

function getDataElementIdFromControllerDependencyMap(
	uxValue,
	controllerDependencyMap
) {
	const {
		binding: {address = []}
	} = uxValue;
	const [dependencyKey] = address;
	const dataElementId = controllerDependencyMap?.[dependencyKey];

	if (!dataElementId) {
		console.warn('No dataElementId found in controllerDependencyMap!!!');
	}

	return dataElementId;
}

function getOverrideControllerAlias(controllerAliasMap, resolvedDataElementId) {
	let alias = [];
	Object.keys(controllerAliasMap).forEach((ctrlOverrideElementId) => {
		if (
			controllerAliasMap[ctrlOverrideElementId]?.elementId ==
			resolvedDataElementId
		)
			alias = controllerAliasMap[ctrlOverrideElementId].alias;
	});
	return alias;
}

export default function getControllerDataOutputBindingFactory(
	uxControllerNodes,
	controllerAliasMap
) {
	const outputBindingMapByElementId = getControllerDataOutputBindingMap(
		uxControllerNodes
	);
	return (dataElementId, uxValue, controllerDependencyMap) => {
		const resolvedDataElementId =
			dataElementId ||
			getDataElementIdFromControllerDependencyMap(
				uxValue,
				controllerDependencyMap
			);
		const outputBindingMap =
			outputBindingMapByElementId?.[resolvedDataElementId];

		if (!outputBindingMap) return;

		const address = getResolvedAddress(controllerDependencyMap, uxValue);

		if (outputBindingMap?.[address[0]]) {
			let [dependencyName, propName, ...dotWalkPath] = address;

			if (propName === INPUTS) propName = dotWalkPath.shift();

			const {dependencyProps = [], nodeId} =
				outputBindingMap?.[dependencyName] ?? {};

			const dependencyHasProp = dependencyProps.indexOf(propName) !== -1;

			if (dependencyHasProp) {
				return getDataBinding([nodeId, propName, ...dotWalkPath]);
			}
		} else {
			if (
				address[0] === INPUTS ||
				getOverrideControllerAlias(
					controllerAliasMap,
					resolvedDataElementId
				)?.indexOf(address[0]) >= 0
			)
				address.shift();

			if (
				outputBindingMap[CONTROLLER_SELF_OUTPUT_PROPS].indexOf(address[0]) !==
				-1
			) {
				return getDataBinding([resolvedDataElementId, ...address]);
			} else {
				return;
			}
		}
	};
}
