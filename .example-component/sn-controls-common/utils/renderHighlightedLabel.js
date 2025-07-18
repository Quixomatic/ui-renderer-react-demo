import '@servicenow/now-highlighted-value';
import { isEmpty } from 'lodash';
import { Fragment } from '@servicenow/ui-renderer-snabbdom';

import './renderCustomHighlightedLabel';
const normalizeHighlightedValues = highlightedValues => {
	if (!highlightedValues) {
		return [];
	}
	if (Array.isArray(highlightedValues)) {
		const flattened = highlightedValues.flat();
		return flattened.filter((hv, index) => {
			return index === 0 || !isEmpty(hv);
		})
	}
	else if (typeof highlightedValues === 'object') {
		return [highlightedValues];
	}
}

export const renderHighlightedValue = (highlightedValue, fieldLayout = { layout: 'vertical' }) => {
	const [defaultHighlightedValue, ...customHighlightedValues] = normalizeHighlightedValues(highlightedValue);
	const {
		value: highlightedValueLabel,
		status,
		showIcon,
		variantName,
		colorName,
		iconName
	} = defaultHighlightedValue || {};

	return (
		<Fragment>
			{!isEmpty(defaultHighlightedValue) && (
				<now-highlighted-value
					slot="label-end"
					label={highlightedValueLabel}
					color={colorName}
					show-icon={showIcon}
					variant={variantName}
					icon={showIcon ? iconName : null}
					status={!colorName ? status : null}
					class={{'first-label-end': customHighlightedValues.length && fieldLayout.layout === 'horizontal'}}
				></now-highlighted-value>
			)}
			{customHighlightedValues.map(hv => (
				<sn-custom-highlighted-label slot="label-end" customHighlightedLabel={hv} fieldLayout={fieldLayout}/>
			))}
		</Fragment>
	);
};
