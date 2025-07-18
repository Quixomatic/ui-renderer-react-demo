import {getPlaceholderPropName} from '../../UxValueResolver/getResolvedBindingWithState';

function getDataOutputPropName(bindingAddress) {
	const [dataElementId, propName] = bindingAddress;
	const dataPropName = getPlaceholderPropName(dataElementId, propName);
	return dataPropName;
}

export default function getViewportElementsAffectedByDataOutputProp(subroutes) {
	const dependencies = subroutes.reduce((acc, subroute) => {
		const {
			parentCompositionElementId,
			extensionPoint,
			fields = [],
			macroponents: screens
		} = subroute;
		if (parentCompositionElementId && extensionPoint && fields.length === 0) {
			for (const screen of screens) {
				const {watchedProperties, parsedConditions} = screen;

				for (const watchedPropertyUxValue of Object.values(watchedProperties)) {
					const {
						binding: {address = []}
					} = watchedPropertyUxValue;

					if (address.length > 0) {
						const dataPropName = getDataOutputPropName(address);
						acc[dataPropName] = [
							...(acc[dataPropName] ?? []),
							parentCompositionElementId
						];
					}
				}

				for (const parsedCondition of parsedConditions) {
					for (const expression of parsedCondition) {
						const {leftHandValue} = expression;

						if (typeof leftHandValue === 'object') {
							const {
								binding: {address = []}
							} = leftHandValue;

							const dataPropName = getDataOutputPropName(address);
							acc[dataPropName] = [
								...(acc[dataPropName] ?? []),
								parentCompositionElementId
							];
						}
					}
				}
			}
		}
		return acc;
	}, {});

	return Object.keys(dependencies).reduce((acc, propName) => {
		acc[propName] = Array.from(new Set(dependencies[propName]));
		return acc;
	}, {});
}
