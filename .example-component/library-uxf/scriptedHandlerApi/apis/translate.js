import {has} from '@devsnc/snowdash';
import {t, appendTranslations} from 'sn-translate';
import http from './http';
import {default as console} from '../../utils/getLogger';

/**
 * Usage:
 *
 * helpers.translate(string)
 *  .then((translatedText) => {...})
 *
 * or
 *
 * helpers.translate(stringTemplate, tempateArg1, templateArg2)
 *  .then((translatedText => {...}))
 *
 * Alternatively can be used with await:
 *
 * const translatedText = await helpers.translate(string);
 */

const sanitizeKey = (key) => key.replace(/\\([\s\S])|(")/g, '\\$1$2');

export const singleTranslationGQL = (key) => [
	{
		query: `{
	GlideDomain_Query {
		getMessage(key: "${sanitizeKey(key)}") {
			key
			message
		}
	}
}`
	}
];

export const hasTranslation = (str) => {
	return has(window, ['__TECTONIC_TRANSLATIONS__', str]);
};

export const getWarnMessage = (str) => {
	return `Translation '${str}' is missing from window.__TECTONIC_TRANSLATIONS__ - Check KB0552358 for details`;
};

export default async function translate(str, ...rest) {
	if (!hasTranslation(str)) {
		console.warn(getWarnMessage(str));

		return http('/api/now/graphql', {
			method: 'POST',
			body: singleTranslationGQL(str),
			batch: false
		}).then(({response = []}) => {
			const {
				data: {
					GlideDomain_Query: {getMessage: {key = str, message = str} = {}} = {}
				} = {}
			} = response[0] || {};
			appendTranslations({[key]: message});
			return t(str, ...rest);
		});
	}
	return t(str, ...rest);
}
