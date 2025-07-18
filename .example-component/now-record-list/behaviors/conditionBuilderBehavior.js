import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import {
	ADVANCED_VIEW_SET_QUERY,
	BUTTON_CLICKED,
	BUTTON_CONDITION_BUILDER_RUN,
	CONDITION_BUILDER_ENCODED_QUERY_SET,
	OPEN_PANEL,
	TEXT_LINK_CLICKED
} from '../constants';

export const BEHAVIOR_NAME = 'conditionBuilder';

export const handleEncodedQuerySet = coeffects => {
	const {
		action: {payload},
		updateState
	} = coeffects;

	if (!payload.partial) {
		const comparisonModel = get(payload, 'queryModel.comparisonModel', []);

		let filterCount = comparisonModel.length;

		// NOTE: Replace with getFilterCount() when it's ready in CB.
		if (comparisonModel.length === 1 && comparisonModel[0].conditionValue) {
			const {conditionValue} = comparisonModel[0];
			if (!isEmpty(conditionValue)) {
				const {internal, display, displayParts} = conditionValue;

				if (internal === '' && display === '' && displayParts.length === 0) {
					filterCount = 0;
				}
			}
		}

		updateState({
			path: `behaviors.${BEHAVIOR_NAME}`,
			value: {
				filterCount,
				encodedQuery: payload.value
			},
			operation: 'merge'
		});
	}
};

export const handleButtonClick = coeffects => {
	const {
		action: {meta},
		dispatch,
		state: {
			behaviors: {
				[BEHAVIOR_NAME]: {encodedQuery}
			}
		},
		updateState
	} = coeffects;

	if (meta.componentName === BUTTON_CONDITION_BUILDER_RUN) {
		dispatch(ADVANCED_VIEW_SET_QUERY, {query: encodedQuery});

		updateState({
			path: `behaviors.${BEHAVIOR_NAME}.isFilterOverviewCollapsed`,
			value: true,
			operation: 'set'
		});
	}
};

export const handleTextLinkClicked = coeffects => {
	const {
		action: {
			payload: {actionName}
		},
		updateState
	} = coeffects;

	if (actionName === OPEN_PANEL) {
		updateState({
			path: `behaviors.${BEHAVIOR_NAME}.isFilterOverviewCollapsed`,
			value: false,
			operation: 'set'
		});
	}
};

export const conditionBuilderBehavior = {
	name: BEHAVIOR_NAME,
	setInitialState: () => {
		return {
			encodedQuery: '',
			filterCount: 0,
			isFilterOverviewCollapsed: true
		};
	},
	actionHandlers: {
		[CONDITION_BUILDER_ENCODED_QUERY_SET]: {
			effect: handleEncodedQuerySet,
			stopPropagation: true
		},
		[BUTTON_CLICKED]: {
			effect: handleButtonClick,
			stopPropagation: true
		},
		[TEXT_LINK_CLICKED]: {
			effect: handleTextLinkClicked,
			stopPropagation: true
		}
	}
};
