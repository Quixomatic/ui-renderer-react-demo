import {isFunction} from '@devsnc/snowdash';
import {compact} from '@devsnc/snowdash';
import getTemplates from '../templateLoader/getTemplates.js';
import {getMacroponentTagName} from '../utils/macroponent.js';
import {isString} from '@devsnc/snowdash';

export async function effect(options = {}, coeffects) {
	const {successActionType, errorActionType} = options;

	const {
		action: {
			payload: {sysId}
		},
		dispatch
	} = coeffects;

	const sysIds = compact([sysId]);
	const request = {
		sysId
	};

	try {
		const fragmentGenerators = await getTemplates(sysIds);
		if (isFunction(fragmentGenerators[sysId])) {
			if (isString(successActionType)) {
				dispatch(successActionType, {
					request,
					customElementTagName: getMacroponentTagName(sysId)
				});
			}
		} else {
			throw new Error('Failed to load macroponent');
		}
	} catch (error) {
		if (isString(errorActionType)) {
			dispatch(errorActionType, {request});
		}
	}
}

export default function createMacroponentLoaderEffect(options) {
	return {
		effect,
		args: [options],
		stopPropagation: true
	};
}
