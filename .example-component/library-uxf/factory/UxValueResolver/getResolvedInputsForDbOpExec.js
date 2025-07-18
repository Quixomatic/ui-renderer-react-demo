import {has} from '@devsnc/snowdash';
import {partial} from '@devsnc/snowdash';
import {propertyTypes} from '../constants';

import resolveWith from './resolveWith';
import getResolvedPayloadBinding from './getResolvedPayloadBinding';
import basicResolvers from './basicResolvers';

import {mapValues} from '@devsnc/snowdash';

const {JSON_LITERAL, EVENT_PAYLOAD_BINDING} = propertyTypes;

const getJsonLiteral = (literal) => ({
	type: JSON_LITERAL,
	value: literal
});

export default (dryTargetInputValues, hydratedOperationPayload) => {
	const resolver = partial(resolveWith, {
		...basicResolvers,
		[EVENT_PAYLOAD_BINDING]: partial(
			getResolvedPayloadBinding,
			hydratedOperationPayload
		)
	});

	return mapValues(dryTargetInputValues, (inputValue) => {
		const resolvedInputValue = resolver(inputValue);
		// DB exec engine doesn't like SHORTHAND values, so we wrap any such in JSON_LITERAL
		return !has(resolvedInputValue, ['type'])
			? getJsonLiteral(resolvedInputValue)
			: resolvedInputValue;
	});
};
