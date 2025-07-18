import _ from 'lodash';

const FETCH_MESSAGE_URL = '/angular.do?sysparm_type=message';

function createMessageRequestHandler(sendRequest) {
	return messages => {
		return sendRequest
			.request(FETCH_MESSAGE_URL, 'POST', {
				data: {
					messages
				},
				batch: false
			})
			.then(({ data }) => data.messages || {});
	};
}

function interpolate(str, param) {
	if (typeof param === 'string' || typeof param === 'number') {
		param = [param];
	}
	return str.replace(/{([0-9]*)}/g, (a, b) => {
		let r = param[b];
		return typeof r === 'string' || typeof r === 'number' ? r : a;
	});
}

const localizedMessagesCache = new Map();
const getFromCache = msgKey => {
	return localizedMessagesCache.get(msgKey);
};
const putCache = messages => {
	_.forOwn(messages, (msgVal, msgKey) => {
		localizedMessagesCache.set(msgKey, msgVal);
	});
};

export const GET_MESSAGE = 'getMessage';
export const GET_MESSAGES = 'getMessages';
export const LOAD_MESSAGE = 'loadMessage';
export const CLEAR_MESSAGES = 'clearMessages';

export const createMessageLocaliazationHandler = sendRequest => {
	const getMessageFromServer = createMessageRequestHandler(sendRequest);
	return {
		/**
		 * Gets a message, returns it
		 *
		 * Made to be synchronous if we have the message already. So if you are sure we've loaded
		 * the right script, then you've come to the right place. Otherwise, it is recommended
		 * to use the callback.
		 *
		 * @param msgKey String
		 *					The key of the message that you want to retrieve
		 * @param interpolationParams Array|String|Number
		 * 					Token values for tokenized message
		 * @param callback Function
		 *					The function callback when we have retrieved the key
		 */
		[GET_MESSAGE]: function(msgKey, interpolationParams, callback) {
			if (typeof interpolationParams === 'function') {
				callback = interpolationParams;
				interpolationParams = null;
			} else if (
				typeof interpolationParams === 'string' ||
				typeof interpolationParams === 'number'
			) {
				interpolationParams = [interpolationParams];
			}
			// first, check the cache, cross your fingers that it's here :)
			if (localizedMessagesCache.has(msgKey)) {
				let message = localizedMessagesCache.get(msgKey);
				if (
					typeof interpolationParam !== 'undefined' ||
					interpolationParams !== null
				) {
					message = interpolate(message, interpolationParams);
				}
				if (typeof callback == 'function') {
					callback(message);
				}
				return message;
			}

			getMessageFromServer([msgKey])
				.then(messages => putCache(messages))
				.then(() => getFromCache(msgKey))
				.then(message => {
					if (interpolationParams !== null) {
						message = interpolate(message, interpolationParams);
					}
					if (typeof callback == 'function') {
						callback(message);
					}
					return message;
				});
			return msgKey;
		},

		/**
		 * Gets a message, returns it
		 *
		 * Made to be synchronous if we have the messages already. So if you are sure we've loaded
		 * the right messages, then you've come to the right place. Otherwise, it is recommended
		 * to use the callback.
		 *
		 * @param msgKey Array
		 *					The array of keys of the messages that you want to retrieve
		 * @param callback Function
		 *					The function callback when we have retrieved the key
		 */
		[GET_MESSAGES]: function(/* array */ keys, callback) {
			const results = {};
			const needMessage = [];

			for (let i = 0; i < keys.length; i++) {
				let key = keys[i];
				if (!localizedMessagesCache.has(key)) {
					needMessage.push(key);
					results[key] = key;
					continue;
				}

				results[key] = getFromCache(key);
			}

			if (needMessage.length > 0) {
				return getMessageFromServer(needMessage)
					.then(messageMap => {
						putCache(messageMap);
						return messageMap;
					})
					.then(messageMap => {
						_.assign(results, messageMap);
						return results;
					})
					.then(results => {
						if (typeof callback === 'function') {
							callback(results);
						}
						return results;
					});
			} else if (typeof callback == 'function') {
				callback(results);
			}
			return Promise.resolve(results);
		},

		[CLEAR_MESSAGES]: function() {
			localizedMessagesCache.clear();
		},

		// load a message into the map
		[LOAD_MESSAGE]: function(msgKey, msgValue) {
			putCache({ [msgKey]: msgValue });
		}
	};
};
