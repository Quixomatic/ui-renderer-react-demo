import {isEmpty} from '@devsnc/snowdash';
import {get} from '@devsnc/snowdash';
import {debounce} from '@devsnc/snowdash';
import {stylesCache, applyQueryStyles, applyPropertyValues} from './styler';
import {getROElementId} from './helpers';
import {REFLOW_PROP} from './constants';

/**
 * Pool of resize listeners
 * @type {{}}
 */
export const ResizeObserverPool = new Map();

let initialEntryWidth = null;

/**
 * onElementResize
 * @param element
 * @param queries
 * @param elementType
 */
export const registerResizeObserver = (
	element,
	queries,
	elementType,
	children
) => {
	let resizeObserver;
	const roElementId = getROElementId(element);

	if (isEmpty(ResizeObserverPool.get(roElementId))) {
		resizeObserver = new ResizeObserver(
			debounce((entries) => {
				const entry = entries[0];

				/* No point in going beyond this point, if the element width is 0 - Currently we are
				applying styles unnecessarily when the page loads initially and element widths are 0 */
				if (entry.contentRect.width === 0) return;

				initialEntryWidth = initialEntryWidth || entry.contentRect.width;

				// determine matched queries based on feature - max-width, min-width etc.
				if (!isEmpty(queries))
					applyQueryStyles(
						entry.target,
						element.defaultStyles || {},
						queries,
						elementType,
						initialEntryWidth,
						children
					);

				const propertyValues = get(entry.target, [REFLOW_PROP], null);
				if (!isEmpty(propertyValues))
					applyPropertyValues(entry.target, propertyValues, initialEntryWidth);

				// Handle reflow property updates for non-layout parent and child case
				if (
					entry?.target?.children?.length > 0 &&
					elementType === 'CHILD_ELEMENT'
				) {
					[...entry.target.children].forEach((child) => {
						const childPropertyValues = get(child, [REFLOW_PROP], null);
						if (!isEmpty(childPropertyValues))
							applyPropertyValues(
								child,
								childPropertyValues,
								initialEntryWidth
							);
					});
				}
			}, 60)
		);
		ResizeObserverPool.set(roElementId, resizeObserver);
		resizeObserver.observe(element);
	}
};

/**
 * removeResizeObserver
 * @param element
 */
export const removeResizeObserver = (element) => {
	const roElementId = getROElementId(element);

	if (roElementId) {
		/**
		 * On element deletion, let's do some clean up
		 *  - unobserve the resize observer
		 *  - remove from the ResizeObserverPool and
		 *  - remove stylesCache associated to the element
		 */

		const resizeObserver = ResizeObserverPool.get(roElementId);

		if (resizeObserver) {
			// Unobserve the resizeObserver and
			// remove from the resize observer pool
			resizeObserver.unobserve(element);
			ResizeObserverPool.delete(roElementId);
		}

		// Remove the stylesCache associated to the element
		stylesCache.delete(roElementId);
	}
};
