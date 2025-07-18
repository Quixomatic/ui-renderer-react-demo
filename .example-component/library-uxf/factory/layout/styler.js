import {FLEX, GRID, INLINE_FLEX, INLINE_GRID} from './constants';
import {
	applyStylesByMediaFeature,
	defaultItemStyles,
	getMatchingQueryStyles,
	hasQueryStyles,
	setStyles,
	getElementWidth,
	clearStyles,
	generateElStylesCacheKey,
	getEffectiveBreakpoint,
	groupReflowPropsByReference,
	groupQueriesByReference,
	getReferenceTargetElement,
	reflowApplyOrderByRef,
	getNowUxfReflowDisabled
} from './helpers';
import {isEmpty} from '@devsnc/snowdash';
import {isEqual} from '@devsnc/snowdash';
import {markReflow} from './trackUsageReflowHandler';

export const stylesCache = new Map();
export const propertyCache = new Map();

/**
 * baseStyles
 * @param isContainer
 * @param layoutModel
 * @param elStyles
 * @returns {(*)|(*&{"min-height": string, "min-width": string})}
 */
const baseStyles = (isContainer, item, layoutModel, elStyles) => {
	const {default: layoutDefault} = layoutModel;

	if (isContainer) {
		const {rules, styles} = layoutDefault;

		return {
			...rules,
			...styles,
			...elStyles
		};
	} else {
		const {styles, rules} = item;

		return {
			...defaultItemStyles(),
			...rules,
			...styles,
			...elStyles
		};
	}
};

export const getStyles = (
	item,
	layoutModel,
	isContainer = false,
	elStyles = {}
) => {
	const {default: layoutDefault} = layoutModel;
	const {type, isInline} = layoutDefault;
	let styles = {};
	let defaultStyles = baseStyles(isContainer, item, layoutModel, elStyles);

	if (isContainer) {
		// process styles for the container
		if (type === 'flex') {
			if (isInline) {
				styles = {...defaultStyles, display: INLINE_FLEX};
			} else {
				styles = {...defaultStyles, display: FLEX};
			}
		} else if (type === 'grid') {
			if (isInline) {
				styles = {...defaultStyles, display: INLINE_GRID};
			} else {
				styles = {...defaultStyles, display: GRID};
			}
		}
	} else {
		// process styles for the items inside the container
		styles = {...defaultStyles};
	}

	return styles;
};

/**
 * applyQueryStyles
 * @param element
 * @param defaultStyles
 * @param queries
 * @param elementType
 */
export const applyQueryStyles = (
	element,
	defaultStyles,
	queries,
	elementType,
	initialEntryWidth,
	children
) => {
	const elementId = element.id;

	// determine matched queries based on feature - max-width, min-width etc.
	//  - implementing only for max-width for POC
	const mqs = getMatchingQueryStyles(queries, 'max-width');

	const querySettingOrder = reflowApplyOrderByRef();
	const groupedMQS = groupQueriesByReference(mqs);

	for (let i = 0; i < querySettingOrder.length; i++) {
		const key = querySettingOrder[i];
		const refMQS = groupedMQS[key];

		if (!isEmpty(refMQS) && hasQueryStyles(refMQS[0], elementId, elementType)) {
			const refElement = getReferenceTargetElement(element, key);
			let widthToConsider = getElementWidth(refElement);

			// set the query styles
			applyStylesByMediaFeature(
				element,
				elementType,
				refMQS,
				widthToConsider,
				'max-width',
				initialEntryWidth,
				defaultStyles,
				children
			);
		}
	}
};

/**
 * applyStyles
 * @param element
 * @param layoutModel
 * @param isContainer
 * @param elStyles
 */
export const applyStyles = (
	element,
	item,
	layoutModel,
	isContainer = false,
	elStyles = {},
	ignoreCache = false
) => {
	const styles = getStyles(item, layoutModel, isContainer, elStyles);
	const elStylesCacheKey = generateElStylesCacheKey(isContainer, element);

	if (isEmpty(elStylesCacheKey)) return;
	const elStylesFromCache = stylesCache.get(elStylesCacheKey);

	if (ignoreCache) {
		// clear element's cached styles before applying the incoming styles
		clearStyles(element, elStylesFromCache);

		// apply the incoming styles and update the cache
		setStyles(element, styles);
		stylesCache.set(elStylesCacheKey, styles);
	} else {
		if (isEmpty(elStylesFromCache)) {
			// not in the stylesCache, set the element styles
			// and update the stylesCache
			setStyles(element, styles);
			stylesCache.set(elStylesCacheKey, styles);
		} else if (!isEqual(elStylesFromCache, styles)) {
			// clear element's cached styles before applying the incoming styles
			clearStyles(element, elStylesFromCache);

			// Apply the styles for the element when incoming styles
			// are different from the stylesCache for teh element
			// and update the stylesCache
			setStyles(element, styles);
			stylesCache.set(elStylesCacheKey, styles);
		} else {
			// element's style in cache and incoming styles are same
			// just apply the styles & don't update to the cache
			setStyles(element, styles);
		}
	}
};

const applyPropertyValuesByReference = (
	targetElement,
	refElement,
	propertyValues,
	initialEntryWidth
) => {
	const breakPoints = Object.keys(propertyValues).map(Number).sort().reverse();

	let refElementWidth = getElementWidth(refElement);

	const effectiveBreakpoint = getEffectiveBreakpoint(
		breakPoints,
		refElementWidth
	);

	if (effectiveBreakpoint) {
		setProperties(targetElement, propertyValues[effectiveBreakpoint]);
		markReflow(targetElement, {
			initialRes: initialEntryWidth,
			breakpoint: effectiveBreakpoint
		});
		return effectiveBreakpoint;
	}
};

const setPropertyCache = (element, props) => {
	const elemId = element.id ? element.id : element.componentId;
	propertyCache.set(elemId, props);
};

const getPropertyCache = (element) => {
	const elemId = element.id ? element.id : element.componentId;
	return propertyCache.get(elemId);
};

/**
 * applyPropertyValues
 * @param element
 * @param propertyValues Property values with breakpoint as key
 * @param initialEntryWidth
 */
export const applyPropertyValues = (
	element,
	propertyValues,
	initialEntryWidth
) => {
	if (getNowUxfReflowDisabled(element)) return;

	const reflowPropRefMap = groupReflowPropsByReference(propertyValues);
	const propSettingOrder = reflowApplyOrderByRef();

	let effectiveBreakpoint = false;

	for (let i = 0; i < propSettingOrder.length; i++) {
		const key = propSettingOrder[i];
		if (reflowPropRefMap[key]) {
			const breakpoint = applyPropertyValuesByReference(
				element,
				getReferenceTargetElement(element, key),
				reflowPropRefMap[key],
				initialEntryWidth
			);
			if (breakpoint) effectiveBreakpoint = breakpoint;
		}
	}

	if (!effectiveBreakpoint)
		setProperties(element, getPropertyCache(element), effectiveBreakpoint); //set default properties
};

/**
 * setProperties
 * @param element
 * @param properties Properties to Update
 * @param effectiveBreakpoint
 */
export const setProperties = (element, properties, effectiveBreakpoint) => {
	if (isEmpty(properties)) return;

	if (element.helpers && element.helpers.updateProperties) {
		let propsToUpdate = {};
		const currentProps = element.getProperties();

		for (const [key, value] of Object.entries(properties)) {
			if (!isEqual(currentProps[key], value)) {
				propsToUpdate[key] = value;
			}
		}

		if (!isEmpty(propsToUpdate)) {
			if (!getPropertyCache(element) && !effectiveBreakpoint)
				setPropertyCache(element, currentProps);
			element.helpers.updateProperties(propsToUpdate);
		}
	}
};
