import * as snLodash from '@devsnc/snowdash';
import {filter} from '@devsnc/snowdash';
import {mapValues} from '@devsnc/snowdash';
import {mapKeys} from '@devsnc/snowdash';

import {actionTypes as dbActionTypes} from '../../databrokers/behaviors/data-broker-runtime/constants';
import {isObject} from '@devsnc/snowdash';

const {UXF_DB_OP_TRIGGER_REQUESTED} = dbActionTypes;

const isValidString = (p) => p && snLodash.isString(p);

function getPayloadFromArguments(args = []) {
	if (args.length === 1 && isObject(args[0])) {
		return args[0];
	}
}

// keeping eventProperties around so that, in future, we can validate the payload being sent
function getFunctionFactoryForOperation({
	name: operationName,
	// eslint-disable-next-line no-unused-vars
	eventProperties = []
}) {
	return (uxfEmitFn, dataElementId, meta) => {
		return (...fnArguments) => {
			uxfEmitFn(meta, UXF_DB_OP_TRIGGER_REQUESTED, {
				operation: {
					operationName,
					dataElementId
				},
				operationPayload: getPayloadFromArguments(fnArguments)
			});
		};
	};
}

const OP_KEY_API_FN_NAME = 'apiFunctionName';

export default function(dataBrokerDefinition) {
	const {operations} = dataBrokerDefinition;
	return mapValues(
		mapKeys(
			filter(
				operations,
				({exposedToScriptingApi, [OP_KEY_API_FN_NAME]: apiFunctionName}) =>
					exposedToScriptingApi && isValidString(apiFunctionName)
			),
			OP_KEY_API_FN_NAME
		),
		getFunctionFactoryForOperation
	);
}
