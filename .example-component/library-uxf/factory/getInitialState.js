import {get} from '@devsnc/snowdash';
import {IS_MACROPONENT_READY, propertyTypes} from './constants';
import resolveForInitialStateValues from './UxValueResolver/resolveForInitialStateValues';

const {
	CONTEXT_BINDING,
	JSON_LITERAL,
	CLIENT_TRANSFORM,
	LIST_CONTAINER
} = propertyTypes;

function getOperandsList(initialValue) {
	if (get(initialValue, ['transform', 'operands', 'type']) === LIST_CONTAINER) {
		return get(initialValue, ['transform', 'operands', 'container']);
	} else {
		const map = get(initialValue, ['transform', 'operands', 'container']);
		const values = Object.keys(map).map(function(key) {
			return map[key];
		});
		return Array.from(values);
	}
}

export default (stateProperties) => {
	if (stateProperties.length === 0) {
		return {
			initialState: {
				[IS_MACROPONENT_READY]: true
			},
			unresolvedInitialState: {}
		};
	}

	const statePropertiesWithLiteralInitialValues = stateProperties.filter(
		({initialValue}) => get(initialValue, ['type']) === JSON_LITERAL
	);
	const statePropertiesWithContextPropInitialValues = stateProperties.filter(
		({initialValue}) => get(initialValue, ['type']) === CONTEXT_BINDING
	);
	const statePropertiesWithClientTransformInitialValues = stateProperties.filter(
		({initialValue}) => get(initialValue, ['type']) === CLIENT_TRANSFORM
	);

	const resolvableClientTransforms = statePropertiesWithClientTransformInitialValues.filter(
		({initialValue}) =>
			getOperandsList(initialValue).filter(({type}) => type === JSON_LITERAL)
				.length == getOperandsList(initialValue).length
	);
	const unresolvableClientTransforms = statePropertiesWithClientTransformInitialValues.filter(
		({initialValue}) =>
			getOperandsList(initialValue).filter(({type}) => type === JSON_LITERAL)
				.length != getOperandsList(initialValue).length
	);

	const initialState = [
		...statePropertiesWithLiteralInitialValues,
		...resolvableClientTransforms
	].reduce(
		(acc, stateProperty) => {
			const {name, initialValue: value} = stateProperty;
			acc[name] = resolveForInitialStateValues({}, value);
			return acc;
		},
		{
			[IS_MACROPONENT_READY]:
				statePropertiesWithContextPropInitialValues.length === 0
		}
	);

	const unresolvedInitialState = [
		...statePropertiesWithContextPropInitialValues,
		...unresolvableClientTransforms
	].reduce((acc, stateProperty) => {
		const {name, initialValue: value} = stateProperty;
		acc[name] = value;
		return acc;
	}, {});

	return {
		initialState,
		unresolvedInitialState
	};
};
