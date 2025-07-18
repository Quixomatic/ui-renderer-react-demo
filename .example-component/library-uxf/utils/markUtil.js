import {mark, getInteractionId} from '@servicenow/ui-metrics';
import getUxfSysProp from './getUxfSysProp';
import {get} from '@devsnc/snowdash';

export const SYS_PROP_PERF_ENABLED =
	getUxfSysProp('glide.uxf.lib.performance.monitoring.enabled', 'false') ===
	'true';

export const markDBExecEffect = (eventName, coeffects) => {
	if (!(SYS_PROP_PERF_ENABLED || eventName || coeffects)) return;
	const {
		host,
		action: {
			meta: {pipelineId, request = {}},
			payload
		}
	} = coeffects;

	const interactionId = getInteractionId(get(coeffects, 'action.meta'));
	const result = get(payload, 'result', []);
	if (Array.isArray(result)) {
		const executions = result.map((element, index) => ({
			sysId: get(request, `data[${index}].definitionSysId`),
			executionTime: get(element, 'executionTime')
		}));
		mark(host, interactionId, eventName, {pipelineId, payload, executions});
	}
};
