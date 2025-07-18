import get from 'lodash/get';

export const PLUGIN_NAME = 'featureFlags';
export const BEHAVIOR_PATH = ['behaviors', PLUGIN_NAME];
export const OPTIONS_PATH = ['options', PLUGIN_NAME];

const getFeatureFlags = state =>
	get(state, [...OPTIONS_PATH, 'featureFlags'], {});

export const featureFlagSelectors = {
	getFeatureFlags
};

export function instantiatePlugin() {
	return {
		transform(state) {
			const {
				properties: {
					hideInlineEditing,
					hideCellFilter,
					hideColumnSorting,
					hideColumnGrouping,
					hideColumnFiltering,
					hideColumnResizing,
					hideColumnReorder,
					hideDotwalk,
					hideLinks,
					hideLiveList,
					hideHighlightContent,
					hideHighlightedValues,
					hideSelectAll
				}
			} = state;

			const headerCellFlags = {
				hideColumnSorting,
				hideColumnGrouping,
				hideColumnFiltering,
				hideColumnResizing,
				hideColumnReorder,
				hideDotwalk,
				hideSelectAll
			};

			const bodyCellFlags = {
				hideInlineEditing,
				hideCellFilter,
				hideLinks,
				hideLiveList,
				hideHighlightContent,
				hideHighlightedValues
			};

			const featureFlags = {
				headerCellFlags,
				bodyCellFlags
			};

			return {
				...state,
				options: {
					...state.options,
					featureFlags: {
						featureFlags
					}
				}
			};
		},
		behavior: {
			name: PLUGIN_NAME
		}
	};
}
