import getResolvedBindingWithState from '../UxValueResolver/getResolvedBindingWithState.js';
import {propertyTypes} from '../constants.js';

const {ELEMENT_BINDING} = propertyTypes;

function getElementSelectablePropsWrapper(stateProperties, elementId) {
	return new Proxy(
		{},
		{
			get(_, propName) {
				// fixme: add validator for elementId / propName
				return getResolvedBindingWithState(
					null,
					null,
					[],
					{},
					stateProperties,
					undefined,
					ELEMENT_BINDING,
					{address: [elementId, propName]}
				);
			}
		}
	);
}

export default function getElementsWrapper(stateProperties) {
	return new Proxy(
		{},
		{
			get(_, elementId) {
				return getElementSelectablePropsWrapper(stateProperties, elementId);
			}
		}
	);
}
