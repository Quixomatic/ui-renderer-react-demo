import {isNull} from '@devsnc/snowdash';
import {propertyTypes} from '../constants';
import getResolvedJsonLiteral from './getResolvedJsonLiteral';

const {
	CONTEXT_BINDING,
	STATE_BINDING,
	ELEMENT_BINDING,
	SHORTHAND,
	JSON_LITERAL,
	DATA_OUTPUT_BINDING,
	DATA_CHAIN_BINDING,
	EVENT_PAYLOAD_BINDING,
	VIEWPORT_BINDING,
	REPEATER_ITEM_BINDING,
	LIST_CONTAINER,
	MAP_CONTAINER,
	CLIENT_TRANSFORM,
	BINARY,
	UNARY,
	RUNTIME_INLINE_SCRIPT,
	TRANSLATION_LITERAL,
	ENV_BINDING
} = propertyTypes;

const resolveWith = (resolvers, uxValue, repeaterItem = null) => {
	if (isNull(uxValue)) return uxValue;
	const noopResolver = () => uxValue;
	const {
		[JSON_LITERAL]: literal = getResolvedJsonLiteral,
		[CLIENT_TRANSFORM]: clientTransform = noopResolver,
		[BINARY]: binary = noopResolver,
		[UNARY]: unary = noopResolver,
		binding = noopResolver,
		[CONTEXT_BINDING]: contextBinding = binding,
		[EVENT_PAYLOAD_BINDING]: eventPayloadBinding = noopResolver,
		[RUNTIME_INLINE_SCRIPT]: clientTransformScript = noopResolver,
		[TRANSLATION_LITERAL]: translationLiteral = noopResolver,
		container: reduceContainer = noopResolver,
		[ENV_BINDING]: envBinding = noopResolver
	} = resolvers;
	const {type = SHORTHAND, ...rest} = uxValue;
	switch (type) {
		case JSON_LITERAL:
			return literal(rest);
		case MAP_CONTAINER:
		case LIST_CONTAINER:
			return reduceContainer(resolvers, type, rest.container, repeaterItem);
		case CONTEXT_BINDING:
			return contextBinding(type, rest.binding, rest.binding.category);
		case ELEMENT_BINDING:
		case STATE_BINDING:
		case DATA_OUTPUT_BINDING:
		case VIEWPORT_BINDING:
			return binding(type, rest.binding);
		case REPEATER_ITEM_BINDING:
			return binding(type, rest.binding, rest.binding.category, repeaterItem);
		case EVENT_PAYLOAD_BINDING:
			return eventPayloadBinding(type, rest.binding);
		case ENV_BINDING:
			return envBinding(uxValue);
		case DATA_CHAIN_BINDING:
			return noopResolver();
		case CLIENT_TRANSFORM:
			return clientTransform(resolvers, rest.transform, repeaterItem);
		case BINARY:
			return binary(resolvers, rest.operation, repeaterItem);
		case UNARY:
			return unary(resolvers, rest.operation, repeaterItem);
		case RUNTIME_INLINE_SCRIPT:
			return clientTransformScript(
				rest.path,
				repeaterItem,
				rest.target,
				rest.controllerElementId
			);
		case SHORTHAND:
			return noopResolver();
		case TRANSLATION_LITERAL:
			return translationLiteral(rest);
	}
};

export default resolveWith;
