import {isPlainObject} from '@devsnc/snowdash';
import {
	mark,
	defineMetric,
	getMetricTypes,
	getInteractionId
} from '@servicenow/ui-metrics';

const isMetricDefined = (event) => getMetricTypes()[event];
const USAGE_METRIC_LEVEL = 5;
const USAGE_MARK_TYPE = 'usage';

export default function trackUsageActionHandler({
	action: {
		payload: {event, value},
		meta
	},
	host
}) {
	if (!event || !isPlainObject(value)) return;

	if (!isMetricDefined(event)) defineMetric(event, USAGE_METRIC_LEVEL);

	mark(host, getInteractionId(meta), event, value, USAGE_MARK_TYPE);
}
