import {get} from '@devsnc/snowdash';
import {getNodeId} from '../utils';
import {isEmpty} from '@devsnc/snowdash';
import {isEqual} from '@devsnc/snowdash';
import {LAYOUT_VERSION_3_0_0, MACROPONENT_VALUE_UPDATED} from '../constants';
import {GenerateLayout} from '../layout';
import {Fragment} from '@servicenow/ui-renderer-snabbdom';
import {layoutModelForRepeatersWithLayout} from '../layout/helpers';
import {isArray} from '@devsnc/snowdash';

const WithLayoutIfPresent = ({model, tag, componentId, slot}, ...children) => {
	if (!isEmpty(model)) {
		const {version} = model;
		if (version === LAYOUT_VERSION_3_0_0) {
			return (
				<GenerateLayout
					model={model}
					attr-parent-tag={tag}
					attr-parent-component-id={componentId}
					key={true}>
					{children}
				</GenerateLayout>
			);
		} else {
			const slotProps = slot ? {slot: slot} : null;
			return (
				<sn-layout model={model} attr-parent-tag={tag} {...slotProps}>
					{children}
				</sn-layout>
			);
		}
	} else {
		return children;
	}
};

const getRepeaterItemSlots = (repeatWith, repeaterSlotMeta) => {
	let itemSlots = [];
	repeatWith.map((item, index) => {
		itemSlots.push(`${repeaterSlotMeta.slug}-${index}`);
	});
	return itemSlots;
};

const slotExistsInNonViewportSlots = (
	repeaterSlotMeta,
	repeatWith,
	nonViewportSlots
) => {
	const repeaterItemSlots = getRepeaterItemSlots(repeatWith, repeaterSlotMeta);
	return !isEmpty(repeaterItemSlots.filter((s) => nonViewportSlots.has(s)));
};

const buildRepeaterItems = (
	node,
	repeaterSlot,
	repeatWith,
	parentRepeaterItem,
	getChildren,
	layoutModel,
	Renderer,
	rendererDependencies
) => {
	const nodeId = getNodeId(node);
	const tag = get(node, ['tagName']);
	const {getComponentIdFn: getComponentId} = rendererDependencies;
	const slotProps = repeaterSlot ? {slot: repeaterSlot} : null;
	const componentId = getComponentId(nodeId, parentRepeaterItem);
	const isLayoutDefined = !isEmpty(layoutModel);
	const isLayoutModern = isEqual(
		get(layoutModel, ['version']),
		LAYOUT_VERSION_3_0_0
	);
	let updatedLayoutModel = {};
	if (isLayoutDefined && isLayoutModern) {
		updatedLayoutModel = layoutModelForRepeatersWithLayout(
			node,
			repeatWith,
			layoutModel,
			rendererDependencies,
			parentRepeaterItem
		);
	}

	const slotMeta = get(node, ['slotMeta']);
	const nonViewportSlots = get(node, ['nonViewportSlots']);

	let repeaterItems, repeaterItemSlots;
	if (slotMeta) {
		repeaterItemSlots = [
			...getRepeaterItemSlots(repeatWith, slotMeta).filter((s) =>
				nonViewportSlots.has(s)
			)
		];
		repeaterItems = [
			...repeatWith.filter((item, index) =>
				nonViewportSlots.has(`${slotMeta.slug}-${index}`)
			)
		];
	} else {
		repeaterItems = [...repeatWith];
	}

	return (
		<WithLayoutIfPresent
			model={isLayoutModern ? updatedLayoutModel : layoutModel}
			tag={tag}
			componentId={componentId}
			{...slotProps}>
			{repeaterItems.map((item, index) => {
				return getChildren(nodeId).map((childNode) => {
					if (slotMeta) {
						childNode.slot = repeaterItemSlots[index];
					} else if (!childNode.slot && !isLayoutModern) {
						childNode.slot = repeaterSlot;
					}

					const repeaterItem = {
						value: item,
						index: index,
						parent: parentRepeaterItem,
						repeaterNodeId: nodeId
					};

					return (
						<Renderer
							renderer={Renderer}
							node={childNode}
							repeaterItem={repeaterItem}
						/>
					);
				});
			})}
		</WithLayoutIfPresent>
	);
};

const slotMetaNotInNonViewportSlots = (
	slotMeta,
	nonViewportSlots,
	repeatWith
) =>
	slotMeta &&
	(!nonViewportSlots ||
		!slotExistsInNonViewportSlots(slotMeta, repeatWith, nonViewportSlots));

export const renderRepeaterNode = (
	rendererDependencies,
	{node, renderer: Renderer, repeaterItem: parentRepeaterItem = null}
) => {
	const {
		getChildrenFn: getChildren,
		getResolvedPropValueFn,
		getComponentIdFn: getComponentId
	} = rendererDependencies;

	const styles = {...get(node, ['styles'])};
	const hiddenStyles = {...styles, display: 'none'};
	const isHiddenUxValue = get(node, ['isHidden']);
	const isHidden = getResolvedPropValueFn(isHiddenUxValue, parentRepeaterItem);
	const repeatWith = getResolvedPropValueFn(
		get(node, ['repeatWith']),
		parentRepeaterItem
	);

	const repeaterSlotMeta = get(node, ['slotMeta']);
	const nonViewportSlots = get(node, ['nonViewportSlots']);
	const repeaterSlot = get(node, ['slot']);

	const slotProps = repeaterSlot ? {slot: repeaterSlot} : null;
	const layoutModel = get(node, ['layoutJson']);
	const isLayoutModern = isEqual(
		get(layoutModel, ['version']),
		LAYOUT_VERSION_3_0_0
	);

	if (
		!isArray(repeatWith) ||
		slotMetaNotInNonViewportSlots(
			repeaterSlotMeta,
			nonViewportSlots,
			repeatWith
		)
	) {
		return null;
	}

	const componentId = getComponentId(node.nodeId, parentRepeaterItem);

	/*
	 * Dispatch information on the repeater for UIB's WYSIWYG stage.
	 * No impact on normal runtime.
	 */
	if (rendererDependencies.dispatchMcpUpdates) {
		rendererDependencies.dispatch(MACROPONENT_VALUE_UPDATED, {
			macroponentSysId: rendererDependencies.sysId,
			repeaters: {
				[node.nodeId]: repeatWith
			}
		});
	}

	return (!isEmpty(repeaterSlot) || !isEmpty(repeaterSlotMeta)) &&
		!isLayoutModern ? (
		<Fragment>
			{buildRepeaterItems(
				node,
				repeaterSlot,
				repeatWith,
				parentRepeaterItem,
				getChildren,
				layoutModel,
				Renderer,
				rendererDependencies
			)}
		</Fragment>
	) : (
		<div
			component-id={componentId}
			id={componentId}
			style={isHidden ? hiddenStyles : styles}
			data-type={node.type.toLowerCase()}
			{...slotProps}>
			{buildRepeaterItems(
				node,
				repeaterSlot,
				repeatWith,
				parentRepeaterItem,
				getChildren,
				layoutModel,
				Renderer,
				rendererDependencies
			)}
		</div>
	);
};
