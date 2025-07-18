import {camelCase} from '../utils';
import {compact} from '@devsnc/snowdash';
import {partial} from '@devsnc/snowdash';
import {default as console} from '../../utils/getLogger.js';
import {getNamespacedComponentId, getKebabCasedDbOutputProp} from '../utils';
import {
	propertyTypes,
	MACROPONENT_ROOT_COMPONENT_ID,
	CONTEXT_PROPS_IDENTIFIER,
	APP_PROPS_IDENTIFIER,
	SYS_PROPS_IDENTIFIER,
	SESSION
} from '../constants';
import {isNil} from '@devsnc/snowdash';

const {CONTEXT_BINDING, ELEMENT_BINDING, DATA_OUTPUT_BINDING} = propertyTypes;

const getSelectableProp = (element, prop, path = []) => {
	return `@${element}/${camelCase(prop)}${
		path.length > 0 ? '.' + path.join('.') : ''
	}`;
};

// fixme: add validation layer for selectable prop
export default (
	shellComponentId,
	csdbComponentId,
	type,
	{address},
	category = CONTEXT_PROPS_IDENTIFIER
) => {
	const getComponentId = partial(getNamespacedComponentId, shellComponentId);
	const [targetElementId, targetPropName, ...targetPath] = address;
	switch (type) {
		case CONTEXT_BINDING:
			switch (category) {
				case SESSION:
					return getSelectableProp(shellComponentId, 'userSessionInfo', [
						'output',
						...address
					]);
				case APP_PROPS_IDENTIFIER:
					return getSelectableProp(shellComponentId, 'nowAppProps', address);
				case SYS_PROPS_IDENTIFIER:
					return getSelectableProp(shellComponentId, 'nowSysProps', address);
				case CONTEXT_PROPS_IDENTIFIER: {
					//With the category field on context bindings, each field is essentially shifted
					//Redefining constants to make more sense.
					const propName = targetElementId;
					const propPath = compact([targetPropName, ...targetPath]);

					return getSelectableProp(shellComponentId, propName, propPath);
				}
				default:
					return getSelectableProp(
						shellComponentId,
						targetPropName,
						targetPath
					);
			}
		case ELEMENT_BINDING:
			if (targetElementId === MACROPONENT_ROOT_COMPONENT_ID)
				return getSelectableProp(
					getComponentId(MACROPONENT_ROOT_COMPONENT_ID),
					targetPropName,
					targetPath
				);
			return getSelectableProp(
				getComponentId(targetElementId),
				targetPropName,
				targetPath
			);
		case DATA_OUTPUT_BINDING:
			if (
				!isNil(csdbComponentId) &&
				getComponentId(targetElementId) === csdbComponentId
			)
				return getSelectableProp(csdbComponentId, targetPropName, targetPath);
			else
				return getSelectableProp(
					shellComponentId,
					getKebabCasedDbOutputProp(targetElementId),
					[targetPropName, ...targetPath]
				);
		default:
			console.warn('Unsupported binding encountered');
			return '';
	}
};
