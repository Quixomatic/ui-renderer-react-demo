/**
 * This behavior adds the ability for a component to make aria status
 * announcements without requiring a separate seismic component to do so. It
 * will eventually be replaced with a global aria status region.
 *
 * This code is located in now-record-list and condition-builder-commons, due to
 * the lack of a central repo that is shared by now-record-list,
 * now-condition-builder, and now-condition-builder-preview.
 *
 * ANY CHANGES MADE TO THIS BEHAVIOR SHOULD BE MADE TO BOTH COPIES
 */

import {actionTypes} from '@servicenow/ui-core';

const ARIA_STATUS_BEHAVIOR_NAME = 'ariaStatus';
const ARIA_STATUS_ID_BASE = 'aria-status';
export const ARIA_STATUS_MESSAGE = 'ARIA_STATUS#MESSAGE';

const {COMPONENT_CONNECTED} = actionTypes;

const ariaStatusBehavior = {
	name: ARIA_STATUS_BEHAVIOR_NAME,
	actionHandlers: {
		[COMPONENT_CONNECTED]: ({host}) => {
			const hostId = host.nowId;

			const elm = document.createElement('div');
			elm.id = `${ARIA_STATUS_ID_BASE}-${hostId}`;
			elm.setAttribute('role', 'status');
			elm.style.cssText =
				'position: absolute;width: 1px;height: 1px;padding: 0;margin: -1px;overflow: hidden;clip: rect(0,0,0,0);border: 0;';
			// NVDA doesn't pick up the first status unless the component
			// already had text in it, so a space is put in at the start.
			elm.innerHTML = ' ';
			host.shadowRoot.appendChild(elm);
		},
		[ARIA_STATUS_MESSAGE]: {
			effect: ({host, action: {payload}}) => {
				const hostId = host.nowId;
				const {message} = payload;

				const elm = host.shadowRoot.querySelector(
					`#${ARIA_STATUS_ID_BASE}-${hostId}`
				);
				elm.innerHTML = '';

				setTimeout(() => {
					elm.innerHTML = message;
				}, 250);
			},
			stopPropagation: true
		}
	}
};

export default ariaStatusBehavior;
