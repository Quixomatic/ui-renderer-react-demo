import {createCustomElement} from '@servicenow/ui-core';
import getDataBrokerRuntimeBehavior from './databrokers/behaviors/data-broker-runtime';
import {getActionHandlers} from './getActionHandlers';
import getConsolidatedConfig from './getConsolidatedConfig';
import {get} from '@devsnc/snowdash';
import {isEmpty} from '@devsnc/snowdash';
import {compact} from '@devsnc/snowdash';
import {partial} from '@devsnc/snowdash';
import {getMacroponentView} from './getView';
import getProperties from './getProperties';
import {setMacroponentViewAdapter} from '../macroponentAdaptersApi/macroponentView';
import {
	getMacroponentTagName,
	getNodeId,
	getNodeIds,
	getMacroponentFeatures,
	mapSubRoutesParentCompositionElementId,
	getPrefetchLimits,
	getControllerDependencyProp,
	getControllerNodeIdWithGlideForm,
	getShouldHaveWrappedEventDispatch,
	getControllerAliasMapDetails
} from './utils';
import getExecScriptBehavior from './behaviorFactories/execScript/getExecScriptBehavior';
import getSelectablePropResolverBehavior from './behaviorFactories/selectablePropResolver/getSelectablePropResolverBehavior';
import getOutputPropResolverBehavior from './behaviorFactories/outputPropResolver/getOutputPropResolverBehavior';
import getViewportRuntimeBehavior from './behaviorFactories/viewportRuntime/getViewportRuntimeBehavior';
import getTabsetContainerRenderBehavior from './behaviorFactories/tabsetContainerRuntime/getTabsetContainerRenderBehavior';
import getInitialState from './getInitialState';
import {getLifecyleEventsBehavior} from './behaviorFactories/getLifecyleEventsBehavior';
import {getComponentInteractiveBehavior} from './behaviorFactories/componentInteractive/getComponentInteractiveBehavior';
import getControllerDependencyEventTargetBehavior from './behaviorFactories/controllerDependency/getControllerDependencyEventTargetBehavior.js';
import getScreenConditionDataBindingResolver from './UxValueResolver/resolveForScreenConditionEvaluator.js';
import shouldTrackDBExecutionLifecycle from './databrokers/behaviors/data-broker-runtime/shouldTrackDBExecutionLifecycle';
import {
	MACROPONENT_FEATURES as FEATURES,
	META_PROP_NAME_APP_CONFIG_SYS_ID,
	UXF_TYPE_VIEWPORT,
	NOW_UXF_MODAL_VIEWPORT,
	META_PROP_NAME_PARENT_PAGE_COMPONENT_ID,
	META_PROP_NAME_PARENT_PAGE_MACROPONENT_SYS_ID,
	META_PROP_NAME_CONTROLLER_MAP,
	META_PROP_NAME_PARENT_CONTROLLER_DEPENDENCY_MAP,
	CONTROLLER
} from './constants.js';
import {default as console} from '../utils/getLogger.js';
import {HANDLING_SCOPE, UXF_INTERNAL_HANDLING_SCOPE_SAFETY} from './constants';
import getSubroutesWithParsedClientConditions from './behaviorFactories/viewportRuntime/getSubroutesWithParsedClientConditions.js';
import parentDataStore from './getParentDataStore';
import getPopoverOpenRequestedBehavior from './behaviorFactories/popoverOpenRequested/getPopoverOpenRequestedBehavior';
import {isNil} from '@devsnc/snowdash';
import getUxfSysProp from '../utils/getUxfSysProp';
import {
	intentTranslatorBehavior,
	intentMediatorBehavior
} from '@devsnc/library-intent-channel';
import getTranslatorBehavior from './behaviorFactories/translatorBehavior/getTranslatorBehavior';

const SYS_PROP_CONTROLLER_RENDER_SKIP_ENABLED =
	getUxfSysProp(
		'glide.uxf.lib.__temp__.controller_render_skip.enabled',
		'true'
	) === 'true';

/**
 * @param input { import("../types/generatedTypescript/UxFrameworkTypes").RTMacroponentShell }
 */
export const createMacroponent = (
	input,
	_,
	addonMetadata = {},
	tagNameSuffix,
	withAppConfigAgnosticSubRoutes,
	prefetchDatabrokerPromises = {},
	serverProducedConsolidatedConfig,
	dispatchMcpUpdates = false
) => {
	const {
		id,
		rootNode,
		descendants,
		dataPipelines,
		clientStateDataBrokerNode,
		proxyDataBrokerNodes: incomingProxyDataBrokerNodes = [],
		dispatchedEventNames,
		handledEventNames,
		rootHandledEventNames: rootNodeHandledEventNames,
		dataShell: incomingDataShell,
		disabledFeatures,
		outputPropMappings = {},
		uxControllerNodes: incomingUxControllerNodes = [],
		externalControllerDependencies = [],
		controllerAliasMapping: incomingControllerAliasMap = {}
	} = input;

	const externalControllerDependencyNames = externalControllerDependencies.map(
		(dependency) => dependency.name
	);

	const controllerAliasMapDetails = getControllerAliasMapDetails(
		incomingUxControllerNodes,
		incomingControllerAliasMap
	);
	// Here, we are massaging controller metadata to a form that our proxy data broker processor can handle
	const uxControllerNodes = incomingUxControllerNodes
		.filter((node) => !incomingControllerAliasMap[node.nodeId])
		.map((node) => {
			node.tagName = `macroponent-${node.definitionSysId}`;
			const inputProperties = node.properties.map((prop) => {
				return {
					name: prop.name,
					selectable: true
				};
			});
			const outputProperties = Object.keys(node.outputPropMappings).map(
				(outputPropMapping) => {
					return {
						name: outputPropMapping,
						selectable: true
					};
				}
			);
			node.properties = [...inputProperties, ...outputProperties];

			node.type = 'CONTROLLER';
			(node.dependencies ? Object.values(node.dependencies) : []).forEach(
				(dep) => {
					(dep.eventMappings || []).forEach((em) => {
						em.dataElementId = em.dataElementId || node.controllerElementId;
						// IMPORTANT: this is the only legal place t o set this -- helps prevent abuse from the metadata
						em[HANDLING_SCOPE] = {
							[UXF_INTERNAL_HANDLING_SCOPE_SAFETY]: node.nodeId
						};
					});
				}
			);
			return node;
		});

	const dataStore = parentDataStore.getDerivedData(id);
	const proxyDataBrokerNodes = [
		...dataStore.proxyDataBrokerNodes,
		...incomingProxyDataBrokerNodes,
		...uxControllerNodes
	];

	const dataShell = {
		dataElements: {
			...dataStore.dataShell.dataElements,
			...incomingDataShell.dataElements
		},
		dataBrokers: {
			...dataStore.dataShell.dataBrokers,
			...incomingDataShell.dataBrokers
		}
	};

	const controllerAliasMap = {
		...controllerAliasMapDetails,
		...dataStore.controllerAliasMap
	};

	const macroponentFeatures = getMacroponentFeatures(disabledFeatures);

	const {offRowEventMappings} = addonMetadata;
	const {
		eventMappings: consolidatedEventMappings,
		selectableProperties = [],
		hasViewportScreenNode
	} = getConsolidatedConfig(
		descendants,
		rootNode,
		clientStateDataBrokerNode,
		[
			...proxyDataBrokerNodes,
			...Object.values(controllerAliasMapDetails).map((alias) => alias.node)
		],
		offRowEventMappings,
		serverProducedConsolidatedConfig
	);

	// MCP has viewportScreen, map subroutes with viewport element Id to support compatibility
	// otherwise continue to use subroutes.
	const subroutes = hasViewportScreenNode
		? mapSubRoutesParentCompositionElementId(addonMetadata.subroutes)
		: addonMetadata.subroutes;

	const extensionPointSubroutes =
		subroutes?.filter(({extensionPoint}) => !!extensionPoint) || [];
	extensionPointSubroutes
		.reduce((acc, {macroponents}) => [...acc, ...macroponents], [])
		.forEach(({macroponentSysId}) => {
			parentDataStore.setDerivedData(macroponentSysId, {
				proxyDataBrokerNodes,
				dataShell,
				controllerAliasMap
			});
		});

	let uxfViewportModalMap = [];
	// eslint-disable-next-line no-unused-vars
	for (const [key, value] of Object.entries(descendants)) {
		value.forEach((entry) => {
			if (
				entry.tagName === NOW_UXF_MODAL_VIEWPORT &&
				entry.type === UXF_TYPE_VIEWPORT
			) {
				uxfViewportModalMap.push(entry.nodeId);
			}
		});
	}

	const properties = {
		...getProperties(rootNode),
		[META_PROP_NAME_PARENT_PAGE_COMPONENT_ID]: {},
		[META_PROP_NAME_PARENT_PAGE_MACROPONENT_SYS_ID]: {},
		[META_PROP_NAME_CONTROLLER_MAP]: {},
		[META_PROP_NAME_PARENT_CONTROLLER_DEPENDENCY_MAP]: {}
	};
	externalControllerDependencies.forEach((dep) => {
		dep.dependencyProps.forEach((dataProp) => {
			properties[getControllerDependencyProp(dep.name, dataProp)] = {};
		});
	});

	const csdbNodeId = getNodeId(clientStateDataBrokerNode);
	const pdbNodeIds = getNodeIds(proxyDataBrokerNodes);
	if (extensionPointSubroutes.length > 0) {
		parentDataStore.set(id, {
			dataShell: incomingDataShell,
			proxyDataBrokerNodes: incomingProxyDataBrokerNodes,
			pdbNodeIds
		});
	}

	const allNodeIds = [
		csdbNodeId,
		...pdbNodeIds,
		rootNode?.nodeId,
		...Object.values(descendants)
			.flatMap((child) => child)
			.map((child) => child?.nodeId)
	].flatMap((nodeId) => (nodeId ? [nodeId] : []));
	const allTagNames = [
		clientStateDataBrokerNode?.tagName,
		...proxyDataBrokerNodes.map((pdbNode) => pdbNode?.tagName),
		rootNode?.tagName,
		...Object.values(descendants)
			.flatMap((child) => child)
			.map((child) => child?.tagName)
	].flatMap((tagName) => (tagName ? [tagName] : []));

	const {stateProperties = []} = rootNode;
	const {initialState, unresolvedInitialState} =
		getInitialState(stateProperties);

	if (isNil(id)) {
		console.error('Must provide an id to register macroponent custom elements');
	}

	// This function checks to see if this node has a controller with the glide form databroker by its sysId.
	// It is used to determine the dom outcome which is different when we have the controller.
	// This change will be reverted once sn-data-connected is refactored to not rely on the dom structure for event handling.
	const controllerNodeIdWithGlideForm = getControllerNodeIdWithGlideForm(
		proxyDataBrokerNodes.filter((node) => !node.derived)
	);

	const trackDBLifecycleFn = partial(
		shouldTrackDBExecutionLifecycle,
		descendants
	);

	let macroponentViewFn;

	const macroponentViewAdapter = (rootNode, descendants) => {
		macroponentViewFn = getMacroponentView(
			{
				id,
				rootNode,
				descendants,
				clientStateDataBrokerNode,
				proxyDataBrokerNodes,
				externalControllerDependencies: externalControllerDependencyNames,
				controllerAliasMap
			},
			properties,
			controllerNodeIdWithGlideForm,
			dispatchMcpUpdates
		);
	};

	macroponentViewAdapter(rootNode, descendants); // call to get initial view fn
	setMacroponentViewAdapter(id, macroponentViewAdapter);

	const view = (...args) => macroponentViewFn(...args);

	// Logic to determine node has a databroker node and no composition. Used to omit 'WRAPPED_EVENT_REDISPATCH' internal
	// action allowing propagation of that event without handling it in the controller or UI controller.
	// This change will be reverted once sn-data-connected is refactored to not rely on the dom structure for event handling.
	const shouldHaveWrappedEventDispatch = getShouldHaveWrappedEventDispatch(
		descendants,
		clientStateDataBrokerNode
	);

	/**!
	 * checkControllerElementFn - checks if a data element is a controller
	 */
	const checkControllerElementFn = (dataElmId) => {
		const type = get(dataShell, ['dataElements', dataElmId, 'type']);
		return type === CONTROLLER;
	};

	const macroponentProperties = {
		...properties,
		userSessionInfo: {
			//Setting default here as not all components are rendered with the template loader
			default: get(window, ['ux_globals', 'session'])
		},
		nowAppProps: {
			default: get(window, ['ux_globals', 'pageProperties'])
		},
		nowSysProps: {
			default: get(window, ['ux_globals', 'sysprops'])
		},
		[META_PROP_NAME_APP_CONFIG_SYS_ID]: {}
	};

	if (
		SYS_PROP_CONTROLLER_RENDER_SKIP_ENABLED &&
		outputPropMappings &&
		!isEmpty(outputPropMappings) &&
		clientStateDataBrokerNode &&
		clientStateDataBrokerNode.propertyValues
	) {
		const clientStateDataBrokerProperties = [];
		for (const key of Object.keys(clientStateDataBrokerNode.propertyValues)) {
			const propValue = clientStateDataBrokerNode.propertyValues[key];
			switch (propValue.type) {
				case 'CONTEXT_BINDING':
					if (propValue.binding.category == 'props')
						clientStateDataBrokerProperties.push(...propValue.binding.address);
					break;
				default:
					break;
			}
		}

		for (const key of Object.keys(macroponentProperties)) {
			if (clientStateDataBrokerProperties.find((prop) => key === prop)) {
				continue;
			}

			macroponentProperties[key] = {
				...macroponentProperties[key],
				shouldRenderWhenSet: false
			};
		}
	}

	const intentsBehaviors =
		rootNode.tagName === 'now-uxf-page'
			? [
					{
						behavior: intentTranslatorBehavior
					},
					{
						behavior: intentMediatorBehavior
					},
					{
						behavior: getTranslatorBehavior({
							uxControllerNodes,
							clientStateDataBrokerNode,
							nodeId: rootNode.nodeId,
							macroponentSysId: id,
							dataShell: incomingDataShell
						})
					}
			  ]
			: [];
	createCustomElement(getMacroponentTagName(id, tagNameSuffix), {
		view,
		behaviors: compact([
			{
				behavior: getSelectablePropResolverBehavior(
					selectableProperties,
					id,
					dispatchMcpUpdates
				)
			},
			{
				behavior: getComponentInteractiveBehavior(allNodeIds, allTagNames)
			},
			...intentsBehaviors,
			outputPropMappings && !isEmpty(outputPropMappings)
				? {
						behavior: getOutputPropResolverBehavior(
							outputPropMappings,
							rootNode.properties,
							{
								id,
								clientStateDataBrokerNode,
								proxyDataBrokerNodes
							},
							properties,
							externalControllerDependencyNames,
							controllerAliasMap,
							SYS_PROP_CONTROLLER_RENDER_SKIP_ENABLED,
							dispatchMcpUpdates
						)
				  }
				: null,
			macroponentFeatures[FEATURES.EVENT_MAPPING]
				? {
						behavior: getPopoverOpenRequestedBehavior()
				  }
				: null,
			macroponentFeatures[FEATURES.EVENT_MAPPING] &&
			((uxControllerNodes && uxControllerNodes.length) ||
				(externalControllerDependencies &&
					externalControllerDependencies.length))
				? {
						behavior: getControllerDependencyEventTargetBehavior(
							uxControllerNodes || [],
							externalControllerDependencies || []
						)
				  }
				: null,
			macroponentFeatures[FEATURES.EVENT_MAPPING]
				? {
						behavior: getExecScriptBehavior(
							csdbNodeId,
							pdbNodeIds,
							externalControllerDependencyNames,
							externalControllerDependencies,
							controllerAliasMap,
							dataShell,
							properties,
							dispatchedEventNames,
							handledEventNames,
							rootNodeHandledEventNames,
							consolidatedEventMappings,
							dispatchMcpUpdates
						)
				  }
				: null,
			macroponentFeatures[FEATURES.EVENT_MAPPING]
				? {
						behavior: getLifecyleEventsBehavior(
							unresolvedInitialState,
							stateProperties,
							consolidatedEventMappings,
							shouldHaveWrappedEventDispatch,
							csdbNodeId,
							pdbNodeIds,
							outputPropMappings,
							externalControllerDependencies,
							proxyDataBrokerNodes,
							id,
							rootNode,
							controllerAliasMap,
							dispatchMcpUpdates
						)
				  }
				: null,
			macroponentFeatures[FEATURES.DATA_BROKERS]
				? {
						behavior: getDataBrokerRuntimeBehavior(
							clientStateDataBrokerNode,
							dataShell,
							dataPipelines,
							csdbNodeId,
							pdbNodeIds,
							externalControllerDependencyNames,
							externalControllerDependencies,
							!shouldHaveWrappedEventDispatch,
							trackDBLifecycleFn,
							prefetchDatabrokerPromises,
							id,
							proxyDataBrokerNodes,
							controllerAliasMap,
							dispatchMcpUpdates
						)
				  }
				: null,
			// Viewport components assume that the closest ancestor macroponent node is the viewport host.
			// However, since data controllers require a macroponent node to work and data controllers with
			// glide form CSDB ends up wrapping the page macroponent's composition, we don't want the
			// modal-viewport-component in the composition to think that the data controller macroponent is its host.
			macroponentFeatures[FEATURES.VIEWPORTS] && shouldHaveWrappedEventDispatch
				? {
						behavior: getViewportRuntimeBehavior(
							getSubroutesWithParsedClientConditions(
								subroutes,
								uxControllerNodes,
								controllerAliasMap
							),
							properties,
							hasViewportScreenNode,
							getPrefetchLimits(),
							withAppConfigAgnosticSubRoutes,
							uxfViewportModalMap,
							getScreenConditionDataBindingResolver(
								csdbNodeId,
								pdbNodeIds,
								externalControllerDependencies,
								controllerAliasMap
							),
							descendants
						)
				  }
				: null,
			macroponentFeatures[FEATURES.VIEWPORTS] && shouldHaveWrappedEventDispatch
				? {behavior: getTabsetContainerRenderBehavior()}
				: null
		]),
		properties: macroponentProperties,
		initialState,
		actionHandlers: {
			...(macroponentFeatures[FEATURES.EVENT_MAPPING]
				? getActionHandlers(
						consolidatedEventMappings,
						false,
						id,
						handledEventNames,
						rootNodeHandledEventNames,
						properties,
						csdbNodeId,
						pdbNodeIds,
						externalControllerDependencyNames,
						controllerAliasMap,
						checkControllerElementFn
				  )
				: {})
		}
	});
};

export default {
	registerMacroponent: createMacroponent,
	getMacroponentTagName
};
