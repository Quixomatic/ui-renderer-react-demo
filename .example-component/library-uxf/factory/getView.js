// This import is required for tectonic magic to work
// eslint-disable-next-line no-unused-vars
import {createElement, Fragment} from '@servicenow/ui-renderer-snabbdom';

import {get} from '@devsnc/snowdash';
import {partial} from '@devsnc/snowdash';
import resolveForView from './UxValueResolver/resolveForView';
import {
	IS_MACROPONENT_READY,
	META_PROP_NAME_APP_CONFIG_SYS_ID
} from './constants';
import {noop} from '@devsnc/snowdash';
import {
	getActionTransformerTagName,
	getNamespacedComponentId,
	getNodeId,
	getNodeIds
} from './utils';
import {
	renderMacroponentNode,
	renderRepeaterNode,
	renderConditionalNode,
	renderProxyDataResourceMultiInstanceNodes
} from './nodeRenderers';
import getResolversForView from '../factory/UxValueResolver/getResolversForView';
import performanceLogger from '../utils/puppeteerMetricLogger';
import {isObject} from '@devsnc/snowdash';

/**
 * @typedef {import("../types/internals/ViewportRuntime").ViewportContent} ViewportContent
 */

const getChildren = (descendants, nodeId) => {
	return get(descendants, nodeId, []);
};

const WhenMacroponentIsReady = ({isReady = true}, children) => {
	return <div style={{display: isReady ? 'contents' : 'none'}}>{children}</div>;
};

const WithCSDBIfPresent = (
	{renderer: Renderer, csdbNode, csdbComponentId},
	children
) => {
	return isObject(csdbNode) ? (
		<Renderer
			overriddenComponentId={csdbComponentId}
			renderer={noop}
			node={csdbNode}
			ignoreNodeChildren={true}>
			{children}
			<slot />
		</Renderer>
	) : (
		children
	);
};

const renderNode = (
	rendererDependencies,
	{
		node,
		renderer,
		overriddenComponentId,
		ignoreNodeChildren = false,
		repeaterItem = null
	},
	children
) => {
	if (node.type === 'REPEATER') {
		return renderRepeaterNode(rendererDependencies, {
			node,
			renderer,
			repeaterItem
		});
	} else if (node.type === 'CONDITIONAL') {
		return renderConditionalNode(rendererDependencies, {
			node,
			renderer,
			repeaterItem
		});
	} else {
		return renderMacroponentNode(
			rendererDependencies,
			{
				node,
				renderer,
				overriddenComponentId,
				ignoreNodeChildren,
				repeaterItem
			},
			children
		);
	}
};

export const getMacroponentView = (
	tree,
	macroponentPropertyDefinitions,
	controllerNodeIdWithGlideForm,
	dispatchMcpUpdates = false
) => {
	const {
		id,
		rootNode,
		descendants,
		clientStateDataBrokerNode: csdbNode,
		proxyDataBrokerNodes: proxydbNodes,
		externalControllerDependencies,
		controllerAliasMap
	} = tree;
	const getChildrenFn = partial(getChildren, descendants);
	const csdbNodeId = getNodeId(csdbNode);
	const pdbNodeIds = getNodeIds(proxydbNodes);

	const resolversForView = getResolversForView(
		id,
		macroponentPropertyDefinitions,
		csdbNodeId,
		pdbNodeIds,
		externalControllerDependencies,
		proxydbNodes,
		controllerAliasMap
	);

	return (seismicState, seismicHelper) => {
		performanceLogger.mark('view_render');

		const {
			componentId: shellComponentId,
			properties: seismicProperties,
			behaviors,
			[IS_MACROPONENT_READY]: isMacroponentReady
		} = seismicState;

		const {updateState, dispatch} = seismicHelper;

		const viewportContents = get(
			behaviors,
			['viewportRuntime', 'viewports'],
			{}
		);

		const isRouteInitializationCompleted = get(
			behaviors,
			['viewportRuntime', 'isRouteInitializationCompleted'],
			false
		);

		const getComponentIdFn = partial(
			getNamespacedComponentId,
			shellComponentId
		);

		const tabsetNonViewportContents = get(
			behaviors,
			['tabsetRuntime', 'elements'],
			{}
		);

		const csdbComponentId = getComponentIdFn(csdbNodeId);
		const {
			[META_PROP_NAME_APP_CONFIG_SYS_ID]: contextualAppConfigSysId,
			nowAppProps
		} = seismicProperties;

		const getResolvedPropValueFn = partial(
			resolveForView,
			resolversForView,
			seismicProperties,
			seismicState
		);

		const MacroponentNodeRenderer = partial(renderNode, {
			sysId: id, // sysId of the enclosing macroponent
			viewportContents,
			tabsetNonViewportContents,
			isRouteInitializationCompleted,
			getChildrenFn,
			getResolvedPropValueFn,
			getComponentIdFn,
			contextualAppConfigSysId,
			descendants,
			shellComponentId,
			rootNode,
			proxydbNodes,
			seismicState,
			updateState,
			csdbNode,
			dispatch,
			dispatchMcpUpdates
		});
		const actionTransformerTagName = getActionTransformerTagName(id);

		const ProxyDataResourceMultiInstanceNodes = partial(
			renderProxyDataResourceMultiInstanceNodes,
			controllerNodeIdWithGlideForm,
			dispatch
		);

		const macroponentViewContent = !controllerNodeIdWithGlideForm ? (
			<WhenMacroponentIsReady isReady={isMacroponentReady}>
				<ProxyDataResourceMultiInstanceNodes
					{...{
						sysId: id,
						getResolvedPropValueFn,
						getComponentIdFn,
						proxydbNodes,
						nowAppProps
					}}
				/>
				<WithCSDBIfPresent
					renderer={MacroponentNodeRenderer}
					csdbComponentId={csdbComponentId}
					csdbNode={csdbNode}
					actionTransformerTagName={actionTransformerTagName}>
					<MacroponentNodeRenderer
						renderer={MacroponentNodeRenderer}
						node={rootNode}
					/>
				</WithCSDBIfPresent>
			</WhenMacroponentIsReady>
		) : (
			<WhenMacroponentIsReady isReady={isMacroponentReady}>
				<ProxyDataResourceMultiInstanceNodes
					{...{
						sysId: id,
						getResolvedPropValueFn,
						getComponentIdFn,
						proxydbNodes,
						nowAppProps
					}}>
					<MacroponentNodeRenderer
						renderer={MacroponentNodeRenderer}
						node={rootNode}
					/>
				</ProxyDataResourceMultiInstanceNodes>
			</WhenMacroponentIsReady>
		);

		performanceLogger.measure('View Rendering Time', {
			start: 'view_render',
			detail: `mcp ${id}`
		});

		return macroponentViewContent;
	};
};

export default getMacroponentView;
