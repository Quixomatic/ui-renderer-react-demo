import '@servicenow/now-highlighted-value';
// eslint-disable-next-line no-unused-vars
import react from '@servicenow/ui-renderer-react';
import { isEmpty } from 'lodash';
import React from 'react';

// TODO: Currently React components supports only React fragments
// To be removed in future when all components are migrated to Snabdom
export const renderHighlightedValueReact = highlightedValue => {
	const {
		value: highlightedValueLabel,
		status,
		showIcon,
		variantName,
		colorName,
		iconName
	} = highlightedValue || {};

	return (
		<React.Fragment>
			{!isEmpty(highlightedValue) && (
				<now-highlighted-value
					slot="label-end"
					label={highlightedValueLabel}
					color={colorName}
					show-icon={showIcon}
					variant={variantName}
					icon={showIcon ? iconName : null}
					status={!colorName ? status : null}
				></now-highlighted-value>
			)}
		</React.Fragment>
	);
};
