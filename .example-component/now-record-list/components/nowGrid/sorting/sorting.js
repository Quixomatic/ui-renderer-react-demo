import get from 'lodash/get';
import set from 'lodash/set';

import {
	CURRENT_FOCUS_STATE_PATH,
	SHOULD_FOCUS_SORTED_STATE_PATH
} from '../../../behaviors/actions/gridControlActions';
import {dirtyModalInterceptor} from '../../../behaviors/dirtyBehavior/dirtyBehavior';
import {
	ASCENDING,
	DESCENDING,
	GRID_UPDATE_SORT,
	LIST_UPDATE_SORT,
	METRIC_TRACKED
} from '../../../constants';
import {SORT_COLUMN_EVENT} from '../../../utils/metrics/constants';
import {TH_TAG_NAME} from '../constants';
export const PLUGIN_NAME = 'gridSorting';
export const BEHAVIOR_PATH = ['behaviors', PLUGIN_NAME];
export const OPTIONS_PATH = ['options', PLUGIN_NAME];

export function instantiatePlugin() {
	return {
		transform(state) {
			return set(state, OPTIONS_PATH, get(state, BEHAVIOR_PATH, {}));
		},
		behavior: {
			name: PLUGIN_NAME,
			actionHandlers: {
				[GRID_UPDATE_SORT]: {
					effect: coeffects => {
						const {action, updateState, dispatch} = coeffects;

						const {
							payload: {
								column,
								nextDirection,
								path,
								column: {columnName}
							}
						} = action;

						const sort = nextDirection ? DESCENDING : ASCENDING;

						const selectedElement = path.find(
							element => element.tagName === TH_TAG_NAME
						);

						const columnIndex = selectedElement.cellIndex;
						const newFocus = {
							row: 0,
							cell: columnIndex,
							node: selectedElement
						};

						const metadata = {
							columnName,
							sort
						};
						dispatch(METRIC_TRACKED, {eventName: SORT_COLUMN_EVENT, metadata});
						dispatch(LIST_UPDATE_SORT, {column, nextDirection});
						updateState([
							{
								operation: 'set',
								path: CURRENT_FOCUS_STATE_PATH,
								value: newFocus,
								shouldRender: false
							},
							{
								operation: 'set',
								path: SHOULD_FOCUS_SORTED_STATE_PATH,
								value: true,
								shouldRender: false
							}
						]);
					},
					stopPropagation: true
				},
				interceptors: [dirtyModalInterceptor]
			}
		}
	};
}
