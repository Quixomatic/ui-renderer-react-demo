import {isEmpty} from 'lodash';

const opers = {
	ANYTHING: () => true,
	BETWEEN: evalBetween,
	ISEMPTY: evalIsEmpty,
	EMPTYSTRING: evalEmptyString,
	ENDSWITH: evalEndsWith,
	'=': evalEquals,
	'>': evalGreaterThan,
	'>=': evalGreaterThanOrEquals,
	IN: evalIn,
	LIKE: evalLike,
	'<': evalLessThan,
	'<=': evalLessThanOrEquals,
	ISNOTEMPTY: evalIsNotEmpty,
	'!=': evalNotEquals,
	'NOT LIKE': evalNotLike,
	SAMEAS: evalSameAs,
	NSAMEAS: evalNotSameAs,
	STARTSWITH: evalStartsWith,
	GT_FIELD: evalGreaterThanField,
	LT_FIELD: evalLessThanField,
	GT_OR_EQUALS_FIELD: evalGreaterThanOrEqualsField,
	LT_OR_EQUALS_FIELD: evalLessThanOrEqualsField
};

/**
 * Given an `action` and a `model`, the `evaluateConditions`
 * function will return `true` if the conditions on the action
 * evaluate to `true`, and `false` otherwise. Currently only
 * the operators for the `boolean`, `string`, and `integer` types
 * are supported.
 *
 * Queries have the structure:
 *
 * [ (A OR B) AND (B OR C) ]
 *
 * OR (newQuery)
 *
 * [ (D OR E) AND (F OR G) ]
 *
 * The terms are evaluated as follows:
 * * The terms are grouped according to the `newQuery` flag.
 * * The terms within each of these groups are grouped according to the `or` flag.
 * * The `some` - `every` - `some` logic evaluates the OR (newQuery) - AND - OR boolean structure of the query
 *
 * @param {object} action
 * @param {object} model
 *
 * */
export const evaluateConditions = (modelConditions, model) => {
	if (!modelConditions || modelConditions.length == 0) return true;

	return modelConditions
		.reduce(groupByNewQuery, [])
		.map(term => term.reduce(groupByAnd, []))
		.some(terms =>
			terms.every(terms =>
				terms.some(({field, operator, value}) => {
					if (field == null && value == null) return true;
					return opers[operator](field, value, model);
				})
			)
		);
};

export const evalScriptedClientConditions = (scriptedClientCond, model = {}) => {
	if (isEmpty(scriptedClientCond) || isEmpty(model)) return true;

	let scopeVariableNames = Object.keys(model) || [];
	let scopeVariableValues = scopeVariableNames.map(key => model[key]);
	let result = true;

	try {
		const scopingFunction = new Function(scopeVariableNames, `return (${scriptedClientCond});`);
		result = scopingFunction.apply(scopingFunction, scopeVariableValues);
	} catch (e) {
		console.error('Declarative Action scripted client condition expression evaluation failed');
		console.error(e);
	}
	return result;
};

/**
 * The `groupBy*` functions operate over a list of query terms
 * and transform it into a list of arrays, with each array being
 * a group of terms separated by the operator specified.
 *
 * @param {array} conditions
 * @param {object} model
 *
 * @example
 *
 * const conditions =
 * [
 *  { newQuery: false, or: false },
 *  { newQuery: false, or: true  },
 *  { newQuery: true,  or: false ),
 *  { newQuery: false, or: false }
 * ];
 *
 * console.log(conditions.reduce(groupByNewQuery, []));
 * output:
 * [
 *  [
 *    { newQuery: false, or: false },
 *    { newQuery: false, or: true  }
 *  ],
 *  [
 *    { newQuery: true,  or: false },
 *    { newQuery: false, or: false }
 *  ]
 * ]
 * */
function groupByNewQuery(conditions, term, i) {
	const {newQuery} = term;
	if (newQuery || i == 0) conditions.push([term]);
	else conditions[conditions.length - 1].push(term);
	return conditions;
}

function groupByAnd(conditions, term, i) {
	const {or} = term;
	if (!or || i == 0) conditions.push([term]);
	else conditions[conditions.length - 1].push(term);
	return conditions;
}

/* General operators */
function evalEquals(field, value, model) {
	return String(model[field]) == String(value);
}

function evalNotEquals(field, value, model) {
	return !evalEquals(field, value, model);
}

function evalSameAs(field, value, model) {
	return model[field] == model[value];
}

function evalNotSameAs(field, value, model) {
	return !evalSameAs(field, value, model);
}

function evalIsEmpty(field, value, model) {
	return evalEmptyString(field, value, model);
}

function evalIsNotEmpty(field, value, model) {
	return !evalIsEmpty(field, value, model);
}

/* String operators */
function evalStartsWith(field, value, model) {
	return String(model[field]).startsWith(String(value));
}

function evalEndsWith(field, value, model) {
	return String(model[field]).endsWith(String(value));
}

function evalLike(field, value, model) {
	return String(model[field]).includes(String(value));
}

function evalNotLike(field, value, model) {
	return !evalLike(field, value, model);
}

function evalEmptyString(field, value, model) {
	return model[field] === '' || model[field] === null;
}

function evalIn(field, value, model) {
	return String(value)
		.split(',')
		.some(val => evalEquals(field, val, model));
}

/* Integer/String operators */
function evalGreaterThan(field, value, model) {
	return model[field] > value;
}

function evalGreaterThanOrEquals(field, value, model) {
	return model[field] >= value;
}

function evalLessThan(field, value, model) {
	return model[field] < value;
}

function evalLessThanOrEquals(field, value, model) {
	return model[field] <= value;
}

function evalBetween(field, value, model) {
	const vals = value.split('@');
	return (
		evalGreaterThanOrEquals(field, vals[0], model) &&
		evalLessThanOrEquals(field, vals[1], model)
	);
}

/* Integer operators */
function evalGreaterThanField(field, value, model) {
	return model[field] > model[value];
}

function evalLessThanField(field, value, model) {
	return model[field] < model[value];
}

function evalGreaterThanOrEqualsField(field, value, model) {
	return model[field] >= model[value];
}

function evalLessThanOrEqualsField(field, value, model) {
	return model[field] <= model[value];
}
