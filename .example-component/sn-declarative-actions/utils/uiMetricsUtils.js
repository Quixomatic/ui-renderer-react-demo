import {getInteractionId, mark} from '@servicenow/ui-metrics';

export default function track(coeffects, eventName, metadata = {}) {
	const {
		host,
		action: {meta = {}},
		properties: {nowId = ''}
	} = coeffects;
	const interactionId = getInteractionId(meta) || nowId;
	mark(host, interactionId, eventName, metadata, 'performance');
}
