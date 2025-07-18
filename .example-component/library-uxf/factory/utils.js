import {isEmpty} from '@devsnc/snowdash';
import {has} from '@devsnc/snowdash';
import {get} from '@devsnc/snowdash';
import {includes} from '@devsnc/snowdash';
import {snakeCase as snakeCaseLodash} from '@devsnc/snowdash';
import {kebabCase as kebabCaseLodash} from '@devsnc/snowdash';
import {camelCase as camelCaseLodash} from '@devsnc/snowdash';
import {map} from '@devsnc/snowdash';
import {memoize} from '@servicenow/ui-utils';
import {
	DBK_LIFECYCLE_FETCH_SUCCESS_KEY,
	DBK_LIFECYCLE_FETCHING_KEY,
	DBK_LIFECYCLE_IDENTIFIER,
	DBK_NAMESPACE_PROP_NAME_PREFIX,
	UXF_META_PROP_NAME_PREFIX,
	DBK_OUTPUT_IDENTIFIER,
	internalActions,
	MACROPONENT_FEATURES,
	GLIDE_FORM_DATABROKER
} from './constants';
import getMostRecentlyUsedScreens from './getMostRecentlyUsedScreens';
import {getUxGlobal} from '../templateLoader/utils';
import {isNil} from '@devsnc/snowdash';

import {mapValues} from '@devsnc/snowdash';

export {getMacroponentTagName} from '../utils/macroponent.js';

export const getActionTransformerTagName = (id) =>
	`macroponent-action-transformer-${id}`;

export const getScreenActionTransformerTagName = (id) =>
	`screen-action-transformer-${id}`;

export const getNamespacedComponentId = (
	namespace,
	nodeId,
	repeaterItem = null
) => {
	if (isNil(get(repeaterItem, 'index', null))) {
		return !isNil(nodeId) ? `${namespace}-${nodeId}` : null;
	}
	return `${namespace}-${getRepeatedNodeId(nodeId, repeaterItem)}${nodeId}`;
};

const getRepeatedNodeId = (nodeId, repeaterItem) => {
	if (isEmpty(repeaterItem)) {
		return '';
	}
	return `${getRepeatedNodeId(nodeId, repeaterItem.parent)}${
		repeaterItem.repeaterNodeId
	}_${repeaterItem.index}_`;
};

export const camelCase = memoize((input) => camelCaseLodash(input));
export const kebabCase = memoize((input) => kebabCaseLodash(input));
export const snakeCase = memoize((input) => snakeCaseLodash(input));

export const getNodeId = (node) => get(node, ['nodeId']);

export const getNodeIds = (nodes) =>
	map(nodes, (node) => get(node, ['nodeId']));

export const isActionBlacklisted = (actionName, blacklist = []) =>
	includes(internalActions, actionName) || includes(blacklist, actionName);

export const getNamepsacedPropName = (tokens = []) =>
	tokens.map(kebabCase).join('-');

export const getKebabCasedDbOutputProp = memoize((dbId) =>
	getNamepsacedPropName([
		DBK_NAMESPACE_PROP_NAME_PREFIX,
		DBK_OUTPUT_IDENTIFIER,
		dbId
	])
);

export const getKebabCasedControllerDependencyProp = memoize(
	(dependencyName, outputPropName) =>
		getNamepsacedPropName([
			'dep-',
			UXF_META_PROP_NAME_PREFIX,
			dependencyName,
			outputPropName
		]),
	(dependencyName, outputPropName) => dependencyName + outputPropName
);

export const getKebabCaseDbLifecycleFetchingProp = memoize((dbId) =>
	getNamepsacedPropName([
		DBK_NAMESPACE_PROP_NAME_PREFIX,
		DBK_LIFECYCLE_IDENTIFIER,
		DBK_LIFECYCLE_FETCHING_KEY,
		dbId
	])
);

export const getKebabCaseDbLifecycleFetchSuccessProp = memoize((dbId) =>
	getNamepsacedPropName([
		DBK_NAMESPACE_PROP_NAME_PREFIX,
		DBK_LIFECYCLE_IDENTIFIER,
		DBK_LIFECYCLE_FETCH_SUCCESS_KEY,
		dbId
	])
);

export const getControllerDependencyProp = memoize(
	(dependencyName, outputPropName) =>
		camelCase(
			getKebabCasedControllerDependencyProp(dependencyName, outputPropName)
		),
	(dependencyName, outputPropName) => dependencyName + outputPropName
);

export const getDbOutputProp = memoize((dbId) =>
	camelCase(getKebabCasedDbOutputProp(dbId))
);

export const getDbLifecycleFetchingProp = memoize((dbId) =>
	camelCase(getKebabCaseDbLifecycleFetchingProp(dbId))
);

export const getDbLifecycleFetchSuccessProp = memoize((dbId) =>
	camelCase(getKebabCaseDbLifecycleFetchSuccessProp(dbId))
);

export function getMacroponentFeatures(disabledFeatures = []) {
	return mapValues(
		MACROPONENT_FEATURES,
		(feature) => !disabledFeatures.includes(feature)
	);
}

export function mapSubRoutesParentCompositionElementId(subroutes) {
	return map(subroutes, (s) =>
		isEmpty(s.parentCompositionElementId)
			? {...s, parentCompositionElementId: 'uxf-viewport-screen'}
			: s
	);
}

export function isValidElementEventMapping(
	forScreenActionTransformer,
	macroponentSysId,
	sourceNodeId,
	nodeId,
	containingMacroponentSysId,
	eventMetaSourceCorrelationId,
	mappingSourceCorrelationId
) {
	const isValidEventMapping =
		sourceNodeId === nodeId &&
		(forScreenActionTransformer ||
			containingMacroponentSysId === macroponentSysId);

	if (eventMetaSourceCorrelationId && mappingSourceCorrelationId)
		return (
			isValidEventMapping &&
			eventMetaSourceCorrelationId == mappingSourceCorrelationId
		);

	return isValidEventMapping;
}

export function getRenderedScreens(
	isNonDestructive,
	isUxfViewportScreen,
	viewportContent
) {
	let renderedScreens = undefined;

	if (
		has(viewportContent, 'screens') ||
		has(viewportContent, 'currentScreen')
	) {
		if (isNonDestructive && isUxfViewportScreen) {
			// For MCPs having viewport screen, get the recently used screens from cache
			renderedScreens = getMostRecentlyUsedScreens(viewportContent);
		} else if (isNonDestructive) {
			renderedScreens = viewportContent.screens;
		} else {
			renderedScreens = [viewportContent.currentScreen];
		}
	}

	return renderedScreens;
}

export const getPrefetchLimits = memoize(() => {
	return get(
		window,
		['ux_globals', 'routeConfiguration', 'prefetchLimits'],
		{}
	);
});

export function getControllerNodeIdWithGlideForm(proxyDataBrokerNodes) {
	const controllerProxyNodes = proxyDataBrokerNodes.filter(
		(e) => e.type === 'CONTROLLER'
	);

	const databrokerNode = controllerProxyNodes.find(
		(e) =>
			e.dataBrokers.find(
				(el) => el.definitionSysId === GLIDE_FORM_DATABROKER
			) !== undefined
	);
	return databrokerNode?.nodeId;
}

export function getShouldHaveWrappedEventDispatch(
	descendants,
	clientStateDataBrokerNode
) {
	const hasDecendants = Object.keys(descendants).length !== 0;
	const hasClientStateDB = clientStateDataBrokerNode != null;

	if (!hasDecendants && hasClientStateDB) return false;

	return true;
}

export function getControllerAliasMapDetails(
	incomingUxControllerNodes,
	incomingControllerAliasMap
) {
	const controllerAliasMapDetails = {};
	incomingUxControllerNodes.forEach((node) => {
		if (incomingControllerAliasMap[node.nodeId]) {
			let elementId = incomingControllerAliasMap[node.nodeId];
			controllerAliasMapDetails[node.nodeId] = {
				elementId: elementId,
				node: {...node, nodeId: elementId},
				alias: Object.keys(node.dependencies)
			};
		}
	});
	return controllerAliasMapDetails;
}

export function getUnifiedCacheStats() {
	return getUxGlobal('__uc__cacheStats')?.getAggregateCacheStats?.() || {};
}
