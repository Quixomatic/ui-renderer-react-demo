import getNavigateApi, {
	DISPATCHED_EVENTS as navigationDispatchedEvents
} from './apis/navigate';
import http from './apis/http';
import getModalApi, {
	DISPATCHED_EVENTS as modalDispatchedEvents
} from './apis/modal';
import getScreenApi, {
	DISPATCHED_EVENTS as screenDispatchedEvents
} from './apis/screen';
import translate from './apis/translate';
import timing from './apis/timing';
import {writeText} from './apis/write';

export const dispatchedEvents = [
	...navigationDispatchedEvents,
	...modalDispatchedEvents,
	...screenDispatchedEvents
];

export default function getEventHandlerHelpers(host, emit, dispatch) {
	return {
		snHttp: http,
		navigate: getNavigateApi(emit),
		modal: getModalApi(dispatch, host),
		screen: getScreenApi(emit),
		timing,
		translate,
		writeText
	};
}
