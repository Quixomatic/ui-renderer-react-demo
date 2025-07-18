import {
	CELL_FILTERING_ENTER,
	KEY_ARROW_DOWN,
	KEY_ARROW_UP,
	KEY_CODE_ENTER,
	KEY_ENTER,
	KEY_SPACEBAR
} from '../components/cellFiltering/constants';

export const cellFilterEventHandlers = [
	{
		events: ['keydown'],
		effect({action, dispatch, properties}) {
			const {
				payload: {event}
			} = action;
			const {selectionIndex} = properties;

			if (event.key === KEY_ARROW_UP || event.key === KEY_ARROW_DOWN) {
				const newSelectionIndex = selectionIndex === 0 ? 1 : 0;

				event.stopPropagation();
				event.preventDefault();

				dispatch('PROPERTIES_SET', {
					selectionIndex: newSelectionIndex
				});
			} else if (
				event.key === KEY_ENTER ||
				event.key === KEY_SPACEBAR ||
				event.keyCode === KEY_CODE_ENTER
			) {
				event.stopPropagation();
				dispatch(CELL_FILTERING_ENTER);
			}
		},
		target: document,
		capture: true
	}
];

export default cellFilterEventHandlers;
