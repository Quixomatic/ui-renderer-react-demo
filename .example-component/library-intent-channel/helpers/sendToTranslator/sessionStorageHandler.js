import {intentLocalStorageKeys} from '../../constants';
import {appendToSessionStorage} from '../utils';

export default () => {
	const canHandle = (translatorId) => !!translatorId;
	return {
		handleSendIntent(translatorId, intentPayload) {
			if (!canHandle(translatorId)) {
				console.warn(
					`Unable to send intent to translator because translatorId is undefined.`
				);
				return;
			}

			const key = `${intentLocalStorageKeys.sendIntent}/${translatorId}`;
			const values = appendToSessionStorage(key, {translatorId, intentPayload});
			sessionStorage.setItem(key, values);
		},
		setNext() {
			console.warn(
				`Session storage handler does not support next handler, since it is the last handler in the chain`
			);
		}
	};
};
