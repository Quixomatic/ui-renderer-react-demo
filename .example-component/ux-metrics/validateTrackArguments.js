/* eslint-disable no-console */
import {isObject, isElement} from './validations';
import {LIB_NAME, MIN_LEVEL, MAX_LEVEL, markTypes} from './constants';
import {types} from '@servicenow/ui-metrics';


export function validateMetadata(metadata) {
	if (!isObject(metadata)) {
		console.error(`${LIB_NAME} track() arguments[2] metadata must be an object.`);
		return false;
	}
	return true;
}

export function isExceptionEvent(eventName) {
	return eventName === types.HERO_INTERACTIVE;
}

export function validateEventName(eventName) {
	if (typeof eventName !== 'string') {
		console.error(`${LIB_NAME} track() arguments[1] eventName must be a string.`);
		return false;
	}
	if (!isExceptionEvent(eventName) && types[eventName]) {
		console.error(`${LIB_NAME} track() arguments[1] eventName cannot be a reserved name.`);
		return false;
	}
	return true;
}

export function validateCoEffects(coeffects) {

	if (!isObject(coeffects)) {
		console.error(`${LIB_NAME} track() arguments[0] coeffects must be an Object.`);
		return false;
	}
	const {host, action} = coeffects;
	if (!isElement(host)) {
		console.error(`${LIB_NAME} track() arguments[0] coeffects host property must be an HTMLElement.`);
		return false;
	}
	if (!isObject(action) || !isObject(action.meta)) {
		console.error(`${LIB_NAME} track() arguments[0] coeffects meta property must be an Object.`);
		return false;
	}
	return true;
}

export default function validateTrackArguments(coeffects, eventName, metadata, level, type) {
	if (process.env.NODE_ENV !== 'production') {
		if (!validateCoEffects(coeffects))
			return false;

		if (!validateEventName(eventName))
			return false;

		if (!validateMetadata(metadata))
			return false;

		if (!Number.isInteger(level) || level > MAX_LEVEL || level < MIN_LEVEL) {
			console.error(`${LIB_NAME} track() arguments[3] level property must be a number between ${MIN_LEVEL} and ${MAX_LEVEL}.`);
			return false;
		}

		if (!Object.values(markTypes).includes(type)) {
			console.error(`${LIB_NAME} track() arguments[3] type property must be one of mark type: usage,performance,all`);
			return false;
		}
	}
	return true;
}
