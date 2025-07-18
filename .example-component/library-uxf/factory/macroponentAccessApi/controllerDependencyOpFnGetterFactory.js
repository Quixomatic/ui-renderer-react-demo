import {isObject} from '@devsnc/snowdash';
import {UXF_INTERNAL_DEPENDENCY_OP_REQUESTED} from '../constants';
import {snakeCase} from '../utils';

function getPayloadFromArguments(args = []) {
	if (args.length === 1 && isObject(args[0])) {
		return args[0];
	}
}

export default function controllerDependencyOpFnGetterFactory(
	dependencyAlias,
	externalControllerDependencies,
	uxfEmitFn,
	fallbackGetter
) {
	const matchingControllerDependency = externalControllerDependencies?.find(
		(dep) => dep.name === dependencyAlias
	);
	const dependencyHandledEvents =
		matchingControllerDependency?.dependencyHandledEvents;
	if (dependencyHandledEvents?.length)
		return (operationApiName) => {
			const operationEventName = snakeCase(operationApiName).toUpperCase();
			if (dependencyHandledEvents.includes(operationEventName)) {
				return (...fnArguments) => {
					uxfEmitFn(null, UXF_INTERNAL_DEPENDENCY_OP_REQUESTED, {
						dependencyAlias,
						dependencyOp: operationEventName,
						wrappedPayload: getPayloadFromArguments(fnArguments)
					});
				};
			}
			return fallbackGetter(operationApiName);
		};
	else return fallbackGetter;
}
