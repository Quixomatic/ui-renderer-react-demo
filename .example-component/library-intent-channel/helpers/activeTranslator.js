import {intentLocalStorageKeys} from '../constants';

export const getCurrentActiveTranslatorKey = () =>
	sessionStorage.getItem(intentLocalStorageKeys.activeTranslatorKey);

export const clearActiveTranslatorKey = () =>
	sessionStorage.removeItem(intentLocalStorageKeys.activeTranslatorKey);

export const setCurrentActiveTranslatorKey = (translatorKey) =>
	sessionStorage.setItem(
		intentLocalStorageKeys.activeTranslatorKey,
		translatorKey
	);

export const unsetCurrentActiveTranslatorKey = (translatorKey) => {
	if (getCurrentActiveTranslatorKey() === translatorKey) {
		clearActiveTranslatorKey();
		return true;
	}
	return false;
};
