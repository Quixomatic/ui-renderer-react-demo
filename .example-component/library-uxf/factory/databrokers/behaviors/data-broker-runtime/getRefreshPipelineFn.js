import {debounce} from '@devsnc/snowdash';
import {actionTypes} from './constants.js';
import {dispatchInternalAction} from '../../../getInternalEffect.js';
import {getInstanceValue} from '../../../registry/macroponentInstanceRegistry.js';

const {UXF_DB_REFRESH_REQUESTED} = actionTypes;

const REFRESH_PIPELINE_DEBOUNCE_DURATION_IN_MS = 100; // ms

export function refreshPipeline(dispatch, pipeline) {
	console.log('Dispatching refresh pipeline');
	dispatchInternalAction(dispatch, UXF_DB_REFRESH_REQUESTED, pipeline);
}

function getDebouncedRefreshPipelineFn(host, pipelineId) {
	const debouncedFnsByPipelineId = getInstanceValue(
		host,
		'dataBrokerDebouncedPipelineRefreshFns',
		() => new Map()
	);

	if (!debouncedFnsByPipelineId.has(pipelineId)) {
		const debouncedRefreshPipelineFn = debounce(
			refreshPipeline,
			REFRESH_PIPELINE_DEBOUNCE_DURATION_IN_MS,
			{
				leading: true,
				trailing: false,
				maxWait: REFRESH_PIPELINE_DEBOUNCE_DURATION_IN_MS
			}
		);
		debouncedFnsByPipelineId.set(pipelineId, debouncedRefreshPipelineFn);
	}

	return debouncedFnsByPipelineId.get(pipelineId);
}

export function debouncedRefreshPipeline(host, dispatch, pipeline) {
	const {id: pipelineId} = pipeline;
	const debouncedFn = getDebouncedRefreshPipelineFn(host, pipelineId);
	if (debouncedFn) {
		debouncedFn(dispatch, pipeline);
	} else {
		refreshPipeline(dispatch, pipeline);
	}
}
