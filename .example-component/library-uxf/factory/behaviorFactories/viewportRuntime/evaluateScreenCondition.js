import {isEmpty} from '@devsnc/snowdash';
import {get} from '@devsnc/snowdash';
import {getConditionProperties} from './utils';

/*
	This code has been "borrowed" from sn-canvas-core - this should be the home for screen
	condition evaluation in the future, but until sn-canvas-core is refactored to use the viewport
	runtime, this code will live in both places.
*/
const EVALUATORS = {
	//logical
	AND: {
		op: 'AND',
		symbol: '^',
		evaluator: (a, b) => a && b
	},
	OR: {
		op: 'OR',
		symbol: '^OR',
		evaluator: (a, b) => a || b
	},
	//comparision
	EQUALS: {
		op: 'EQUALS',
		symbol: '=',
		evaluator: (a, b) => a === b
	},
	NOTEQUALS: {
		op: 'NOTEQUALS',
		symbol: '!=',
		evaluator: (a, b) => a !== b
	},
	STARTSWITH: {
		op: 'STARTSWITH',
		symbol: 'STARTSWITH',
		evaluator: (a, b) => a.startsWith(b)
	}
};

const ALLOWED_TYPES = ['number', 'boolean', 'string'];

export const parseCondition = (
	conditionStr,
	dataElementId,
	controllerDependencyMap,
	getControllerDataOutputBindingFn
) => {
	if (!conditionStr) {
		return [];
	}

	let i = 0;
	let r = '';

	const conditionArr = [];

	function addCondition(conditionObj) {
		const {leftHandValue = ''} = conditionObj;
		if (
			(leftHandValue.startsWith('controller.') ||
				leftHandValue.startsWith('data.')) &&
			(dataElementId || controllerDependencyMap)
		) {
			const address = leftHandValue.split('.').slice(1);
			const transformedUxValue = getControllerDataOutputBindingFn(
				dataElementId,
				{
					type: 'DATA_OUTPUT_BINDING',
					binding: {address}
				},
				controllerDependencyMap
			);
			if (transformedUxValue) conditionObj.leftHandValue = transformedUxValue;
			conditionArr.push(conditionObj);
		} else {
			conditionArr.push(conditionObj);
		}
	}

	let conditionObj = {};
	while (i < conditionStr.length) {
		const c = conditionStr[i];
		if (c == '^' || i == conditionStr.length - 1) {
			conditionObj['rightHandValue'] = i == conditionStr.length - 1 ? r + c : r;
			const logicalOperator =
				i + 3 < conditionStr.length && conditionStr.substring(i, i + 3) == '^OR'
					? 'OR'
					: 'AND';

			conditionObj['logicalOperation'] =
				i == conditionStr.length - 1 ? '' : logicalOperator;

			if (logicalOperator == 'OR') {
				i = i + 2;
			}
			addCondition({...conditionObj});
			conditionObj = {};
			r = '';
		} else if (c == '=') {
			conditionObj['leftHandValue'] = r;
			conditionObj['operation'] = 'EQUALS';
			r = '';
		} else if (
			c == '!' &&
			i + 1 < conditionStr.length &&
			conditionStr[i + 1] == '='
		) {
			conditionObj['leftHandValue'] = r;
			conditionObj['operation'] = 'NOTEQUALS';
			i++;
			r = '';
		} else if (
			c == 'S' &&
			conditionStr.substring(
				i,
				i + Math.min('STARTSWITH'.length, conditionStr.length - i)
			) == 'STARTSWITH'
		) {
			conditionObj['leftHandValue'] = r;
			conditionObj['operation'] = 'STARTSWITH';
			i += 'STARTSWITH'.length - 1;
			r = '';
		} else {
			r = r + c;
		}

		i++;
	}

	return conditionArr;
};

const sanitizeInputValues = (
	inputObj,
	allowDeepObjects = false,
	allowedKeysForSanitization
) => {
	if (!inputObj || typeof inputObj !== 'object') {
		return {};
	}

	const sanitizedValues = {};
	allowedKeysForSanitization.forEach((key) => {
		const value = inputObj[key];
		if (ALLOWED_TYPES.includes(typeof value)) {
			sanitizedValues[key] = value.toString();
		} else if (
			allowDeepObjects &&
			!isEmpty(value) &&
			typeof value === 'object'
		) {
			sanitizedValues[key] = sanitizeInputValues(
				value,
				true,
				allowedKeysForSanitization
			);
		}
	});

	return sanitizedValues;
};

function getTermEvaluationResult(term, valueResolverFn) {
	const {leftHandValue, operation, rightHandValue} = term;

	const value = valueResolverFn(leftHandValue);

	//When evaluating condiditions for viewport routes, dynamic routing conditions are not in place
	//So assume the condition will result to true rather than potentially denying access
	if (value === IGNORE_VALUE_AND_EVALUTE_TO_TRUE) return true;

	return EVALUATORS[operation].evaluator(value, rightHandValue);
}

function evaluateConditions(inputCondition, valueResolverFn) {
	// If our condition is an array of condition strings, all the condition strings must individually pass
	// Basically, we wrap each condition string in an implicit AND operation.
	if (Array.isArray(inputCondition)) {
		for (let condition of inputCondition) {
			if (!evaluateCondition(condition, valueResolverFn)) {
				return false;
			}
		}

		return true;
	} else {
		return evaluateCondition(inputCondition, valueResolverFn);
	}
}

const evaluateCondition = (parsedCondition, valueResolverFn) => {
	if (isEmpty(parsedCondition)) {
		return false;
	}

	let result = false;
	let logicalOperation;

	for (let i = 0; i < parsedCondition.length; i++) {
		const term = parsedCondition[i];

		const _result = getTermEvaluationResult(term, valueResolverFn);

		if (logicalOperation == null) {
			result = _result;
		} else {
			result = EVALUATORS[logicalOperation].evaluator(result, _result);
		}

		logicalOperation = term['logicalOperation'];

		if (logicalOperation == '') {
			return result;
		}
	}

	return result;
};

const IGNORE_VALUE_AND_EVALUTE_TO_TRUE = Symbol(
	'IGNORE_VALUE_AND_EVALUATE_TO_TRUE'
);

const PARENT_PREFIX = 'parent.';

const PAYLOAD_PREFIX = 'payload.';

function getValueResolverFunction(
	macroponentProperties,
	subroute,
	seismicProperties,
	_fieldValues,
	getResolvedDataBindingFn
) {
	const {extensionPoint, fields = [], optionalParameters = []} = subroute;

	const candidateKeysForEvaluation = [...fields, ...optionalParameters];

	// fixme: "sanitize" lazily
	const fieldValues =
		_fieldValues !== null
			? sanitizeInputValues(_fieldValues, false, candidateKeysForEvaluation)
			: null;

	if (extensionPoint) {
		/*
			Shape of the object that extension point screen conditions are written against:
			(the shape must always remain backwards compatible since this is a public API)
					
			{
				controller: {
					...controllerOutputPropObject,
					...dependencyControllersObjects
				},
				payload // filled with incoming field values (excludes optional parameters)
			}

			An extension point's controller can have other dependency controllers that it exposes data from.
			For every dependency, the object is contructed like this
			dependencyControllersObject = {
				[nameOfTheDependency]: {
					...dependencyControllerOutputPropObject
				}
			};

			This implementation doesn't actually construct this object. Instead, we lazily lookup the values.
		 */
		return (leftHandValue) => {
			if (typeof leftHandValue === 'object') {
				const value = getResolvedDataBindingFn(
					leftHandValue,
					seismicProperties
				);
				if (ALLOWED_TYPES.includes(typeof value)) {
					return value.toString();
				}
			} else if (fieldValues === null) {
				return IGNORE_VALUE_AND_EVALUTE_TO_TRUE;
			} else if (leftHandValue.startsWith(PAYLOAD_PREFIX)) {
				const fieldName = leftHandValue.substring(PAYLOAD_PREFIX.length);
				return fieldValues[fieldName];
			}
			return '';
		};
	} else {
		/**
		 * parent.* bindings on screen conditions within legacy viewport content are resolved
		 * by looking at the parent macroponent's context properties
		 */
		const hostPropertyValues = getConditionProperties(
			macroponentProperties,
			seismicProperties
		);

		// fixme: "sanitize" lazily
		const parentProperties = sanitizeInputValues(hostPropertyValues, true, [
			candidateKeysForEvaluation,
			...Object.keys(hostPropertyValues)
		]);

		return (leftHandValue) => {
			if (typeof leftHandValue !== 'string') return;

			if (leftHandValue.startsWith(PARENT_PREFIX)) {
				return get(
					parentProperties,
					leftHandValue.substr(PARENT_PREFIX.length),
					''
				);
			} else if (fieldValues === null) {
				return IGNORE_VALUE_AND_EVALUTE_TO_TRUE;
			} else {
				return fieldValues[leftHandValue];
			}
		};
	}
}

export function getScreenQualifierFunction(
	macroponentPropertyDefs,
	subroute,
	seismicProperties,
	_fieldValues,
	getResolvedDataBindingFn
) {
	const valueResolverFn = getValueResolverFunction(
		macroponentPropertyDefs,
		subroute,
		seismicProperties,
		_fieldValues,
		getResolvedDataBindingFn
	);
	return (screen) => {
		const {parsedConditions} = screen;

		return evaluateConditions(parsedConditions, valueResolverFn);
	};
}
