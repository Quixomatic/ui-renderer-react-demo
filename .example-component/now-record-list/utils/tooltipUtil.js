import {
	TOOLTIP_ADD_TARGET,
	TOOLTIP_REMOVE_TARGET,
	TOOLTIP_SHOW,
	TOOLTIP_HIDE
} from '@servicenow/behavior-tooltip';

/**
 * This util adds a tooltip anywhere on now-list. The target elm must have a data-tooltip attribute.
 * @param {*} dispatch seismic dispatch
 */
export default function getTooltip(dispatch) {
	return {
		'hook-insert': ({elm}) => {
			dispatch(TOOLTIP_ADD_TARGET, {target: elm});
		},
		'hook-destroy': ({elm}) => {
			dispatch(TOOLTIP_REMOVE_TARGET, {target: elm});
		}
	};
}

/**
 * checks if the text is truncated in an element,
 * if the text is overflowing as per the css it shows ellipsis when we have overflow:ellipsis
 * @param {HTMLElement} elem
 * @returns {boolean}
 */
export const isOverflowing = elem => {
	const {offsetHeight, scrollHeight, offsetWidth, scrollWidth} = elem;
	return offsetHeight < scrollHeight || offsetWidth < scrollWidth;
};

/**
 * do not show tooltip for now-highlighted-value when truncated
 * now-highlighted-value component is already handling showing tooltip on truncation (onmouseover).
 * no need to handle this onfocus as now-highlighted-value is not focusable
 */
const isHighlightedValueTruncated = currentTarget => {
	const highLightedValue = currentTarget.querySelector('now-highlighted-value');
	if (highLightedValue) {
		const span = highLightedValue.shadowRoot?.querySelector(
			'span.will-truncate'
		);
		if (isOverflowing(span)) {
			return true;
		}
	}
	return false;
};

/**
 * Dispatches TOOLTIP_SHOW (from tooltip behavior)
 * @param {*} dispatch
 * @param {*} event
 */
export const handleShowTooltip = (dispatch, {currentTarget, target}) => {
	const tooltipTarget = target?.dataset?.tooltip ? target : currentTarget;
	const tooltip = tooltipTarget?.dataset?.tooltip;
	if (!tooltip) return;
	const shouldShow = !isHighlightedValueTruncated(tooltipTarget);
	shouldShow && dispatch(TOOLTIP_SHOW, {target: tooltipTarget});
};

/**
 * @param {*} dispatch
 * @param {*} event
 */
export const handleShowTooltipOnFocus = (dispatch, {currentTarget, target}) => {
	const tooltip = currentTarget?.dataset?.tooltip;
	if (!tooltip) return;
	dispatch(TOOLTIP_SHOW, {target: target});
};

/**
 * @param {*} dispatch
 * @param {*} event
 */
export const handleRemoveTooltip = (dispatch, {currentTarget, target}) => {
	const tooltipTarget = target?.dataset?.tooltip ? target : currentTarget;
	const tooltip = tooltipTarget?.dataset?.tooltip;
	if (!tooltip) return;
	dispatch(TOOLTIP_HIDE, {target: tooltipTarget});
};
