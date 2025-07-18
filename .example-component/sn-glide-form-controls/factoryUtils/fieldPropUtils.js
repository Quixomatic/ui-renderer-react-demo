import {
	memoize,
	includes,
	pickBy,
	identity,
	chain,
	omit,
	map,
	isEmpty,
} from 'lodash';
import { get } from '@devsnc/sn-controls-common';
import { t } from 'sn-translate';
import { FIELD_TYPE } from '@devsnc/sn-controls-common';
import { LiveUpdateMessage } from '@devsnc/sn-form-controls';
import {
	escapeSeismicSpecialSymbols,
	isAttrTrue,
	getProperty
} from '@devsnc/sn-controls-common';
import { getCurrentUser } from './userPrefUtils';

const getHtmlAttributes = dictionaryAttributes => {
	//map the attributes to our prop names & return truthy properties only
	return (
		dictionaryAttributes &&
		pickBy(
			{
				height: dictionaryAttributes['editor.height'],
				maxHeight: dictionaryAttributes['editor.max_height'],
				plugins: dictionaryAttributes['editor.plugins'],
				toolbar: dictionaryAttributes['editor.toolbar'],
				browserSpellcheck: dictionaryAttributes['editor.spellcheck'],
				autoresizeBottomMargin:
					dictionaryAttributes['editor.autoresize_bottom_margin']
			},
			identity
		)
	);
};

const getDictionaryAttrs = controlProps => {
	return chain(get(controlProps, 'dictionary.attributes'))
		.keyBy('name')
		.mapValues('value')
		.value();
};

/**
 * For date/time fields, `displayValue` is adjusted for the user's timezone
 * pref, `value` is not. Move the displayValue over to the value prop so that
 * the form control can deal with localized time rather than UTC.
 */
const adjustPropsForTimezone = controlProps => {
	const displayValue = controlProps.displayValue;
	if (!displayValue) {
		return controlProps;
	}

	const updatedProps = omit(controlProps, 'displayValue');
	updatedProps.value = displayValue;

	return updatedProps;
};

/**
 * Determines whether a given field type is supported by controls team.
 * @param {string} type - name of the field type
 * @returns {boolean} Whether the type is supported
 */
const isSupported = type => {
	return includes(FIELD_TYPE, type);
};

const getMessagesAndLiveUpdate = (liveUpdate, msgs) => {
	const messages = Array.isArray(msgs) ? msgs : [];

	if (liveUpdate) {
		let userName = get(liveUpdate, 'updatedBy.displayName');
		let newMsg = { type: '', message: new LiveUpdateMessage(userName) };
		if (liveUpdate.isUserModified) {
			newMsg.type = 'warning';
			newMsg.message.setNewValue(liveUpdate.displayValue);
		} else {
			newMsg.type = 'liveUpdate';
		}

		return [...messages, newMsg];
	}
	return messages;
};

const transformValueForDaysOfWeek = value => {
	const newValue = value ? value.split('').join(',') : value;
	return newValue;
};

const sanitizeField = field => {
	// Remove props that can conflict with HTML or have otherwise unintended side effects
	// eslint-disable-next-line no-unused-vars
	const { type, hidden, ...validAttrs } = field;

	if (hidden) {
		console.warn(
			`Invalid attribute "hidden" found for ${field.name}. Use "visible" instead.`
		);
	}

	return validAttrs;
};

const getReferenceProps = controlProps => ({
	...controlProps,
	tableName: controlProps.referringTable,
	fieldName: controlProps.name,
	sortBy: controlProps.refAcOrderBy,
	referenceTable: controlProps.reference,
	displayValue: escapeSeismicSpecialSymbols(controlProps.displayValue),
	recordSysId: controlProps.referringRecordId,
	searchCancelable: getProperty(
		'glide.request_manager.cancel_reference_completer',
		true
	),
	maxSearchMatches: Number.parseInt(
		getProperty('glide.ui.max_search_matches', 250),
		10
	)
});

const normalizeCountryCodes = countryCodes =>
	map(countryCodes, code => ({
		...code,
		value: code.code,
		displayValue: `${code.name} +${code.code}`
	}));

const getDateFormat = (formData, keepOriginal) =>
	memoize(() => {
		const dateFormat = getCurrentUser(formData).dateFormat || 'YYYY-MM-DD';
		return keepOriginal ? dateFormat : dateFormat.toUpperCase();
	})();

const getTimeFormat = formData =>
	memoize(() => {
		let userTimeFormat = getCurrentUser(formData).timeFormat;
		return (userTimeFormat && userTimeFormat.replace(':SSS', '')) || 'HH:mm:ss'; // the platform does not support milliseconds, change time format
	})();

const getDateTimeFormat = (formData, keepOriginal) =>
	memoize(
		() => `${getDateFormat(formData, keepOriginal)} ${getTimeFormat(formData)}`
	)();

const getAttribute = controlProps => (attribute, defaultValue) => {
	const attributes = get(controlProps, 'dictionary.attributes', []);

	const attributeValue = attributes.find(a => a.name === attribute);

	return attributeValue === undefined ? defaultValue : attributeValue.value;
};

const checkIfInfoMessageExists = controlProps => {
	const { dependentFieldLabel, messages } = controlProps;
	const infoMessage = t(
		`Select a ${dependentFieldLabel} before modifying this field`
	);
	return messages.find(item => item.message === infoMessage);
};

const parseCountryCode = (countryCode, value, countryCodes) => {
	if (!value) return countryCode;
	const parsedCode = (countryCodes || []).find(code =>
		value.startsWith(`+${code.code}`)
	);
	return parsedCode && parsedCode !== countryCode
		? parsedCode.code
		: countryCode;
};

const getFormDataForTemplateValue = (formData = {}) => ({
	...formData,
	encodedRecord: ''
});

const toHtml = htmlString => {
	if (typeof htmlString == 'string')
		return (
			<span
				dangerouslySetInnerHTML={{
					__html: htmlString
				}}
			/>
		);

	return htmlString;
};

const getEncryptedFieldLabel = (originalLabel, encryptionName = '') => {
	const suffix = !isEmpty(encryptionName) ? `: ${encryptionName}` : '';
	const translatedEncrypted = t('Encrypted');
	const fullSuffix = ` (${translatedEncrypted}${suffix})`;
	return originalLabel + fullSuffix;
};

export {
	getHtmlAttributes,
	getDictionaryAttrs,
	adjustPropsForTimezone,
	isSupported,
	getMessagesAndLiveUpdate,
	transformValueForDaysOfWeek,
	sanitizeField,
	getReferenceProps,
	normalizeCountryCodes,
	getDateFormat,
	getTimeFormat,
	getDateTimeFormat,
	getAttribute,
	checkIfInfoMessageExists,
	parseCountryCode,
	getFormDataForTemplateValue,
	toHtml,
	getEncryptedFieldLabel
};
