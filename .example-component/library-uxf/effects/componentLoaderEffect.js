import {isString} from '@devsnc/snowdash';
import {
	getComponentsBySysIds,
	getComponentsByTagNames
} from '../templateLoader/getComponents.js';
import {isUndefined} from '@devsnc/snowdash';

export async function effect(options = {}, coeffects) {
	const {successActionType, errorActionType} = options;

	const {
		action: {
			payload: {tagName, sysId}
		},
		dispatch
	} = coeffects;

	if (isUndefined(tagName) && isUndefined(sysId)) return;

	// if both tagName and sysId is sent, tagName takes precendence
	const payloadType = !isUndefined(tagName) ? 'tagName' : 'sysId';
	const payloadValue = !isUndefined(tagName) ? tagName : sysId;

	const request = {
		[payloadType]: payloadValue
	};

	const promisedComponent =
		payloadType === 'tagName'
			? getComponentsByTagNames([tagName])
			: getComponentsBySysIds([sysId]);

	try {
		const [loadedComponentTagName] = await promisedComponent;
		if (isUndefined(loadedComponentTagName))
			throw new Error('Failed to load component');

		if (isString(successActionType))
			dispatch(successActionType, {request, tagName: loadedComponentTagName});
	} catch (error) {
		if (isString(errorActionType)) dispatch(errorActionType, {request});
	}
}

export default function createComponentLoaderEffect(options) {
	return {
		effect,
		args: [options],
		stopPropagation: true
	};
}
