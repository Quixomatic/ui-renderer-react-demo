import {get} from '@devsnc/snowdash';
import {partial} from '@devsnc/snowdash';
import {propertyTypes} from '../constants';

import resolveWith from './resolveWith';
import getResolvedBindingWithState from './getResolvedBindingWithState';
import {mapValues} from '@devsnc/snowdash';
import basicResolvers from './basicResolvers';

const {JSON_LITERAL, DATA_CHAIN_BINDING} = propertyTypes;

const getJsonLiteral = (literal) => ({
	type: JSON_LITERAL,
	value: literal
});

export default (
	seismicProperties,
	seismicState,
	inputValues,
	csdbNodeId,
	pdbNodeIds,
	externalControllerDependencies = []
) => {
	const resolver = partial(resolveWith, {
		...basicResolvers,
		binding: partial(
			getResolvedBindingWithState,
			csdbNodeId,
			pdbNodeIds,
			externalControllerDependencies,
			{},
			seismicProperties,
			seismicState
		)
	});

	return mapValues(inputValues, (inputValue) => {
		const resolvedInputValue = resolver(inputValue);
		// everything except DATA_CHAIN_BINDING needs to be wrapped in JSON_LITERAL for DB exec engine
		return get(resolvedInputValue, ['type']) === DATA_CHAIN_BINDING
			? resolvedInputValue
			: getJsonLiteral(resolvedInputValue);
	});
};
