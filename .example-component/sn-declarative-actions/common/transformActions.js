import {
	curry,
	forEach,
	get,
	isArray,
	isEmpty,
	isFunction,
	isObject,
	isString,
	map,
	mapValues,
	replace,
	set
} from 'lodash';
import {evalScriptedClientConditions, evaluateConditions} from './conditionEvaluator';
import track from '../utils/uiMetricsUtils';

/**
 * For the interpolation regex, we have logic to check for \u200B
 * The platform sanitizes {{}} with a \u200B character to prevent angular code from
 * executing on platform form. Ideally this unicode should only be applied
 * for presentational purposes and the value should remain unchanged in the db
 * but that is not the case.
 */

const interpolationRegex = /{\u200B?{([\s\S]+?)}}/g;
const arrayIndexRegex = /@(\d)@?/g;
const ZERO_COUNT_REGEX = /\(0\)/;

const evaluate = model => {
	const modelEvaluator = curry(substitute)(model);

	return string => {
		if (!isString(string) || !isObject(model)) return string;
		
		// check if string matches interpolation pattern
		const parsedString = interpolationRegex.exec(string);
		const matchedString = parsedString ? parsedString[0] : null;
		const modelField = parsedString ? parsedString[1] : null;

		// reset state of regex for next string
		interpolationRegex.lastIndex = 0;

		// if whole string is matched to the regex, return actual value
		// e.g "{{displayValueList}}" => [ "Abel Tuter", "Beth Anglin" ]
		if (parsedString && matchedString.length === string.length) {
			return modelEvaluator(string, modelField, false);
		}

		// else, return string interpolated value
		// e.g "Edit ({{count}})" => "Edit (2)"
		return replace(string, interpolationRegex, modelEvaluator);
	};
};

function substitute(model, str, field, isInterpolation = true) {
	const key = field.trim();
	const replacement = get(model, key);

	if (isInterpolation && isObject(replacement) && !isArray(replacement)) return key;
	if (replacement !== undefined) return replacement;

	const keys = key.split('.');
	//if the key is not in model, return original string, otherwise return empty string.
	return keys[0] in model ? '' : str;
}

const recursiveEvaluation = (value, evaluator) => {
	if (!isFunction(evaluator)) return null;
	if (Array.isArray(value)) return map(value, item => recursiveEvaluation(item, evaluator));
	if (isObject(value))
		return mapValues(value, objectValue => recursiveEvaluation(objectValue, evaluator));

	return evaluator(value);
};

/**
 * For payload mapping we construct a path for nested objects using
 * the `@` character to separate fields
 *
 * Ex: `{ a: { b: { c: 1 }} }` => The path to `c` is `a@b@c`
 * Ex: `{a: [ { b: { c: 1 } }  ] }` => The path to `c` is `a@0@b@c`
 *
 * These paths must be corrected
 * `a@b@c` => `a.b.c`
 * `a@0@b@c` => `a[0].b.c`
 */
const resolvePayloadPath = path => {
	if (!path) return '';

	const arrayIndexReplaced = replace(path, arrayIndexRegex, (_, index) => {
		return `[${index}]`;
	});

	return arrayIndexReplaced.replace(/@/g, '.');
};

const evaluateAction = (action, evaluator) => {
	if (!isObject(action) || !isFunction(evaluator)) return null;

	// These are the only fields that support evaluation
	const {
		label,
		tooltip,
		actionAttributes,
		actionPayload,
		modelConditions,
		payloadMap,
		scriptedClientCondition,
		ariaLabel = ''
	} = action;

	const evaluatedVariables = map(payloadMap, variable =>
		recursiveEvaluation(variable, evaluator)
	);

	const constructPayload = (payloadTemplate, fields) => {
		const payload = {
			...payloadTemplate
		};

		forEach(fields, ({name, value}) => {
			const path = resolvePayloadPath(name);
			set(payload, path, value);
		});

		return payload;
	};

	const mergedPayload = constructPayload(actionPayload, evaluatedVariables);

	return {
		...action,
		label: evaluator(label),
		tooltip: evaluator(tooltip),
		ariaLabel: evaluator(ariaLabel),
		actionAttributes: recursiveEvaluation(actionAttributes, evaluator),
		actionPayload: recursiveEvaluation(mergedPayload, evaluator),
		modelConditions: map(modelConditions, condition =>
			recursiveEvaluation(condition, evaluator)
		),
		scriptedClientCondition: evaluator(scriptedClientCondition)
	};
};

/**
 * Possible performance improvement here is to store the parsed
 * JSON string to stop future calls to JSON.parse()
 */
const jsonParse = jsonString => {
	if (isObject(jsonString)) return jsonString;
	if (!isString(jsonString)) return {};

	try {
		return JSON.parse(jsonString || '{}');
	} catch (e) {
		return {
			e: `Error parsing: ${jsonString}`
		};
	}
};

const parseStringProperties = action => {
	const unparsedPayload = get(action, 'actionPayload', {});
	const unparsedAttributes = get(action, 'actionAttributes', {});

	const parsedPayload = jsonParse(unparsedPayload);
	const parsedAttributes = jsonParse(unparsedAttributes);

	return {
		...action,
		actionPayload: parsedPayload,
		actionAttributes: parsedAttributes
	};
};

const formatZeroCountString = str => {
	const hasMatch = ZERO_COUNT_REGEX.test(str);
	if (hasMatch) {
		return str.replace(ZERO_COUNT_REGEX, '').trim();
	} else {
		return str;
	}
};

const transformActions = (actions, model, metricsData) => {
	const evaluator = evaluate(model);
	return actions
		.reduce((accumulator, action) => {
			const {label, tooltip, recordSelectionRequired} = action;
			const newAction = {
				...action,
				tooltip: tooltip || label
			};

			const parsedAction = parseStringProperties(newAction);
			let evaluatedAction = evaluateAction(parsedAction, evaluator);

			if (recordSelectionRequired && model.count === 0) {
				// Handle case of Edit (0) to Edit
				evaluatedAction.label = formatZeroCountString(evaluatedAction.label);
				evaluatedAction.tooltip = formatZeroCountString(evaluatedAction.tooltip);
				evaluatedAction.ariaLabel = formatZeroCountString(evaluatedAction.ariaLabel);
			}

			if (metricsData) {
				const {coeffects = {}, eventName = 'transformActions', meta = {}} = metricsData;
				meta.evaluatedAction = evaluatedAction;
				meta.parsedAction = parsedAction;
				track(coeffects, eventName, meta);
			}
			const passed =
				evaluateConditions(evaluatedAction.modelConditions, model) &&
				evalScriptedClientConditions(evaluatedAction.scriptedClientCondition, model);

			if (passed) accumulator.push(evaluatedAction);

			return accumulator;
		}, [])
		.sort((action1, action2) => action1.order - action2.order);
};

const evaluateAndKeep = (actions, model) => {
	const evaluator = evaluate(model);
	return actions
		.reduce((accumulator, action) => {
			action.tooltip = action.tooltip || action.label;

			const parsedAction = parseStringProperties(action);
			const evaluatedAction = evaluateAction(parsedAction, evaluator);

			accumulator.push(evaluatedAction);

			return accumulator;
		}, [])
		.sort((action1, action2) => action1.order - action2.order);
};

/**
 * Given a list of `actions`, `transformer` will return
 * a filtered list of `actions` with `{{}}` syntax evaluated
 * and client conditions applied
 *
 * @param {array} actions
 * @param {object} model
 *
 * @example
 *
 * const model = { value: 'World' };
 * const actions = [
 * {
 * 	name: 'action1',
 * 	label: 'Hello {{ value }}!'
 * },
 * {
 * 	name: 'action2',
 * 	label: 'Foo {{ value }}',
 * 	conditions: {
 * 		value: 'bar'
 * 	}
 * }
 * ];
 *
 * const evaluateActions = transformer(action2, model);
 * console.log(evaluatedActions); // => [{ name: 'action1 , label: 'Hello World'}]
 */
export const transformer = (actions, model, metricsData) => {
	if (isEmpty(actions)) return actions;

	return transformActions(actions, model, metricsData);
};

export const evaluateOnly = (actions, model) => {
	if (isEmpty(actions)) return actions;

	return evaluateAndKeep(actions, model);
};
