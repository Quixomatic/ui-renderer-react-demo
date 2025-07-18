import getControllerDataOutputBindingFactory from '../controllerDependency/getControllerDataOutputBindingFactory.js';
import {parseCondition} from './evaluateScreenCondition.js';

export default function getSubroutesWithParsedClientConditions(
	subroutes = [],
	uxControllerNodes,
	controllerAliasMap
) {
	const getControllerDataOutputBindingFn = getControllerDataOutputBindingFactory(
		uxControllerNodes,
		controllerAliasMap
	);
	return subroutes.map((subroute) => {
		const {controllerDependencyMap, controllerElementId} = subroute;

		// this should be renamed to "screens" instead of "macroponents"
		subroute.macroponents = subroute.macroponents.map((screen) => {
			const {condition, additionalConditions, watchedProperties = {}} = screen;
			const conditions = [condition, ...(additionalConditions || [])].filter(
				Boolean
			); // removes falsy elements e.g. null, "", NaN, undefined etc.

			screen.parsedConditions = conditions.map((condition) =>
				parseCondition(
					condition,
					controllerElementId,
					controllerDependencyMap,
					getControllerDataOutputBindingFn
				)
			);

			screen.watchedProperties = Object.entries(watchedProperties).reduce(
				(acc, [key, value]) => {
					const transformedUxValue = getControllerDataOutputBindingFn(
						controllerElementId,
						value,
						controllerDependencyMap
					);

					if (transformedUxValue) acc[key] = transformedUxValue;
					return acc;
				},
				{}
			);

			return screen;
		});
		return subroute;
	});
}
