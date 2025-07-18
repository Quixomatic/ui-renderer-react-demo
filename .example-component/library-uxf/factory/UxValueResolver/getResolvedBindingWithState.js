import {compact} from '@devsnc/snowdash';
import {camelCase} from '../utils';
import {memoize} from '@servicenow/ui-utils';
import {
	getDbLifecycleFetchingProp,
	getDbLifecycleFetchSuccessProp,
	getDbOutputProp,
	getNamepsacedPropName,
	getControllerDependencyProp,
	getNamespacedComponentId
} from '../utils';
import {default as console} from '../../utils/getLogger.js';
import {get} from '@devsnc/snowdash';
import {
	propertyTypes,
	CONTEXT_PROPS_IDENTIFIER,
	APP_PROPS_IDENTIFIER,
	SYS_PROPS_IDENTIFIER,
	SESSION,
	SEISMIC_STATE_KEY_BEHAVIORS,
	SELECTABLE_PROP_RESOLVER_PROP_NAME_PREFIX,
	DBK_LIFECYCLE_IDENTIFIER,
	DBK_LIFECYCLE_FETCHING_IDENTIFIER,
	DBK_LIFECYCLE_FETCH_SUCCESS_IDENTIFIER,
	META_PROP_NAME_PARENT_PAGE_COMPONENT_ID,
	META_PROP_NAME_PARENT_PAGE_MACROPONENT_SYS_ID,
	META_PROP_NAME_CONTROLLER_MAP,
	META_PROP_NAME_PARENT_CONTROLLER_DEPENDENCY_MAP,
	INPUTS
} from '../constants';
import getViewportApi from '../behaviorFactories/viewportRuntime/getViewportApi';
import {unstableResolvePropertySelectorValue} from '@servicenow/ui-core';
import {isNil} from '@devsnc/snowdash';
import {isArray} from '@devsnc/snowdash';
import parentDataStore from '../getParentDataStore';

const {
	CONTEXT_BINDING,
	ELEMENT_BINDING,
	DATA_OUTPUT_BINDING,
	STATE_BINDING,
	VIEWPORT_BINDING,
	REPEATER_ITEM_BINDING
} = propertyTypes;

export const getSelectableProp = (element, prop, path = []) => {
	return `@${element}/${camelCase(prop)}${
		path.length > 0 ? '.' + path.join('.') : ''
	}`;
};

export const getPlaceholderPropName = memoize(
	(nodeId, propName) =>
		camelCase(
			getNamepsacedPropName([
				SELECTABLE_PROP_RESOLVER_PROP_NAME_PREFIX,
				nodeId,
				propName
			])
		),
	(nodeId, propName) => nodeId + propName
);

export const resolveSelectableProperty = (properties, propName, path = []) => {
	return get(properties, [propName, ...path]);
};

const unstableResolveSelectableProperty = (
	nodeId,
	targetElementId,
	propName,
	path = []
) => {
	return unstableResolvePropertySelectorValue(
		getSelectableProp(
			getNamespacedComponentId(nodeId, targetElementId),
			propName,
			path
		)
	);
};

const resolveDerivedSelectableProperty = (
	properties,
	controllerAliasMap,
	targetElementId,
	propName,
	path = []
) => {
	const parentComponentId = properties[META_PROP_NAME_PARENT_PAGE_COMPONENT_ID];
	const controllerDependencyMap =
		properties[META_PROP_NAME_CONTROLLER_MAP] || {};
	const parentControllerDependencyMap =
		properties[META_PROP_NAME_PARENT_CONTROLLER_DEPENDENCY_MAP] || {};
	const realTargetgetElementId = controllerDependencyMap[targetElementId];

	// check if the binding is bound to the controller's dependencies
	if (parentControllerDependencyMap[realTargetgetElementId]) {
		if (parentControllerDependencyMap[realTargetgetElementId][propName]) {
			if (
				path[0] === INPUTS ||
				controllerAliasMap[targetElementId]?.alias.indexOf(propName) >= 0
			)
				path.shift();

			const [prop, ...newPath] = path;
			return unstableResolveSelectableProperty(
				parentComponentId,
				parentControllerDependencyMap[realTargetgetElementId][propName],
				prop,
				newPath
			);
		}
	}

	return unstableResolveSelectableProperty(
		parentComponentId,
		controllerAliasMap[realTargetgetElementId]?.elementId ||
			realTargetgetElementId,
		propName,
		path
	);
};

const resolveControllerSelectableProperty = (
	properties,
	controllerAliasMap,
	targetElementId,
	propName,
	path = []
) => {
	const controllerDependencyMap = properties[META_PROP_NAME_CONTROLLER_MAP];
	const parentControllerDependencyMap =
		properties[META_PROP_NAME_PARENT_CONTROLLER_DEPENDENCY_MAP] || {};
	const realTargetgetElementId = controllerDependencyMap?.[targetElementId];

	if (
		propName === INPUTS ||
		controllerAliasMap[targetElementId]?.alias.indexOf(propName) >= 0
	) {
		propName = path.shift();
	}

	targetElementId =
		controllerAliasMap[targetElementId]?.elementId || targetElementId;

	// main page case or the internal data brokers of the subpage case
	//TODO: resolve to local controller in a suppage first
	if (
		!controllerDependencyMap ||
		(!controllerDependencyMap[targetElementId] &&
			!parentControllerDependencyMap?.[realTargetgetElementId] &&
			!controllerAliasMap[realTargetgetElementId]?.elementId &&
			!controllerAliasMap[targetElementId]?.elementId)
	)
		return unstableResolveSelectableProperty(
			properties.nowId,
			targetElementId,
			propName,
			path
		);

	return resolveDerivedSelectableProperty(
		properties,
		controllerAliasMap,
		targetElementId,
		propName,
		path
	);
};

export const resolveContextBinding = (properties, category, address) => {
	const [targetElementId, targetPropName, ...targetPath] = address;
	switch (category) {
		case SESSION:
			return resolveSelectableProperty(properties, 'userSessionInfo', [
				'output',
				...address
			]);
		case APP_PROPS_IDENTIFIER:
			return resolveSelectableProperty(properties, 'nowAppProps', address);
		case SYS_PROPS_IDENTIFIER:
			return resolveSelectableProperty(properties, 'nowSysProps', [
				address.join('.')
			]);
		case CONTEXT_PROPS_IDENTIFIER: {
			//With the category field on context bindings, each field is essentially shifted
			//Redefining constants to make more sense.
			const propName = targetElementId;
			const propPath = compact([targetPropName, ...targetPath]);

			return resolveSelectableProperty(properties, propName, propPath);
		}
		default:
			//This can be removed once we stop supporting backwards compatible context bindings without category
			return resolveSelectableProperty(properties, targetPropName, targetPath);
	}
};

const isSelectablePropertyResolvable = (
	targetElementId,
	pdbNodeIds,
	controllerAliasMap,
	properties
) => {
	const parentMacroponentSysId =
		properties[META_PROP_NAME_PARENT_PAGE_MACROPONENT_SYS_ID];
	const {pdbNodeIds: parentPdbNodeId = []} = parentDataStore.get(
		parentMacroponentSysId
	);

	const checkingPdbNodeIds = [...parentPdbNodeId, ...pdbNodeIds];
	const controllerDependencyMap =
		properties[META_PROP_NAME_CONTROLLER_MAP] || {};

	return (
		checkingPdbNodeIds.includes(targetElementId) ||
		controllerAliasMap[targetElementId] ||
		(controllerDependencyMap &&
			(checkingPdbNodeIds.includes(controllerDependencyMap[targetElementId]) ||
				checkingPdbNodeIds.includes(
					controllerAliasMap[controllerDependencyMap[targetElementId]]
				)))
	);
};

// fixme: add validation layer for selectable prop ... this is probably not the right place any more, but add it somewhere
export default (
	csdbNodeId,
	pdbNodeIds,
	externalControllerDependencies,
	controllerAliasMap = {},
	properties,
	state,
	type,
	{address},
	category,
	repeaterItem
) => {
	const [targetElementId, targetPropName, ...targetPath] = address;

	switch (type) {
		case STATE_BINDING:
			//fixme: add protections so people are only getting defined state properties
			if (targetElementId === SEISMIC_STATE_KEY_BEHAVIORS) return;
			return resolveSelectableProperty(
				state,
				targetElementId,
				compact([targetPropName, ...targetPath])
			);
		case CONTEXT_BINDING:
			return resolveContextBinding(properties, category, address);
		case ELEMENT_BINDING:
			return unstableResolveSelectableProperty(
				properties.nowId,
				targetElementId,
				targetPropName,
				targetPath
			);
		case VIEWPORT_BINDING:
			return get(getViewportApi(state), address);
		case REPEATER_ITEM_BINDING:
			if (['value', 'index', 'parent'].includes(category)) {
				// repeaters can support an array of simple types such as
				// an array of strings, booleans etc as well
				if (isArray(address) && address.length) {
					return get(repeaterItem, [category, ...address], null);
				}
				// address may not exist for children components
				// bound to simple types: @item.value
				return get(repeaterItem, category, null);
			} else {
				console.warn(`@item.${category} is not a supported repeater binding.`);
			}
			break;
		case DATA_OUTPUT_BINDING:
			// For CSDB:
			if (!isNil(csdbNodeId) && csdbNodeId === targetElementId) {
				return unstableResolveSelectableProperty(
					properties.nowId,
					targetElementId,
					targetPropName,
					targetPath
				);
			} else if (
				isSelectablePropertyResolvable(
					targetElementId,
					pdbNodeIds,
					controllerAliasMap,
					properties
				)
			) {
				return resolveControllerSelectableProperty(
					properties,
					controllerAliasMap,
					targetElementId,
					targetPropName,
					targetPath
				);
			} else if (externalControllerDependencies.includes(targetElementId)) {
				let propName = targetPropName;
				if (targetPropName === INPUTS) propName = targetPath.shift();

				return resolveSelectableProperty(
					properties,
					getControllerDependencyProp(targetElementId, propName),
					targetPath
				);
			}
			// For Standard DBK lifecycle state:
			else if (targetPropName === DBK_LIFECYCLE_IDENTIFIER) {
				const [pathHead, ...pathTail] = targetPath;
				if (pathHead === DBK_LIFECYCLE_FETCHING_IDENTIFIER)
					return resolveSelectableProperty(
						properties,
						getDbLifecycleFetchingProp(targetElementId),
						pathTail
					);
				if (pathHead === DBK_LIFECYCLE_FETCH_SUCCESS_IDENTIFIER)
					return resolveSelectableProperty(
						properties,
						getDbLifecycleFetchSuccessProp(targetElementId),
						pathTail
					);
			}
			// For Standard DBK output state:
			else
				return resolveSelectableProperty(
					properties,
					getDbOutputProp(targetElementId),
					[targetPropName, ...targetPath]
				);
			break;
		default:
			console.warn('Unsupported binding encountered');
			return;
	}
};
