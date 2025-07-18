import {createHttpEffect} from '@servicenow/ui-effect-http';
import {createGraphQLEffect} from '@servicenow/ui-effect-graphql';
import {actionTypes} from './constants';
import {dispatchInternalAction} from '../../../getInternalEffect.js';
import {get} from '@devsnc/snowdash';
import {default as console} from '../../../../utils/getLogger.js';
import {markDBExecEffect} from '../../../../utils/markUtil';

import formatPayloadForDBExec from './formatPayloadForDBExec';
import getDBExecPipelineResults from './getDBExecPipelineResults';
import isGraphQLTransportEnabled from './isGraphQLTransportEnabled';
import {set} from '@devsnc/snowdash';
import externalRESTDBEffect from './external-rest/externalRESTDBEffect';

const {
	DB_ENGINE_EXEC_REQUESTED,
	DB_ENGINE_EXEC_REQUESTED_WITH_RECORDING,
	DB_ENGINE_EXEC_SUCCEEDED,
	DB_ENGINE_EXEC_STARTED,
	DB_ENGINE_EXEC_FAILED,
	DB_ENGINE_EXEC_PROGRESSED,
	UXF_DB_REFRESH_REQUESTED,
	UXF_DB_OP_EXEC_REQUESTED,
	UXF_DB_DATA_RECEIVED,
	DATA_FETCH_INITIATED,
	DATA_FETCH_SUCCEEDED,
	DATA_FETCH_FAILED,
	DATA_OP_INITIATED,
	DATA_OP_SUCCEEDED,
	DATA_OP_FAILED
} = actionTypes;

const isDevMode = !!process.env.DEV_MODE;

const DB_ENGINE_EXEC_REST_URL = '/api/now/uxf/databroker/exec';

const dataResourceQuery = `query ($data: [global_DataResource_ExecutionRequestNode]!) {
  global {
    DataResource {
      DataResourceDataSet(data: $data) {
        sysId
        status
        executionTime
        executionResult
        errors {
          message
          errorType
          locations
          validationErrorType
        }
      }
    }
  }
}
`;

const dbExecGQLEffect = createGraphQLEffect(dataResourceQuery, {
	variableList: ['data'],
	successActionType: DB_ENGINE_EXEC_SUCCEEDED,
	startActionType: DB_ENGINE_EXEC_STARTED,
	errorActionType: DB_ENGINE_EXEC_FAILED
});

const dbExecGQLEffectRecordHeader = createGraphQLEffect(dataResourceQuery, {
	variableList: ['data'],
	successActionType: DB_ENGINE_EXEC_SUCCEEDED,
	startActionType: DB_ENGINE_EXEC_STARTED,
	errorActionType: DB_ENGINE_EXEC_FAILED,
	headerList: {
		'X-NOW-API-PREFETCH-ALLOWED': 'true'
	}
});

const dbExecRESTEffect = createHttpEffect(DB_ENGINE_EXEC_REST_URL, {
	method: 'POST', // because GET can't handle json request bodies,
	batch: isDevMode === false,
	successActionType: DB_ENGINE_EXEC_SUCCEEDED,
	startActionType: DB_ENGINE_EXEC_STARTED,
	errorActionType: DB_ENGINE_EXEC_FAILED,
	progressActionType: DB_ENGINE_EXEC_PROGRESSED
});

const dbExecRESTExternalEffect = externalRESTDBEffect({
	successActionType: DB_ENGINE_EXEC_SUCCEEDED,
	startActionType: DB_ENGINE_EXEC_STARTED,
	errorActionType: DB_ENGINE_EXEC_FAILED,
	progressActionType: DB_ENGINE_EXEC_PROGRESSED
});

const dbExecRESTEffectRecordHeader = createHttpEffect(DB_ENGINE_EXEC_REST_URL, {
	method: 'POST', // because GET can't handle json request bodies,
	batch: isDevMode === false,
	successActionType: DB_ENGINE_EXEC_SUCCEEDED,
	startActionType: DB_ENGINE_EXEC_STARTED,
	errorActionType: DB_ENGINE_EXEC_FAILED,
	progressActionType: DB_ENGINE_EXEC_PROGRESSED,
	headers: {
		'X-NOW-API-PREFETCH-ALLOWED': 'true'
	}
});

const createDbExecSuccessEffect = (pipelineDefinitions) => ({
	effect: (coeffects) => {
		const {
			action: {
				meta: {pipelineId, origin}
			},
			dispatch
		} = coeffects;

		const payload = get(coeffects, 'action.payload');
		const pipelineResults = getDBExecPipelineResults(payload);
		markDBExecEffect(DB_ENGINE_EXEC_SUCCEEDED, coeffects);

		dispatchInternalAction(
			dispatch,
			UXF_DB_DATA_RECEIVED,
			{
				id: pipelineId,
				output: pipelineResults,
				origin: origin
			},
			{pipelineDefinition: get(pipelineDefinitions, pipelineId)}
		);
	},
	stopPropagation: true
});

const dbExecFailureEffect = (pipelineDefinitions) => ({
	effect: (coeffects) => {
		const {
			action: {
				payload,
				meta: {pipelineId, origin}
			},
			dispatch
		} = coeffects;
		const {pipelineResults = []} = payload;
		const pipelineDefinition = get(pipelineDefinitions, pipelineId);

		markDBExecEffect(DB_ENGINE_EXEC_FAILED, coeffects);

		console.error(
			`DB exec engine call failed for pipelineId: ${pipelineId}`,
			payload
		);
		signalDBExecCompleteLifecycle(
			dispatch,
			origin,
			pipelineResults,
			false,
			pipelineDefinition
		);
	},
	stopPropagation: true
});

const signalDBExecInitiatedLifecycle = (dispatch, origin) => {
	const type = get(origin, 'requestType');
	const requestId = get(origin, 'requestId');
	if (!requestId) return;
	switch (type) {
		case UXF_DB_OP_EXEC_REQUESTED:
			dispatch(DATA_OP_INITIATED, makeOpIdPayload(requestId));
			break;
		case UXF_DB_REFRESH_REQUESTED:
			makeFetchIdPayloads(requestId).forEach((fetchPayload) => {
				dispatch(DATA_FETCH_INITIATED, fetchPayload);
			});
			break;
	}
};

const makeFetchIdPayloads = (requestId) => {
	return requestId.split('->').map((dataElemId) => ({dataElemId}));
};

const makeOpIdPayload = (requestId) => {
	const operationKey = requestId.split('#');
	return {
		dataElemId: operationKey[0],
		operation: operationKey[1]
	};
};

const filterIdsByResult = (dbElements, pipelineResults, pipelineDefinition) => {
	return dbElements.filter((db) => {
		const definitionId = pipelineDefinition?.filter(
			(definition) => definition.id == db.dataElemId
		)?.[0]?.definitionSysId;
		if (!definitionId) return false;
		return (
			pipelineResults.filter((result) => result.sysId === definitionId).length >
			0
		);
	});
};

export const signalDBExecCompleteLifecycle = (
	dispatch,
	origin,
	pipelineResults,
	success,
	pipelineDefinition
) => {
	const type = get(origin, 'requestType');
	const requestId = get(origin, 'requestId');
	if (!requestId) return;
	switch (type) {
		case UXF_DB_OP_EXEC_REQUESTED:
			if (success && isSuccessfulOpResult(pipelineResults)) {
				dispatch(DATA_OP_SUCCEEDED, {
					...makeOpIdPayload(requestId),
					data: makeSuccessfulOpResultPayload(pipelineResults)
				});
			} else {
				dispatch(DATA_OP_FAILED, {
					...makeOpIdPayload(requestId),
					errors: makeFailedOpResultPayload(pipelineResults)
				});
			}
			break;
		case UXF_DB_REFRESH_REQUESTED: {
			const ids = filterIdsByResult(
				makeFetchIdPayloads(requestId),
				pipelineResults,
				pipelineDefinition
			);
			ids.forEach((fetchIdPayload, resultIndex) => {
				if (
					success &&
					isSuccessfulFetchResultItem(pipelineResults[resultIndex])
				) {
					dispatch(DATA_FETCH_SUCCEEDED, fetchIdPayload);
				} else {
					dispatch(DATA_FETCH_FAILED, {
						...fetchIdPayload,
						errors: makeFailedFetchErrorPayload(pipelineResults[resultIndex])
					});
				}
			});
			break;
		}
	}
};

const isSuccessfulOpResult = (pipelineResults) => {
	const status = get(pipelineResults, '[0].status', 500);
	return status < 400 && status > 199;
};
const makeSuccessfulOpResultPayload = (pipelineResults) => {
	return get(pipelineResults, '[0].executionResult', {});
};
const makeFailedOpResultPayload = (pipelineResults) => {
	return get(pipelineResults, '[0].errors', []);
};

const isSuccessfulFetchResultItem = (resultItem) => {
	const status = get(resultItem, 'status', 500);
	return status < 400 && status > 199;
};
const makeFailedFetchErrorPayload = (resultItem) =>
	get(resultItem, 'errors', []);

const dbExecInterceptor = (context) => {
	const {coeffects, effects} = context;
	const origin = get(coeffects, 'action.meta.origin');
	const payload = get(coeffects, 'action.payload');
	set(context, 'coeffects.action.payload', formatPayloadForDBExec(payload));
	return !origin
		? context
		: {
				...context,
				effects: [
					...effects,
					{
						effect: signalDBExecInitiatedLifecycle,
						args: [coeffects.dispatch, get(coeffects, 'action.meta.origin')]
					}
				]
		  };
};

const getEffectWithArgs = (effectConfig, coeffects) => {
	return {
		effect: get(effectConfig, ['effect']),
		args: [...get(effectConfig, ['args']), coeffects]
	};
};

const buildEffect = (
	context,
	restExternalEffectConfig,
	gqlEffectConfig,
	restEffectConfig
) => {
	const {coeffects, effects} = context;
	const meta = get(coeffects, 'action.meta');

	let chosenEffectConfig;
	if (meta.pipelineType === 'REST_EXTERNAL') {
		chosenEffectConfig = restExternalEffectConfig;
	} else {
		chosenEffectConfig = isGraphQLTransportEnabled()
			? gqlEffectConfig
			: restEffectConfig;
	}

	return {
		...context,
		effects: [...effects, getEffectWithArgs(chosenEffectConfig, coeffects)]
	};
};

const buildDBExecEffectInterceptor = (context) =>
	buildEffect(
		context,
		dbExecRESTExternalEffect,
		dbExecGQLEffect,
		dbExecRESTEffect
	);

const buildDBExecEffectWithRecordingInterceptor = (context) =>
	buildEffect(
		context,
		dbExecRESTExternalEffect,
		dbExecGQLEffectRecordHeader,
		dbExecRESTEffectRecordHeader
	);

export default (pipelineDefinitions) => ({
	[DB_ENGINE_EXEC_REQUESTED]: {
		interceptors: [
			{
				before: dbExecInterceptor
			},
			{
				before: buildDBExecEffectInterceptor
			}
		],
		stopPropagation: true
	},
	[DB_ENGINE_EXEC_REQUESTED_WITH_RECORDING]: {
		interceptors: [
			{
				before: dbExecInterceptor
			},
			{
				before: buildDBExecEffectWithRecordingInterceptor
			}
		],
		stopPropagation: true
	},
	[DB_ENGINE_EXEC_SUCCEEDED]: createDbExecSuccessEffect(pipelineDefinitions),
	[DB_ENGINE_EXEC_FAILED]: dbExecFailureEffect(pipelineDefinitions)
});

export const handleDBLifecyleForPrefetch = (
	dispatch,
	origin,
	pipelineId,
	pipelineResults,
	pipelineDefinition
) => {
	signalDBExecInitiatedLifecycle(dispatch, origin);

	if (pipelineResults && pipelineResults.length > 0) {
		dispatchInternalAction(
			dispatch,
			UXF_DB_DATA_RECEIVED,
			{
				id: pipelineId,
				output: pipelineResults,
				origin
			},
			{pipelineDefinition}
		);
	} else {
		signalDBExecCompleteLifecycle(dispatch, origin, [], false);
	}
};
