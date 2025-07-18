// eslint-disable-next-line no-unused-vars
import {createElement, Fragment} from '@servicenow/ui-renderer-snabbdom';
import {setActionStateForShortcut} from '@servicenow/now-trigger-library';

import {has} from '@devsnc/snowdash';
import {get} from '@devsnc/snowdash';
import {some} from '@devsnc/snowdash';
import {klona} from 'klona';
import nodeStore from '../macroponentInMemoryStore';
import {map} from '@devsnc/snowdash';
import {isEmpty} from '@devsnc/snowdash';
import {forEach} from '@devsnc/snowdash';
import {addActionBarForTranslator} from '../behaviorFactories/translatorBehavior/translatorDAHelpers';
import {ACTION_BAR_TAG_NAME} from '../behaviorFactories/translatorBehavior/constants';

import {
	SLOT_TYPES,
	NOW_UXF_TABSET,
	UXF_TYPE_VIEWPORT,
	internalActions
} from '../constants';
const {CONTROLLER_PROP_RESOLVED, CONTROLLER_NODE_INSERTED} = internalActions;

import {
	COMPOSITION_ELEMENT_ID,
	CONTAINING_MACROPONENT_SYS_ID,
	UXF_VIEWPORT_SCREEN_TAG,
	REPEATER_ITEM,
	HEADLESS_VIEWPORT_COMPONENT_TAG,
	HEADLESS_VIEWPORT_COMPONENT_PROP_VALUES,
	LAYOUT_VERSION_3_0_0,
	META_PROP_NAME_APP_CONFIG_SYS_ID,
	META_PROP_NAME_PARENT_PAGE_COMPONENT_ID,
	META_PROP_NAME_PARENT_PAGE_MACROPONENT_SYS_ID,
	META_PROP_NAME_CONTROLLER_MAP,
	META_PROP_NAME_PARENT_CONTROLLER_DEPENDENCY_MAP,
	UXF_EXTENSION_POINT_SINGLE_CONTROLLER_DEPENDENCY_KEY,
	TABS_TYPE
} from '../constants';
import {
	getMacroponentTagName,
	getScreenActionTransformerTagName,
	getNodeId,
	getRenderedScreens
} from '../utils';

import {GenerateLayout} from '../layout';
import {removeNamespaceFromComponentId} from '../layout/helpers';
import {EXPERIENCE_IDS_BY_APP_CONFIG_SYS_IDS} from '../../templateLoader/utils';
import {getNowAppPropsForViewportRenderer} from './helpers';
import {isObject} from '@devsnc/snowdash';

import {mapValues} from '@devsnc/snowdash';

const WithLayoutIfPresent = ({model, tag, componentId}, ...children) => {
	if (!isEmpty(model)) {
		const {version} = model;
		if (version === LAYOUT_VERSION_3_0_0) {
			return (
				<GenerateLayout
					model={model}
					attr-parent-tag={tag}
					attr-parent-component-id={componentId}>
					{children}
				</GenerateLayout>
			);
		} else {
			return (
				<sn-layout model={model} attr-parent-tag={tag}>
					{children}
				</sn-layout>
			);
		}
	} else {
		return children;
	}
};

const getAppendToMetaObject = (
	nodeId,
	containingMacroponentSysId,
	repeaterItem
) => {
	return {
		[COMPOSITION_ELEMENT_ID]: nodeId,
		[CONTAINING_MACROPONENT_SYS_ID]: containingMacroponentSysId,
		[REPEATER_ITEM]: repeaterItem
	};
};

const skipTabsetRender = (node) => {
	const tabsetNode = tabsetRenderMap.get(node.nodeId);

	return (
		isViewportElement(node) &&
		node?.tagName === NOW_UXF_TABSET &&
		tabsetNode?.skipRender === true
	);
};

const isViewportElement = (node) => {
	const type = get(node, ['type']);
	return type === 'VIEWPORT';
};

const isShellElement = (node) => {
	return node.type === 'SHELL';
};

const getAppendToMetaObjectForViewportRenderer = (screenId) => ({
	[COMPOSITION_ELEMENT_ID]: screenId
});

const getHiddenMode = (isHidden, nodeId, rootNodeId) => {
	const previousMode = nodeStore.get(rootNodeId, `elementsNowMode.${nodeId}`);
	const mode = previousMode !== 'active' && isHidden ? 'suspend' : 'active';
	if (previousMode !== mode)
		nodeStore.set(rootNodeId, `elementsNowMode.${nodeId}`, mode);
	return mode;
};

/**
 * @param {{
 *	viewportContent?: ViewportContent,
 *	isNonDestructive: boolean,
 *	getResolvedPropValueFn: function,
 *  isUxfViewportScreen: boolean,
 *  contextualAppConfigSysId: String,
 *  parentComponentId: String
 * parentMacroponentSysId: String
 *  extensionPoints: Array
 *  parentControllerDependencies: Object
 * }} props
 */
const ViewportRenderer = ({
	viewportContent,
	isNonDestructive,
	getResolvedPropValueFn,
	isUxfViewportScreen,
	contextualAppConfigSysId,
	parentComponentId,
	parentMacroponentSysId,
	extensionPoints,
	parentControllerDependencies
}) => {
	if (!viewportContent) return null;
	// For destructive viewports, we can render only the current route and throw
	// away the rest. For non-destructive viewports, we need to render all known
	// routes and hide the inactive ones.
	const renderedScreens = getRenderedScreens(
		isNonDestructive,
		isUxfViewportScreen,
		viewportContent
	);

	const initialMetaPropValuesForMacroponent = {
		[META_PROP_NAME_APP_CONFIG_SYS_ID]: contextualAppConfigSysId,
		[META_PROP_NAME_PARENT_PAGE_COMPONENT_ID]: parentComponentId,
		[META_PROP_NAME_PARENT_PAGE_MACROPONENT_SYS_ID]: parentMacroponentSysId
	};

	return map(renderedScreens, (content) => {
		if (!content) return null;

		const {
			macroponentSysId,
			macroponentConfiguration,
			screenId,
			requestTime,
			screenKey,
			activeRoute: {extensionPoint}
		} = content;
		const isActive = isUxfViewportScreen
			? screenKey === get(viewportContent, ['currentScreen', 'screenKey'])
			: screenId === get(viewportContent, ['currentScreen', 'screenId']);

		const MacroponentTag = getMacroponentTagName(macroponentSysId);
		const ScreenActionTransformerTag =
			getScreenActionTransformerTagName(screenId);
		const matchedExtensionPoint = extensionPoints?.find(
			(ep) => ep.sysId === extensionPoint
		);

		let controllerDependencyMap =
			matchedExtensionPoint?.controllerDependencyMap;
		let parentControllerDependencyMap = {};
		//backward compatibility: allow ep to bind to single extension point without dep key like @data.propname
		if (matchedExtensionPoint?.controllerElementId)
			controllerDependencyMap = {
				[UXF_EXTENSION_POINT_SINGLE_CONTROLLER_DEPENDENCY_KEY]:
					matchedExtensionPoint.controllerElementId
			};
		if (controllerDependencyMap && parentControllerDependencies) {
			const controllerDepKeys = Object.values(controllerDependencyMap);
			const controllerDependencies = Object.keys(parentControllerDependencies)
				.filter((controllerName) => controllerDepKeys.includes(controllerName))
				.reduce(
					(acc, name) => ({
						...acc,
						[name]: parentControllerDependencies[name]
					}),
					{}
				);

			if (!isEmpty(controllerDependencies))
				parentControllerDependencyMap = {
					[META_PROP_NAME_PARENT_CONTROLLER_DEPENDENCY_MAP]:
						controllerDependencies
				};
		}
		const metaPropValuesForMacroponent = {
			...initialMetaPropValuesForMacroponent,
			[META_PROP_NAME_CONTROLLER_MAP]: controllerDependencyMap,
			...parentControllerDependencyMap
		};
		const props = mapValues(macroponentConfiguration, (maybeUxValue) => {
			if (isObject(maybeUxValue) && has(maybeUxValue, ['type']))
				return getResolvedPropValueFn(maybeUxValue);
			return maybeUxValue;
		});

		const nowUxfAppConfigSysId =
			metaPropValuesForMacroponent.nowUxfAppConfigSysId;
		const experienceId =
			EXPERIENCE_IDS_BY_APP_CONFIG_SYS_IDS[nowUxfAppConfigSysId];
		props.nowAppProps = getNowAppPropsForViewportRenderer(experienceId);
		return (
			<ScreenActionTransformerTag
				key={isNonDestructive ? screenId : requestTime}
				slot={isActive ? 'viewport' : 'inactive'}
				now-mode={isActive ? 'active' : 'suspend'}
				nowUxfDelegateDispatch={!isUxfViewportScreen}>
				<MacroponentTag
					append-to-meta={getAppendToMetaObjectForViewportRenderer(screenId)}
					now-mode={isActive ? 'active' : 'suspend'}
					{...props}
					{...metaPropValuesForMacroponent}
				/>
			</ScreenActionTransformerTag>
		);
	});
};

const getTabsSlugForSlot = (id = '') => ({type: SLOT_TYPES.TABS, slug: id});
const tabsetRenderMap = new Map();

export const __testing =
	process.env.NODE_ENV === 'test'
		? {
				tabsetRenderMap,
				skipTabsetRender
		  }
		: void 0;

export const renderMacroponentNode = (
	rendererDependencies,
	{
		node,
		renderer: Renderer,
		overriddenComponentId,
		ignoreNodeChildren = false,
		repeaterItem = null
	},
	children
) => {
	const {
		sysId,
		contextualAppConfigSysId,
		viewportContents,
		tabsetNonViewportContents,
		getChildrenFn: getChildren,
		getResolvedPropValueFn,
		getComponentIdFn: getComponentId,
		descendants,
		shellComponentId,
		proxydbNodes,
		csdbNode,
		dispatch
	} = rendererDependencies;
	const ElementTagName =
		isViewportElement(node) && node.isHeadless
			? HEADLESS_VIEWPORT_COMPONENT_TAG
			: get(node, ['tagName']);
	const styles = get(node, ['styles']);
	const nodeId = getNodeId(node);
	const nonViewportSlots = get(
		tabsetNonViewportContents,
		`${nodeId}.nonViewportSlots`
	);
	const isHiddenUxValue = get(node, ['isHidden']);
	const isHidden = getResolvedPropValueFn(isHiddenUxValue, repeaterItem);

	const isUxfViewportScreen =
		get(node, ['tagName']) === UXF_VIEWPORT_SCREEN_TAG;

	let props = mapValues(get(node, ['propertyValues'], {}), (propUxValue) => {
		return getResolvedPropValueFn(propUxValue, repeaterItem);
	});
	let resolvedTabItems = [];

	if (
		node?.tagName === NOW_UXF_TABSET &&
		node?.type === UXF_TYPE_VIEWPORT &&
		get(node, 'items', []).length
	) {
		const resolvableItemAttrs = ['label', 'conditional'];
		// Node level items isn't a UxValue, but it's members are UxValue
		//  cloning deep will allow us to avoid any mutations
		resolvedTabItems = klona(get(node, 'items'));
		resolvedTabItems.forEach((item, i) => {
			if (item.type === TABS_TYPE.TEMPLATE) {
				const correspondingViewportId = node.nodeId;
				// * If the corresponding viewport tabs component/element is a repeater then we consider it as a data driven tab
				const isDataDrivenTab =
					get(descendants, `[${correspondingViewportId}][${i}].type`, '') ===
					'REPEATER';
				if (isDataDrivenTab) {
					item.repeatWith = getResolvedPropValueFn(
						descendants[correspondingViewportId][i]?.repeatWith
					);
					// * We need this to map the slots correctly based on the different repeated tab ids.
					descendants[correspondingViewportId][i].slotMeta = getTabsSlugForSlot(
						item?.id
					);

					// attach nonViewportSlots (maintains the set of visited slots) to the Repeater node.
					descendants[correspondingViewportId][i].nonViewportSlots =
						nonViewportSlots;
				}
			}
			resolvableItemAttrs.forEach((attr) => {
				if (has(item, attr)) {
					item[attr] = getResolvedPropValueFn(item[attr]);
				}
			});
		});
		props.items = resolvedTabItems;
	}

	let extensionPoints = undefined;
	let parentControllerDependencies = undefined;
	if (isViewportElement(node)) {
		// todo - for template tabs, we need to handle the same logic with repeatWith
		// to defer rendering of tab set
		tabsetRenderMap.set(nodeId, {
			skipRender: some(resolvedTabItems, ['conditional', undefined])
		});

		extensionPoints = Object.values(descendants)
			.flatMap((child) => child)
			.filter((child) => child.nodeId === node.nodeId)
			.flatMap((node) => node.extensionPoints || []);
		parentControllerDependencies = proxydbNodes
			? proxydbNodes.reduce((acc, db) => {
					if (!db.dependencies || isEmpty(db.dependencies)) return acc;
					return {
						...acc,
						[db.nodeId]: Object.keys(db.dependencies).reduce(
							(dependencies, dep) => {
								return {
									...dependencies,
									[dep]: db.dependencies[dep].controllerElementId
								};
							},
							{}
						)
					};
			  }, {})
			: {};

		if (!node.isHeadless) {
			const macroponentSubroutes = get(
				viewportContents,
				[nodeId, 'viewportRoutes'],
				[]
			);

			const viewportRoutes = macroponentSubroutes.reduce(
				(
					acc,
					{
						routeType,
						extensionPoint,
						order,
						name,
						icon,
						fields,
						optionalParameters
					}
				) => {
					const routeObj = {
						routeType,
						extensionPoint,
						order,
						name,
						icon,
						fields,
						optionalParameters,
						controllerDependencyMap: extensionPoints?.find(
							(ep) => ep.sysId === extensionPoint
						)?.controllerDependencyMap
					};

					if (acc[routeType]) {
						acc[routeType].push(routeObj);
					} else {
						acc[routeType] = [routeObj];
					}

					return acc;
				},
				{}
			);

			// Update viewport props only if route initialization is complete or if the component is a tabset
			// This is to to ensure incorrect tab focus issue does not occur for contextual sidebar component
			if (
				rendererDependencies?.isRouteInitializationCompleted ||
				node.tagName === NOW_UXF_TABSET
			) {
				props = {
					...props,
					viewportRoutes,
					activeRoute: get(viewportContents, [
						nodeId,
						'currentScreen',
						'activeRoute'
					]),
					extensionPoints
				};
			}
		} else {
			props = {
				...props,
				...HEADLESS_VIEWPORT_COMPONENT_PROP_VALUES,
				extensionPoints
			};
		}
	}
	const slot = get(node, ['slot']);
	const layoutModel = get(node, ['layoutJson']);
	const componentId = isEmpty(overriddenComponentId)
		? getComponentId(nodeId, repeaterItem)
		: overriddenComponentId;

	if (ElementTagName === ACTION_BAR_TAG_NAME)
		addActionBarForTranslator(shellComponentId, componentId, props);

	const getNodeChildren = (node) => {
		// for tab-set, return only the active/previously visited tab contents
		// otherwise, return children for non tab-set
		return node.tagName === NOW_UXF_TABSET
			? getChildren(node.nodeId).filter(
					(c) =>
						(nonViewportSlots && nonViewportSlots.has(c.slot)) ||
						c.type === 'REPEATER'
			  )
			: getChildren(node.nodeId);
	};
	const childrenContent = ignoreNodeChildren
		? children
		: getNodeChildren(node).map((childNode) => {
				// include children for now-uxf-tab-set those are either active or previously visited.
				// tabsetContainerRenderRuntime generated the nonViewportSlots containing the set of
				// active/previously visited tab slots.
				if (has(tabsetNonViewportContents, nodeId)) {
					for (const tabContentSlot of nonViewportSlots) {
						if (
							!isEmpty(childNode.slot) &&
							tabContentSlot.indexOf(childNode.slot) > -1
						) {
							return (
								<Renderer
									renderer={Renderer}
									node={childNode}
									repeaterItem={repeaterItem}
								/>
							);
						}
					}
				} else {
					return (
						<Renderer
							renderer={Renderer}
							node={childNode}
							repeaterItem={repeaterItem}
						/>
					);
				}
		  });

	try {
		const hiddenStyles = {...styles, display: 'none'};
		if (slot === 'viewport') {
			console.error(
				"Conflict in macroponent composition overrides: 'viewport' slotName is a reserved keyword."
			);
		}

		const isNodeRepeaterDescendentWithLayout =
			!isEmpty(layoutModel) && !isEmpty(repeaterItem);

		const rebuildNodeLayoutModel = (layoutModel) => {
			// For repeater's descendant that contains layout definition
			// should include the dynamic element_id in context of the
			// repeater as a parent (or grand parent) node.
			if (isNodeRepeaterDescendentWithLayout) {
				const {
					default: {items}
				} = layoutModel;
				let updatedItems = [];
				forEach(items, (item) => {
					const {element_id: elementId} = item;
					let updatedElementId = removeNamespaceFromComponentId(
						getComponentId(elementId, repeaterItem)
					);
					const newItem = {...item, element_id: updatedElementId};
					updatedItems.push(newItem);
				});
				return {
					...layoutModel,
					default: {
						...layoutModel.default,
						items: [...updatedItems]
					}
				};
			} else {
				// return the layout model as is for nodes not having
				// any overrides with layout model.
				return layoutModel;
			}
		};

		// Skip rendering viewport elements, when viewportRoutes aren't available
		//   - contextual sidebar,
		//   - viewport,
		//   - exclude tab (as tab configured as viewport are handled in ViewportRenderer)
		if (isViewportElement(node) && node?.tagName !== NOW_UXF_TABSET) {
			const viewportRoutes = get(
				viewportContents,
				[nodeId, 'viewportRoutes'],
				[]
			);

			if (viewportRoutes.length === 0) return null;
		}

		const mode = getHiddenMode(isHidden, nodeId, shellComponentId);
		let hooks = {};
		if (
			csdbNode &&
			node.nodeId === csdbNode.nodeId &&
			node.definitionSysId === csdbNode.definitionSysId
		) {
			dispatch(CONTROLLER_PROP_RESOLVED, {
				properties: props,
				nodeId,
				containerSysId: sysId,
				definitionSysId: node.definitionSysId
			});

			const insertNode = ({elm}) => {
				dispatch(CONTROLLER_NODE_INSERTED, {
					node: elm,
					nodeId,
					containerSysId: sysId,
					definitionSysId: node.definitionSysId
				});
			};
			hooks = {
				insert: insertNode,
				update: insertNode
			};
		}

		// set trigger state to true if the node has triggers
		if (node?.triggers?.length) {
			node.triggers.forEach((trigger) => {
				setActionStateForShortcut(componentId, true, {
					shortcutDefinitionSysId: trigger.id
				});
			});
		}

		const isLandmark = get(props, 'landmark', false);

		return (
			<ElementTagName
				{...props}
				component-id={componentId}
				{...(isLandmark ? {['data-landmarkfocus']: isLandmark} : {})}
				append-to-meta={getAppendToMetaObject(nodeId, sysId, repeaterItem)}
				slot={slot === 'viewport' ? '' : slot}
				style={isHidden ? hiddenStyles : styles}
				now-mode={mode}
				hook={{...hooks}}
				{...(isShellElement(node)
					? {[META_PROP_NAME_APP_CONFIG_SYS_ID]: contextualAppConfigSysId}
					: {})}>
				{isViewportElement(node) && !skipTabsetRender(node) ? (
					<ViewportRenderer
						viewportContent={viewportContents[nodeId]}
						isNonDestructive={get(node, ['isNonDestructive'])}
						getResolvedPropValueFn={getResolvedPropValueFn}
						isUxfViewportScreen={isUxfViewportScreen}
						contextualAppConfigSysId={contextualAppConfigSysId}
						parentComponentId={shellComponentId}
						parentMacroponentSysId={sysId}
						extensionPoints={extensionPoints}
						parentControllerDependencies={parentControllerDependencies}
					/>
				) : null}
				<WithLayoutIfPresent
					model={rebuildNodeLayoutModel(layoutModel)}
					tag={node.tagName}
					componentId={componentId}>
					{childrenContent}
				</WithLayoutIfPresent>
			</ElementTagName>
		);
	} catch (e) {
		return <div attr-error-tag-name={ElementTagName}>{childrenContent}</div>;
	}
};
