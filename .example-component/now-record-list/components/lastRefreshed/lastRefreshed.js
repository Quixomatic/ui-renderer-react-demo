import {actionTypes, createCustomElement} from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';
import isEmpty from 'lodash/isEmpty';
import {SnTimeAgo} from 'sn-component-timeago';
import {t} from 'sn-translate';

import styles from './lastRefreshed.scss';

const {
	COMPONENT_DISCONNECTED,
	COMPONENT_PROPERTY_CHANGED,
	COMPONENT_CONNECTED
} = actionTypes;

const options = {
	timeAgo: true,
	dateBoth: false,
	systemTime: false,
	dateOnly: false,
	verbose: false
};

const update = updateState => {
	return tickTime => {
		updateState({time: tickTime.time});
	};
};

const updateTimeAgo = (state, properties, value, updateState) => {
	if (!isEmpty(state.timeAgo)) state.timeAgo.remove();
	const timeAgo = new SnTimeAgo({timestampLong: value}, value, options);
	timeAgo.setUpdateFn(update(updateState));
	const time = timeAgo.getTickTime().time;
	updateState({timeAgo, time});
};

const view = state => {
	const {time, properties} = state;
	const {liveLists} = properties;
	const refreshIconMessage = t('Check the refresh icon for updates.');
	const liveListsMessage = liveLists ? ` ${refreshIconMessage}` : '';

	return (
		<div className="sn-last-refreshed">
			{t('Last refreshed')} <time>{time}</time>
			{liveListsMessage}
		</div>
	);
};

createCustomElement('sn-record-list-last-refreshed-text', {
	properties: {
		dataUpdatedTime: {},
		liveLists: {default: false}
	},
	initialState: {
		timeAgo: {}
	},
	renderer: {
		type: snabbdom,
		view
	},
	actionHandlers: {
		[COMPONENT_DISCONNECTED]: ({state}) => {
			if (!isEmpty(state.timeAgo)) state.timeAgo.remove();
		},
		[COMPONENT_PROPERTY_CHANGED]: ({
			state,
			properties,
			action: {
				payload: {name, value}
			},
			updateState
		}) => {
			if (name === 'dataUpdatedTime') {
				updateTimeAgo(state, properties, value, updateState);
			}
		},
		[COMPONENT_CONNECTED]: {
			effect({state, properties, properties: {dataUpdatedTime}, updateState}) {
				updateTimeAgo(state, properties, dataUpdatedTime, updateState);
			}
		}
	},
	styles
});
