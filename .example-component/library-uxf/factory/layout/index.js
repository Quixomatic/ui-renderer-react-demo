import {isEqual} from '@devsnc/snowdash';
import {isEmpty} from '@devsnc/snowdash';
import {get} from '@devsnc/snowdash';
import {set} from '@devsnc/snowdash';
import {
	generateChildElementId,
	generateContainerElementId,
	itemsExistsInModel,
	isElementNotInLayout,
	hasNonLayoutElements,
	findChildByElementId,
	isDesignTime,
	isRepeater,
	isNowModeActive,
	isValidModelAndChildren,
	arrangeChildrenByIfPredefinedSlot,
	ignoreCachedStyles
} from './helpers';
import {getStyles, applyStyles, applyQueryStyles} from './styler';
import {registerResizeObserver, removeResizeObserver} from './resizeObserver';
import {
	CONTAINER_ELEMENT,
	CHILD_ELEMENT,
	ATTR_PARENT_TAG,
	KEY
} from './constants';
import {Fragment} from '@servicenow/ui-renderer-snabbdom';

/**
 * ChildElement
 * @param model
 * @param item
 * @param child
 * @returns {*|null}
 * @constructor
 */
const ChildElement = ({model, item, child}) => {
	const {queries} = model;

	const {element_id: elementId} = item;
	const id = generateChildElementId(elementId);
	let hook = {};

	// handle the runtime, styles for the item.
	const elStyles = get(child, 'data.style', {});
	const defaultStyles = getStyles(item, model, false, elStyles);

	hook = {
		insert: ({elm}) => {
			elm.defaultStyles = defaultStyles;
			registerResizeObserver(elm, queries, CHILD_ELEMENT);
		},
		update: ({elm}) => {
			const previousStyles = elm.defaultStyles;
			if (!isEqual(previousStyles, defaultStyles)) {
				elm.defaultStyles = defaultStyles;
			}
		},
		destroy: ({elm}) => removeResizeObserver(elm)
	};
	set(child, 'data.attrs.id', id);
	set(child, 'data.style', defaultStyles);

	set(child, 'data.hook', hook);

	return !isEmpty(elementId) && !isEmpty(child) ? child : null;
};

const buildNonLayoutItemsForRuntime = (children, model) => {
	const {childrenWithPredefinedSlot, otherChildren} =
		arrangeChildrenByIfPredefinedSlot(children);
	return (
		<Fragment>
			{otherChildren.length ? (
				<slot>{renderModalItems(otherChildren, model)}</slot>
			) : null}
			{childrenWithPredefinedSlot.length
				? renderModalItems(childrenWithPredefinedSlot, model)
				: null}
		</Fragment>
	);
};

/**
 * buildNonLayoutItems
 * @param children
 * @param model
 * @returns {JSX.Element|null}
 */
const buildNonLayoutItems = (children, model) => {
	if (hasNonLayoutElements(children, model)) {
		if (isDesignTime(children)) {
			return <slot>{renderModalItems(children, model)}</slot>;
		}
		return buildNonLayoutItemsForRuntime(children, model);
	}
	return null;
};

/**
 * renderChildren
 * @param children
 * @param model
 * @returns {*}
 */
const renderChildren = (children, model) => {
	const {
		default: {items}
	} = model;

	return items.map((item) => {
		const {element_id: elementId} = item;
		const child = findChildByElementId(children, elementId);

		if (!isEmpty(child) && isDesignTime([child])) {
			return <ChildElement model={model} item={item} child={child} />;
		} else if (
			!isEmpty(child) &&
			(isNowModeActive(child) || isRepeater(child))
		) {
			return <ChildElement model={model} item={item} child={child} />;
		} else {
			return null;
		}
	});
};

/**
 * buildLayout
 * @param children
 * @param model
 * @param tag
 * @param parentComponentId
 * @param ignoreCache
 * @param includeKey
 * @returns {JSX.Element|null}
 */
export const buildLayout = (
	children,
	model,
	tag,
	parentComponentId,
	ignoreCache = false,
	includeKey = false
) => {
	const {queries} = model;
	const id = generateContainerElementId(parentComponentId);
	const keyProp = includeKey ? {key: id} : null;

	/**
	 * we want to have the div for empty items to allow users style the page
	 * body even before they add components to the stage in UI Builder. However,
	 * we do not need the wrapper "div" for empty items (components) to render
	 * the layout.
	 */
	return itemsExistsInModel(model) || isDesignTime(children) ? (
		<div
			id={id}
			{...keyProp}
			hook={{
				insert: ({elm}) => {
					const defaultStyles = getStyles(null, model, true);
					elm.defaultStyles = defaultStyles;
					registerResizeObserver(elm, queries, CONTAINER_ELEMENT, children);
					applyStyles(elm, null, model, true, {}, ignoreCache);
				},
				update: ({elm}) => {
					const currentStyle = getStyles(null, model, true);
					const previousStyle = elm.defaultStyles;
					if (!isEqual(currentStyle, previousStyle)) {
						elm.defaultStyles = currentStyle;
					}
					applyStyles(elm, null, model, true, {}, ignoreCache);
					applyQueryStyles(
						elm,
						currentStyle,
						queries,
						CONTAINER_ELEMENT,
						children
					);
				},
				destroy: ({elm}) => removeResizeObserver(elm)
			}}
			attr-parent-tag={tag}
			attr-parent-component-id={parentComponentId}>
			{!isEmpty(children) ? renderChildren(children, model) : null}
		</div>
	) : null;
};

/**!
 * renderModalItems
 * @param children
 * @param model
 * @returns {*}
 */
const renderModalItems = (children, model) => {
	const designTime = isDesignTime(children);

	return children.map((child) => {
		// we return all such elements those are in composition but not likely
		//  be part of the layout model
		if (isElementNotInLayout(child, model, designTime)) {
			return child;
		}
	});
};

/**
 * GenerateLayout
 * @param model
 * @param tag
 * @param children
 * @returns {JSX.Element}
 * @constructor
 */
export const GenerateLayout = ({model, ...restAttributes}, children) => {
	const tag = restAttributes[ATTR_PARENT_TAG];
	const parentComponentId = restAttributes['attr-parent-component-id'];
	const includeKey = restAttributes[KEY];
	const {
		default: {type}
	} = model;
	const ignoreCache = ignoreCachedStyles(parentComponentId, type);

	return (
		<Fragment>
			{/* Render child items that are part of the layout to the containing DIV wrapper */}
			{isValidModelAndChildren(model, children) &&
				buildLayout(
					children,
					model,
					tag,
					parentComponentId,
					ignoreCache,
					includeKey
				)}

			{/* wrapping all elements that aren't a part of the layout to anonymous slot */}
			{isValidModelAndChildren(model, children) &&
				buildNonLayoutItems(children, model)}
		</Fragment>
	);
};
