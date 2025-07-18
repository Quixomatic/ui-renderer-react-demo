import {filter} from '@devsnc/snowdash';
import {get} from '@devsnc/snowdash';
import {find} from '@devsnc/snowdash';
import {some} from '@devsnc/snowdash';
import {isEmpty} from '@devsnc/snowdash';
import {compact} from '@devsnc/snowdash';
import {includes} from '@devsnc/snowdash';
import {isEqual} from '@devsnc/snowdash';
import {memoize} from '@servicenow/ui-utils';
import {
	FLEX,
	INLINE_FLEX,
	GRID,
	INLINE_GRID,
	CONTAINER_ELEMENT,
	CHILD_ELEMENT,
	SN_UXF_ELEMENT_MOUNT,
	UIB_DEFAULT_SLOTTED_WRAPPER,
	REPEATER,
	NOW_MODE_ACTIVE,
	REFERENCE_ELEMENT,
	REFERENCE_CONTAINER,
	REFERENCE_PAGE
} from './constants';

import {stylesCache} from './styler';
import {isArray} from '@devsnc/snowdash';
import {forOwn} from '@devsnc/snowdash';
import {forEach} from '@devsnc/snowdash';
import {hasIn} from '@devsnc/snowdash';
import {markReflow} from './trackUsageReflowHandler';

/**
 * defaultItemStyles provides the overrides to flex & grid item minimum
 *  size.
 *
 * @see https://www.w3.org/TR/css3-grid-layout/#min-size-auto
 * @see https://www.w3.org/TR/css-flexbox-1/#min-size-auto
 *
 * @returns {{"min-height": string, "min-width": string}}
 */
export const defaultItemStyles = () => {
	// styles to override the default Automatic Minimum Size of Flex  & GridItems
	return {
		'min-height': '0',
		'min-width': '0'
	};
};

/**
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries/Using_media_queries#media_features
 * @param queries
 * @param mediaFeature
 */
export const getMatchingQueryStyles = (queries, mediaFeature) => {
	// determine matched queries based on feature - max-width, min-width etc.
	//  - implementing only for max-width for POC
	return filter(queries, (q) => hasIn(q, ['query', mediaFeature]));
};

/**
 * getContainerQueryStyles
 * @param {*} query
 * @returns {{}}
 */
const getContainerQueryStyles = (query) => {
	const type = get(query, ['layout', 'type']);
	const isInline = get(query, ['layout', 'isInline']);
	const styles = get(query, ['layout', 'styles']);
	return getContainerLayoutStyles(type, styles, isInline);
};

/**
 * getChildQueryStyles
 * @param {*} query
 * @param {*} elementId
 * @returns {{}}
 */
const getChildQueryStyles = (query, elementId) => {
	const items = get(query, ['layout', 'items']);
	const item = find(
		items,
		(i) => generateChildElementId(i['element_id']) === elementId
	);
	return {...get(item, ['rules']), ...get(item, ['styles'])};
};

/**
 * hasQueryStyles
 * @param query
 * @param elementId
 * @param elementType
 * @returns {boolean}
 */
export const hasQueryStyles = (query, elementId, elementType) => {
	let queryStyles = {};

	if (elementType === CONTAINER_ELEMENT) {
		queryStyles = getContainerQueryStyles(query);
	} else if (elementType === CHILD_ELEMENT) {
		queryStyles = getChildQueryStyles(query, elementId);
	}

	return !isEmpty(queryStyles);
};

/**
 * clearStyles
 * @param element
 * @param styles
 */
export const clearStyles = (element, styles) => {
	const emptyString = '';

	// Reset element styles
	forOwn(styles, (value, key) => {
		element.style[key] = emptyString;
	});
};

/**
 * Sets the styles to the element
 * @param element
 * @param styles
 */
export const setStyles = (element, styles) => {
	// reset the styles
	clearStyles(element, styles);

	// set element styles
	forOwn(styles, (value, key) => {
		element.style[key] = value;
	});
};

/**
 * Merge the defaultStyles and queryStyles to enable singular update on the element
 * @param defaultStyles
 * @param queryStyles
 */
export const mergeStyles = (defaultStyles, queryStyles) => {
	return {...defaultStyles, ...queryStyles};
};

/**
 * Sets query styles the for container/parent elements as well as any existing child elements
 * @param {*} query
 * @param {*} element
 * @param {*} children
 * @param {*} defaultStyles
 * @param {*} elementType
 */
export const setQueryStyles = (
	query,
	element,
	children,
	defaultStyles,
	elementType = CONTAINER_ELEMENT
) => {
	if (elementType === CONTAINER_ELEMENT) {
		// set merged styles for container/parent element
		const mergedStyles = mergeStyles(
			defaultStyles,
			getContainerQueryStyles(query)
		);
		setStyles(element, mergedStyles);

		if (children != null) {
			const items = get(query, ['layout', 'items']);

			items.forEach((item) => {
				const child = find(
					children,
					(c) => c?.elm?.id === generateChildElementId(item?.element_id)
				);
				if (child) {
					let itemQueryStyles = {
						...get(item, ['rules']),
						...get(item, ['styles'])
					};
					let childStyles = child?.data?.style;
					// set merged styles for child elements
					setStyles(child.elm, mergeStyles(childStyles, itemQueryStyles));
				}
			});
		}
	}
};
/**
 * applyStylesByMediaFeature
 * @param element
 * @param matchedQueryStyles
 * @param elementWidth
 * @param mediaFeature
 */
export const applyStylesByMediaFeature = (
	element,
	elementType,
	matchedQueryStyles,
	elementWidth,
	mediaFeature,
	initialEntryWidth,
	defaultStyles,
	children
) => {
	let applyMatchingQueryStyles = false;

	// revisit this when we need to add support for other mediaFeature beyond 'max-width' in the future
	const breakpoints = [
		...new Set(
			matchedQueryStyles.map((mqs) => get(mqs, ['query', mediaFeature], 0))
		)
	].sort((a, b) => b - a);
	const effectiveBreakpoint = getEffectiveBreakpoint(breakpoints, elementWidth);

	// Previous code was applying styles for all breakpoints that the elementWidth is less than, which is not accurate
	// This fix takes care of applying the appropriate breakpoint styles only
	if (effectiveBreakpoint) {
		const matchedQueryStyle = matchedQueryStyles.find(
			(mqs) => get(mqs, ['query', mediaFeature]) === effectiveBreakpoint
		);

		const autoReflowQuery = matchedQueryStyle?.query?.isAutoReflow;
		if (autoReflowQuery && getNowUxfReflowDisabled(element)) return;

		if (
			elementWidth <=
				parseInt(get(matchedQueryStyle, ['query', mediaFeature])) && // This condition might be redundant now. Revisit on next pass.
			!applyMatchingQueryStyles
		) {
			applyMatchingQueryStyles = true;
			setQueryStyles(
				matchedQueryStyle,
				element,
				children,
				defaultStyles,
				elementType
			);

			markReflow(element, {
				initialRes: initialEntryWidth,
				breakpoint: effectiveBreakpoint
			});
		}
	} else {
		// set the default styles
		setStyles(element, defaultStyles);
		// override any min width settings the element has, when we have upcoming breakpoints
		const overrideMinWidth = shouldOverrideMinWidth(element, breakpoints);
		if (overrideMinWidth) {
			element.style['min-width'] = null;
		}
	}
};

/**
 * shouldOverrideMinWidth
 * @param element
 * @param breakpoints Pass breakpoints in descending order
 * */
const shouldOverrideMinWidth = (element, breakpoints) => {
	if (breakpoints == null || breakpoints.length == 0) return false;
	const minWidthInStyle = element.style['min-width']
		? parseInt(element.style['min-width'])
		: 0;
	return minWidthInStyle > 0 && minWidthInStyle > breakpoints[0];
};

/**
 * getEffectiveBreakpoint
 * @param breakpoints Pass breakpoints in descending order
 * @param elementWidth
 * */
export const getEffectiveBreakpoint = (breakpoints, elementWidth) => {
	let lowerBreakpoint = 0;
	let upperBreakpoint;
	let effectiveBreakpoint;

	if (!breakpoints || breakpoints.length == 0) return effectiveBreakpoint;

	// revisit this when we need to add support for other mediaFeature beyond 'max-width' in the future
	for (let i = 0; i < breakpoints.length; i++) {
		upperBreakpoint = breakpoints[i];
		lowerBreakpoint = i + 1 < breakpoints.length ? breakpoints[i + 1] : 0;
		if (elementWidth <= upperBreakpoint && elementWidth > lowerBreakpoint) {
			effectiveBreakpoint = upperBreakpoint;
			break;
		}
	}
	return effectiveBreakpoint;
};

/**
 * Builds container layout styles
 * @param type
 * @param styles
 * @param isInline
 * @returns {{}}
 */
export const getContainerLayoutStyles = (type, styles, isInline) => {
	let containerStyles = {};

	if (type === 'flex') {
		if (isInline) {
			containerStyles = {...styles, display: INLINE_FLEX};
		} else {
			containerStyles = {...styles, display: FLEX};
		}
	} else if (type === 'grid') {
		if (isInline) {
			containerStyles = {...styles, display: INLINE_GRID};
		} else {
			containerStyles = {...styles, display: GRID};
		}
	}

	return containerStyles;
};

/**
 * generateContainerElementId
 *
 * @param parentComponentId
 * @returns {`container-${string}`}
 */
export const generateContainerElementId = (parentComponentId) => {
	return `container-${parentComponentId}`;
};

/**
 * generateChildElementId
 * @param elementId
 * @returns {string}
 */
export const generateChildElementId = (elementId) => {
	return `item-${elementId}`;
};

/**
 * isElementNotInLayout
 * @param child
 * @param model
 * @param isDesignTime
 * @returns {boolean}
 */
export const isElementNotInLayout = (child, model, isDesignTime) => {
	const {default: layoutDefault} = model;
	const {items} = layoutDefault;
	const elementsInLayoutModel = items.map((item) =>
		removeNamespaceFromComponentId(item.element_id)
	);
	const childElementId = getElementIdFromChild(child, isDesignTime);

	return (
		!isEmpty(childElementId) && !includes(elementsInLayoutModel, childElementId)
	);
};

/**!
 * isValidModelAndChildren
 * @param model
 * @param children
 * @returns {boolean}
 */
export const isValidModelAndChildren = (model, children) => {
	const compactedChildren = compact(children);
	return !isEmpty(model) && !isEmpty(compactedChildren);
};

/**
 * hasNonLayoutElements
 * @param children
 * @param model
 * @returns {boolean}
 */
export const hasNonLayoutElements = (children, model) => {
	let hasNonLayoutElements = false;
	const designTime = isDesignTime(children);

	forEach(children, (child) => {
		if (!isEmpty(child) && isElementNotInLayout(child, model, designTime)) {
			//  we set hasNonLayoutElements to truthy only when in composition but not likely
			//  be part of the layout model
			hasNonLayoutElements = true;
			return false;
		}
	});

	return hasNonLayoutElements;
};

/**
 * isNowModeActive
 * @param child
 */
export const isNowModeActive = (child) => {
	if (isRepeater(child)) {
		// For repeater node, tag is empty and we create a
		// DIV#repeater_1 element that will not have nowMode
		return true;
	} else {
		return get(child, ['data', 'props', 'nowMode'], '') === NOW_MODE_ACTIVE;
	}
};

/**
 * isRepeater
 * @param child
 * @returns {boolean}
 */
export const isRepeater = (child) => {
	const repeaterElType = get(child, 'data.dataset.type', '');
	return isEqual(repeaterElType, REPEATER);
};

/**
 * getElementIdFromChild
 * @param child
 * @param isDesignTime
 * @returns {*}
 */
export const getElementIdFromChild = (child, isDesignTime) => {
	let childElementId;

	/**
	 * In UIB elements uses "sn-uxf-element-mount" node. We use the layout model to
	 * render sn-uxf-element-mount nodes in the stage.
	 *
	 * Structure of the
	 * sn-uxf-element-mount {
	 * 	data: { attrs: { element-id: 'heading_1' } }
	 *  sel: 'sn-uxf-element-mount'
	 * }
	 *
	 * In runtime, we use generated componentId (rb36e2zb647-97-heading_1 - guid+elementId)
	 *
	 */

	if (isDesignTime) {
		// For UI Builder or when your passed in child doesn't actually have that component ID.
		// IE with wrapping elements or html partials.
		childElementId = get(child, 'data.attrs.element-id', '');
	} else {
		// The componentIds are being prepended with a cuid.
		// Need to strip it to match the component id in the item.
		// /[^-]+$/ - match everything after the last occurrence of "-"
		const childElId = get(child, 'data.props.componentId', '');

		if (childElId) {
			// for element type nodes, componentId is auto generated item
			childElementId = removeNamespaceFromComponentId(childElId);
		} else if (isRepeater(child)) {
			// special node type repeater doesn't have generated componentId
			childElementId = removeNamespaceFromComponentId(
				get(child, 'data.props.id')
			);
		}
	}

	return childElementId;
};

/**
 * findChildByElementId
 * @param children
 * @param elementId
 * @returns {*}
 */
export const findChildByElementId = (children, elementId) => {
	return find(
		children,
		(child) =>
			elementId === getElementIdFromChild(child, isDesignTime(children))
	);
};

/**
 * itemsExistsInModel
 * @param model
 * @returns {boolean}
 */
export const itemsExistsInModel = (model) => {
	return !!get(model, ['default', 'items'], []).length;
};

/**
 * isDesignTime
 * @param children
 * @returns {*}
 */
export const isDesignTime = (children) => {
	const isUIBElements = (child, sel) => isEqual(sel, get(child, ['sel']));

	return some(
		children,
		(child) =>
			isUIBElements(child, SN_UXF_ELEMENT_MOUNT) ||
			isUIBElements(child, UIB_DEFAULT_SLOTTED_WRAPPER)
	);
};

/**
 * findElement
 * @param el
 * @param elSelector
 * @param startElement
 * @returns {null|{shadowRoot}|*}
 */
export const findElement = (el, elSelector, startElement) => {
	if (!startElement) return null;

	let queue = [startElement];
	while (queue.length > 0) {
		const top = queue.shift();
		const ele = top.querySelector(el);
		if (ele && !elSelector) return ele;

		if (ele && ele.shadowRoot && ele.shadowRoot.querySelector(elSelector))
			return ele;

		const topShadow = top.shadowRoot;
		if (topShadow) queue.push(topShadow);

		const allSearched = top.querySelectorAll('*');
		for (let i = 0; i < allSearched.length; i++) {
			if (allSearched[i].shadowRoot) queue.push(allSearched[i].shadowRoot);
		}
	}
};

/**
 * getElementWidth
 * @param el
 * @returns {number}
 */
export const getElementWidth = (el) => {
	if (el === window) return window.innerWidth;
	const style = getComputedStyle(el);

	/**
	 * compute the width including the padding, border & margin
	 *   offsetWidth - width that include padding and border
	 */
	return (
		(el.offsetWidth || el.getBoundingClientRect().width) +
		parseInt(style.marginLeft) +
		parseInt(style.marginRight)
	);
};

/**
 * Forces layout recalculation and returns offset width
 * @param el
 * @returns {number}
 */
export const getOffsetWidth = (el) => {
	// Set the display to block to force layout calculation
	const display = el.style.display;
	el.style.display = 'block';
	const offsetWidth = el.offsetWidth;
	el.style.display = display;
	return offsetWidth;
};

/**
 * getLayoutType
 * @param styles
 * @returns {string}
 */
export const getLayoutType = (styles) => {
	const cssDisplay = get(styles, ['display']);
	const isLayoutFlex = cssDisplay === FLEX || cssDisplay === INLINE_FLEX;
	const isLayoutGrid = cssDisplay === GRID || cssDisplay === INLINE_GRID;

	let type;

	if (isLayoutFlex) type = 'flex';

	if (isLayoutGrid) type = 'grid';

	return type;
};

/**!
 * ignoreCachedStyles: Ignore the cache when the incoming layout type is
 * different from the cached styles for the element id
 * @param id
 * @param type
 * @returns {boolean}
 */
export const ignoreCachedStyles = (id, type) => {
	const cachedStyles = stylesCache.get(id);
	const cachedLayoutType = getLayoutType(cachedStyles);

	return !isEmpty(id) && !isEqual(type, cachedLayoutType);
};

/**
 * Generates the Id for the elemnets that gets registered to the Resize Observer pool
 * @param element
 * @returns {*}
 */
export const getROElementId = (element) => {
	return element
		? element.getAttribute('parent-component-id') || element.id
		: null;
};

/*
 * childHasDefinedSlot
 * @param {Node} child
 * @returns {boolean}
 */
export const childHasDefinedSlot = (child) =>
	Boolean(get(child, 'data.attrs.slot', false));

/**
 * arrangeChildrenByIfPredefinedSlot
 *
 * This function takes in an array of nodes and arranges them into two groups.
 * childrenWithPredefinedSlot are those that have a defined slot attribute
 * and otherChildren are those that do not.
 *
 * @param {Array<Node>} children
 * @returns {object}
 */
export const arrangeChildrenByIfPredefinedSlot = (children) => {
	const childrenWithPredefinedSlot = [];
	const otherChildren = [];
	children.forEach((child) => {
		if (childHasDefinedSlot(child)) {
			childrenWithPredefinedSlot.push(child);
		} else {
			otherChildren.push(child);
		}
	});
	return {childrenWithPredefinedSlot, otherChildren};
};

/**
 * generateElStylesCacheKey - Generate cache key for the element to cache it's styles.
 * @param isContainer
 * @param element
 * @returns {*}
 */
export const generateElStylesCacheKey = (isContainer, element) => {
	const parentComponentId = element.getAttribute('parent-component-id');

	return isContainer
		? `${get(element, 'parentElement.localName')}--${parentComponentId}`
		: get(element, ['id']);
};

/**
 * layoutModelForRepeatersWithLayout
 * @param nodeId
 * @param repeatWith
 * @param layoutModel
 * @param rendererDependencies
 * @param parentRepeaterItem
 * @returns {null|(*&{default: (*&{items: *[]})})|*}
 */
export const layoutModelForRepeatersWithLayout = (
	node,
	repeatWith,
	layoutModel,
	rendererDependencies,
	parentRepeaterItem
) => {
	const {getComponentIdFn: getComponentId} = rendererDependencies;

	if (isEmpty(layoutModel)) {
		return layoutModel;
	}
	if (isArray(repeatWith) && !isEmpty(repeatWith) && !isEmpty(layoutModel)) {
		// build the layout model to account the items in the
		// layout definition based on the repeatWith items
		const {
			default: {items}
		} = layoutModel;
		let updatedItems = [];
		forEach(repeatWith, (repeatedItem, index) => {
			// build the prefix for item's elementId e.g. repeater_1
			const prefix = `${removeNamespaceFromComponentId(
				getComponentId(node.nodeId, parentRepeaterItem)
			)}_${index}`;
			forEach(items, (item) => {
				const {element_id: elementId} = item;
				let updatedElementId = `${prefix}_${elementId}`;
				const newItem = {...item, element_id: updatedElementId};
				updatedItems.push(newItem);
			});
		});
		// re-construct the layout model with updated items
		return {
			...layoutModel,
			default: {
				...layoutModel.default,
				items: [...updatedItems]
			}
		};
	}
	return null;
};

export const removeNamespaceFromComponentId = memoize((componentId) => {
	const match = componentId.match(/[^-]+$/);
	return match ? match[0] : componentId;
});

export const groupReflowPropsByReference = (props) => {
	const result = {};
	for (const [key, value] of Object.entries(props)) {
		try {
			const valueObj = JSON.parse(value);
			const {reference = REFERENCE_ELEMENT, propertyValues} = valueObj; //default reference is element.
			if (!result[reference]) result[reference] = {};
			result[reference][key] = propertyValues;
		} catch (err) {
			console.error('Props can not be parsed!!! ', err);
		}
	}
	return result;
};

export const groupQueriesByReference = (queries) => {
	const result = {};
	for (const queryObj of queries) {
		const {
			query: {reference = REFERENCE_ELEMENT}
		} = queryObj; //default reference is element.
		if (!result[reference]) result[reference] = [];
		result[reference].push(queryObj);
	}
	return result;
};

export const getReferenceTargetElement = (element, reference) => {
	if (!element || !reference) return;
	let refElement;
	switch (reference) {
		case REFERENCE_ELEMENT:
			refElement = element;
			break;
		case REFERENCE_CONTAINER:
			refElement = element.parentElement;
			break;
		case REFERENCE_PAGE:
			refElement = window;
			break;
		default:
			refElement = element;
			break;
	}

	return refElement;
};

export const reflowApplyOrderByRef = () => [
	REFERENCE_PAGE,
	REFERENCE_CONTAINER,
	REFERENCE_ELEMENT
]; //element ref has high priority and overrides any other props

export const getNowUxfReflowDisabled = (element) => {
	try {
		if (!element) {
			console.warn('Element is undefined or null.');
			return false;
		}
		const host = element?.getRootNode()?.host;
		// handle sub page scenarios
		const nowUxfReflowDisabled =
			host?.nowUxfReflowDisabled ??
			host?.getRootNode()?.host?.nowUxfReflowDisabled;
		return (
			nowUxfReflowDisabled.nowUxfReflowDisabledAppConfig ||
			nowUxfReflowDisabled.nowUxfReflowDisabledScreen
		);
	} catch (e) {
		console.warn('Unable to determine autoreflow disable rule.');
	}
	return false;
};
