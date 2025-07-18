import resolveForView from '../../../../UxValueResolver/resolveForView';

/**
 * Replaces placeholders with corresponding resolved input values.
 *
 * @param {string} attribute - Attribute string with placeholders.
 * @param {object} parameters - Parameters mapped to placeholders.
 * @param {object} resolvedInputValues - Values to replace placeholders.
 * @returns {string} - Attribute string with placeholders replaced by input values.
 */
export const buildAttributes = (attribute, parameters, resolvedInputValues) => {
	const regex = /\{\{\w+\}\}/g;
	return attribute.replace(regex, (match) => {
		const parameterName = match.substring(2, match.length - 2);
		return resolvedInputValues[parameterName];
	});
};

/**
 * Resolves attributes' UX values.
 *
 * @param {object} attributes - Attributes with UX values.
 * @param {object} resolversForInputValue - Resolvers for input values.
 * @param {object} properties - Macroponent's properties.
 * @param {object} state - Macroponent's state.
 * @returns {object} - Attributes with resolved UX values.
 */
export const resolveAttributesUxValue = (
	attributes,
	resolversForInputValue,
	properties,
	state
) => {
	return Object.entries(attributes).reduce(
		(acc, [attributeKey, attributeUxValue]) => {
			acc[attributeKey] = resolveForView(
				resolversForInputValue,
				properties,
				state,
				attributeUxValue
			);
			return acc;
		},
		{}
	);
};
