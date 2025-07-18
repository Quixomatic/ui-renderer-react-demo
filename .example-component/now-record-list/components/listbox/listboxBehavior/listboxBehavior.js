import {
	KEY_ARROW_DOWN,
	KEY_ARROW_UP,
	KEY_DOWN,
	KEY_SPACE,
	KEY_SPACEBAR,
	KEY_UP,
	LISTBOX_FOCUS,
	LISTBOX_SELECT
} from '../constants';

import actionHandlers from './listboxBehaviorActions';

const elementListeners = new Map();

export const listboxKeyControls = {
	name: 'listboxKeyControls',
	initialState: {
		currentFocused: -1
	},
	actionHandlers,
	onConnect(host, dispatch) {
		const keydownListener = evt => {
			let preventDefault = true;

			switch (evt.key) {
				case KEY_UP:
				case KEY_ARROW_UP:
					dispatch(LISTBOX_FOCUS, {offset: KEY_ARROW_UP});
					break;
				case KEY_DOWN:
				case KEY_ARROW_DOWN:
					dispatch(LISTBOX_FOCUS, {offset: KEY_ARROW_DOWN});
					break;
				case KEY_SPACEBAR:
				case KEY_SPACE:
					dispatch(LISTBOX_SELECT);
					break;
				default:
					preventDefault = false;
					break;
			}

			if (preventDefault) evt.preventDefault();
			evt.stopPropagation();
		};

		host.addEventListener('keydown', keydownListener);
		elementListeners.set(host, keydownListener);
	},
	onDisconnect(host) {
		// Clean Up Handlers
		const keydownListener = elementListeners.get(host);
		if (keydownListener) {
			elementListeners.delete(host);
			host.removeEventListener('keydown', keydownListener);
		}
	}
};
