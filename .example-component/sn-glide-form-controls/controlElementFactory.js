/* eslint-disable no-console */
import React from 'react';
import { last, get, chain, omit, some, flow, isEmpty } from 'lodash';
import { t } from 'sn-translate';
import { LiveUpdateMessage } from '@devsnc/sn-form-controls';
import { canRenderFieldAction } from '@devsnc/sn-declarative-actions';
import { DAYS_OF_WEEK_OPTIONS, JAVASCRIPT, TINYMCE_VERSION } from './constants';
import {
	getDeclarativeActionsProps,
	escapeSeismicSpecialSymbols,
	isAttrTrue,
	isAttrFalse,
	getProperty,
	setInitialValue,
	adaptCallbackForLegacyAPI,
	FIELD_TYPE
} from '@devsnc/sn-controls-common';

import {
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
	parseCountryCode,
	getTinyMCEToolbar,
	controlOrSysProp,
	getCurrentUser,
	getHelperContent,
	getTimeProps,
	fixLocale,
	toHtml,
	getUserLanguage,
	resolveLanguage,
	getFormDataForTemplateValue,
	getEncryptedFieldLabel
} from './factoryUtils';

const getRecommendations = ({ recommendation }) => {
	if (isEmpty(recommendation)) {
		return;
	}
	const { sectionLabel = 'Top Recommendation(s)', items = [] } = recommendation;
	if (items.length === 0) {
		return;
	}

	return {
		sectionLabel,
		items,
		isRecommendation: true
	};
};

const getDefaultFormControl = (controlProps, type) => {
	return {
		Control: 'sn-record-input',
		controlProps: {
			...controlProps,
			readonly: true,
			description: t('* Field type {0} is not supported.', type)
		}
	};
};

const concatRecommendationLabel = ({ highlightedValue, recommendation }) => {
	if (isEmpty(recommendation)) {
		return highlightedValue;
	}
	const { items = [], source } = recommendation;
	if (items.length === 0) {
		return highlightedValue;
	}

	return [highlightedValue, source];
};

export function createFormControl(
	parentId,
	type,
	field,
	onValueChange,
	onStagedValueChange,
	formData
) {
	const { Control, props, children, render } = getFormControl(
		parentId,
		type,
		field,
		onValueChange,
		onStagedValueChange,
		formData
	);

	if (!render) {
		return null;
	}

	return <Control {...props}>{children}</Control>;
}

export function getFormControl(
	parentId,
	type,
	field,
	onValueChange,
	onStagedValueChange,
	formData,
	fieldLayout = { layout: 'vertical' }
) {
	if (field.visible === false || field.visible === 'false')
		return { render: false };

	const componentId = `${parentId}_${type}_${field.name}`;
	const messages = getMessagesAndLiveUpdate(field.liveUpdate, field.messages);
	const declarativeActionsProps = getDeclarativeActionsProps({
		...field,
		fields: formData?.fields
	});
	const currentUser = getCurrentUser(formData);
	const userMention = {
		'@': 'users'
	};
	const { layout } = fieldLayout;

	let controlProps = sanitizeField({
		...field,
		context: 'form',
		key: componentId,
		'component-id': componentId,
		maxlength: field.maxLength || field.maxlength,
		invalid:
			field.isInvalid || field.invalid || some(messages, { type: 'error' }),
		required: field.mandatory,
		messages,
		// DEF0256672: always pass live update
		liveUpdate: field.liveUpdate || null,
		onValueChange: onValueChange,
		onStagedValueChange: onStagedValueChange,
		fieldType: type, // we need field type, but it is stripped out so put it under a different key that it won't have html side effects
		formData,
		helperContent: getHelperContent(field, currentUser),
		fieldLayout: fieldLayout
	});

	let Control, controlChildren, singleCurrency;
	let useAllFractionsDigits = true;
	const isLayoutHorizontal = layout === 'horizontal';

	switch (type) {
		case FIELD_TYPE.BOOLEAN: {
			Control = 'now-record-checkbox';
			controlProps = {
				...controlProps,
				value: isAttrTrue(controlProps.value),
				fullWidth: isLayoutHorizontal ? true : false,
				labelPosition: isLayoutHorizontal ? 'start' : 'end'
			};
			break;
		}

		case FIELD_TYPE.DAYS_OF_WEEK:
			Control = 'sn-record-checkbox-group';
			controlProps = {
				...controlProps,
				onValueChange: controlProps => {
					const { value, name } = controlProps;
					const newValue = value.split(',').join('');
					adaptCallbackForLegacyAPI(onValueChange)({
						name: name,
						value: newValue
					});
				},
				options: DAYS_OF_WEEK_OPTIONS,
				value: transformValueForDaysOfWeek(controlProps.value),
				fullWidth: isLayoutHorizontal ? true : false,
				labelPosition: isLayoutHorizontal ? 'start' : 'end'
			};
			break;

		case FIELD_TYPE.CHOICE:
			Control = 'sn-record-choice-connected';
			controlProps = setInitialValue({
				...controlProps,
				'table-name': field.referringTable,
				'record-sys-id': field.referringRecordId,
				optionStack: field.optionStack,
				dictionaryAttributes: {
					refQualElements: getAttribute(controlProps)('ref_qual_elements', '')
				},
				suggestions: getRecommendations(field),
				highlightedValue: concatRecommendationLabel(field)
			});
			break;

		case FIELD_TYPE.CONDITIONS:
			import('../connectedconditions/ConnectedConditions');
			Control = 'sn-record-conditions-connected';
			const getAttr = getAttribute(controlProps);
			controlProps = {
				...controlProps,
				dependentFieldLabel: get(
					controlProps,
					'dictionary.dependentFieldLabel'
				),
				dictionaryAttributes: {
					staticDependent: getAttr('staticDependent'),
					showConditionCount: isAttrTrue(
						getAttr('show_condition_count'),
						false
					),
					allowedFields: getAttr('restrictTo'),
					allowRelatedListQuery: isAttrTrue(
						getAttr('allow_related_list_query'),
						false
					),
					allowSort: isAttrTrue(getAttr('allow_order'))
				},
				useLegacyConditionBuilder: isAttrTrue(
					getProperty('glide.ui.use.legacy.condition_builder', false)
				)
			};
			break;

		case FIELD_TYPE.CURRENCY:
			singleCurrency = isAttrTrue(
				getProperty('glide.i18n.single_currency', false)
			);
			useAllFractionsDigits = isAttrTrue(
				getProperty('glide.currency_price.use_all_fraction_digits', false)
			);

		case FIELD_TYPE.CURRENCY2:
			Control = 'sn-record-currency-connected';
			// display_string is the curr;value, i.e. JPY;1000
			// value is the converted number i.e. 9.07  (but in the default system currency, in this case USD)
			// displayValue is the string with the converted number i.e. "$9.07"
			// so, use display_string and default to value
			controlProps = {
				singleCurrency,
				...controlProps,
				useAllFractionsDigits,
				locale: fixLocale(
					currentUser.language && currentUser.country
						? `${currentUser.language}-${currentUser.country}`
						: getProperty('glide.system.locale')
				)
			};
			break;

		case FIELD_TYPE.PRICE:
			Control = 'sn-record-price-connected';
			singleCurrency = isAttrTrue(
				getProperty('glide.i18n.single_currency', false)
			);
			useAllFractionsDigits = isAttrTrue(
				getProperty('glide.currency_price.use_all_fraction_digits', false)
			);
			controlProps = {
				singleCurrency,
				...controlProps,
				useAllFractionsDigits,
				locale: fixLocale(
					currentUser.language && currentUser.country
						? `${currentUser.language}-${currentUser.country}`
						: getProperty('glide.system.locale')
				),
				declarativeActionsProps
			};
			break;

		case FIELD_TYPE.DUE_DATE:
		case FIELD_TYPE.DATE_TIME: {
			Control = 'now-record-date-picker';
			const { isEncrypted, encryptionContext, label } = controlProps;
			controlProps = getTimeProps({
				...controlProps,
				format: getDateTimeFormat(formData),
				originalFormat: getDateTimeFormat(formData, true),
				timePicker: true,
				label: isEncrypted
					? getEncryptedFieldLabel(label, encryptionContext)
					: label,
				declarativeActionsProps
			});

			break;
		}

		case FIELD_TYPE.OTHER_DATE:
		case FIELD_TYPE.DATE: {
			Control = 'now-record-date-picker';
			const { isEncrypted, encryptionContext, label } = controlProps;
			controlProps = getTimeProps({
				...controlProps,
				format: getDateFormat(formData),
				label: isEncrypted
					? getEncryptedFieldLabel(label, encryptionContext)
					: label,
				declarativeActionsProps
			});

			break;
		}

		case FIELD_TYPE.TIME:
		case FIELD_TYPE.UTC_TIME: {
			Control = 'now-record-time';

			// need to change format so it doesn't have milliseconds, which the platform does not support
			let format =
				(controlProps.format && controlProps.format.replace(':SSS', '')) ||
				getTimeFormat(formData);

			const separator = format.includes('.') ? '.' : ':';

			if (type === FIELD_TYPE.UTC_TIME) {
				const isUsingUserFormat = chain(controlProps)
					.get('dictionary.attributes', [])
					.some(
						attr => attr.name === 'user_time_format' && isAttrTrue(attr.value)
					)
					.value();

				format = isUsingUserFormat ? format : 'HH:mm:ss';
			}

			// `aa` is a legal in Java (supported by SN) but not for moment js.
			format = format.replace('aa', 'a');

			controlProps = adjustPropsForTimezone({
				...controlProps,
				separator,
				format
			});
			break;
		}

		case FIELD_TYPE.PASSWORD: {
			Control = 'sn-record-input-connected';
			controlProps = setInitialValue({
				...controlProps,
				type,
				displayValue: controlProps.displayValue || controlProps.value,
				disableUnmask: controlProps.disableUnmask || isAttrTrue(controlProps.readonly),
				declarativeActionsProps
			});
			break;
		}
		case FIELD_TYPE.PASSWORD2: {
			Control = 'sn-record-input-connected';
			const maxCharsBeforeHash = 183;
			const maxlength = Math.min(maxCharsBeforeHash, controlProps.maxlength); //255 is maxlength of hash value from entered characters, 183 is what is actually allowed.
			const getAttr = getAttribute(controlProps);
			controlProps = setInitialValue({
				...controlProps,
				type,
				disableUnmask: !isAttrTrue(getAttr('show_secret', false)) || isAttrTrue(controlProps.readonly),
				value: controlProps.displayValue || controlProps.value,
				displayValue: controlProps.displayValue || controlProps.value,
				maxlength,
				declarativeActionsProps
			});
			break;
		}

		case FIELD_TYPE.VERSION:
			Control = 'sn-record-version';
			controlProps = {
				...controlProps,
				declarativeActionsProps
			};
			break;

		case FIELD_TYPE.EMAIL:
			Control = 'sn-record-email';
			controlProps = setInitialValue({
				...controlProps,
				declarativeActionsProps
			});
			break;

		case FIELD_TYPE.PHONE:
			const formatUsPhone = isAttrTrue(
				getProperty('glide.ui.format_phone', true)
			);
			if (!formatUsPhone) {
				Control = 'sn-record-input-connected';
				controlProps = setInitialValue({
					...controlProps,
					declarativeActionsProps,
					suggestions: getRecommendations(field),
					highlightedValue: concatRecommendationLabel(field)
				});
				break;
			}
		case FIELD_TYPE.PHONE_NUMBER:
		case FIELD_TYPE.PHONE_NUMBER_E164:
			Control = 'sn-record-phone-connected';
			const parsedCountryCode = parseCountryCode(
				controlProps.country,
				controlProps.value,
				controlProps.countryCodes
			);
			controlProps = setInitialValue({
				...controlProps,
				countryCode: parsedCountryCode,
				phoneAddon: canRenderFieldAction({
					model: controlProps,
					action: {
						dependency: 'CTI',
						requiresExistingRecord: true
					},
					formData
				}),
				countryCodes: normalizeCountryCodes(controlProps.countryCodes),
				formatUsPhone: isAttrTrue(getProperty('glide.ui.format_phone', true)),
				declarativeActionsProps
			});
			break;

		case FIELD_TYPE.DOMAIN_ID:
			controlProps = {
				...controlProps,
				fullDisplayValue: controlProps.displayValue,
				displayValue: controlProps.displayValue
					? last(controlProps.displayValue.split('/'))
					: ''
			};

		case FIELD_TYPE.REFERENCE: {
			Control = 'sn-record-reference-connected';

			let resultLimit = Number.parseInt(
				getProperty('glide.ui.max_ref_dropdown'),
				10
			);
			if (Number.isNaN(resultLimit)) resultLimit = undefined;

			controlProps = getReferenceProps({
				...controlProps,
				referenceAddonReadonly: isAttrTrue(
					controlOrSysProp(
						false,
						'glide.ui.reference.readonly.clickthrough',
						field.readonly_clickthrough
					)
				),
				resultLimit,
				disableDisplayValueWarning: isAttrTrue(
					getProperty('glide.ui.reference.disable_displayvalue_warning', true)
				),
				declarativeActionsProps,
				searchUsingStartsWith: isAttrTrue(
					getProperty('glide.ui.ref_ac.startswith', true)
				),
				searchOnClick: isAttrTrue(
					getAttribute(controlProps)('ref_search_on_click', true)
				),
				disableEmailFreeformEntry: true,
				suggestions: getRecommendations(field),
				highlightedValue: concatRecommendationLabel(field)
			});
			break;
		}

		case FIELD_TYPE.SHORT_TABLE_NAME:
		case FIELD_TYPE.TABLE_NAME: {
			Control = 'sn-record-tablename-connected';

			const getAttr = getAttribute(controlProps);
			controlProps = {
				...controlProps,
				tableName: controlProps.referringTable,
				dictionaryAttributes: {
					shortList: !isAttrTrue(getAttr('full_list'), true),
					canRead: isAttrTrue(getAttr('can_read_table')),
					includeDefault: isAttrTrue(getAttr('includeDefault')),
					selectedOnly: isAttrTrue(getAttr('selected_only')),
					noViews: isAttrTrue(getAttr('no_views')),
					noSystemTables: isAttrTrue(getAttr('no_system_tables')),
					filterEntitledTables: isAttrTrue(
						getAttr('filter_licensed_custom_tables')
					),
					showTableNames: isAttrTrue(getAttr('show_table_names')),
					showTableNamesOnLabel: isAttrTrue(
						getAttr('show_table_names_on_label')
					),
					tableChoicesScript: getAttr('tableChoicesScript'),
					skipRoot: isAttrTrue(getAttr('skip_root')),
					baseTable: getAttr('base_table'),
					allowPublic: isAttrTrue(getAttr('allow_public')),
					skipScopeRestrictions: isAttrTrue(
						getAttr('skipScopeRestrictions'),
						false
					)
				},
				formData,
				suggestions: getRecommendations(field),
				highlightedValue: concatRecommendationLabel(field)
			};

			break;
		}

		case FIELD_TYPE.FIELD_NAME: {
			Control = 'sn-record-fieldname-connected';
			const getAttr = getAttribute(controlProps);
			controlProps = {
				...controlProps,
				displayValue: escapeSeismicSpecialSymbols(controlProps.displayValue),
				dictionaryAttributes: {
					referenceTypes: getAttr('reference_types'),
					allowDotWalking: isAttrTrue(getAttr('allow_references'), false)
				},
				dependentFieldValue:
					controlProps.dependentFieldValue || controlProps.dependentValue
			};
			break;
		}

		case FIELD_TYPE.GLIDE_LIST: {
			Control = 'sn-record-reference-connected';

			let resultLimit = Number.parseInt(
				getProperty('glide.ui.max_ref_dropdown'),
				10
			);
			if (Number.isNaN(resultLimit)) resultLimit = undefined;

			controlProps = getReferenceProps({
				...controlProps,
				displayValue: field.display_value_list,
				'form-data': formData,
				resultLimit,
				multiSelection: true,
				disableDisplayValueWarning: isAttrTrue(
					getProperty('glide.ui.reference.disable_displayvalue_warning', true)
				),
				disableEmailFreeformEntry: isAttrTrue(
					getAttribute(controlProps)('no_email')
				),
				declarativeActionsProps,
				suggestions: getRecommendations(field),
				highlightedValue: concatRecommendationLabel(field)
			});
			break;
		}

		case FIELD_TYPE.FIELD_LIST: {
			Control = 'sn-record-field-list-connected';
			const getAttr = getAttribute(controlProps);
			controlProps = {
				...controlProps,
				value:
					isAttrTrue(getAttr('default_display_name'), false) &&
					!controlProps.value
						? controlProps.displayColumnLabel
						: controlProps.value,
				displayValue:
					isAttrTrue(getAttr('default_display_name'), false) &&
					!controlProps.value
						? controlProps.displayColumnValue
						: controlProps.displayValue,
				displayValuesWithPath:
					isAttrTrue(getAttr('default_display_name'), false) &&
					!controlProps.value
						? Array.of(controlProps.displayColumnValue)
						: controlProps.displayValuesWithPath,

				referenceTypes: getAttr('reference_types'),
				allowDotWalking: !isAttrTrue(getAttr('exclude_dot_walk'), false),
				includeSysId: isAttrTrue(getAttr('include_sys_id_in_fieldlist', false)),
				showTableDefaultDisplayColumn: isAttrTrue(
					getAttr('default_display_name', false)
				),

				dependentFieldLabel: get(
					controlProps,
					'dictionary.dependentFieldLabel'
				),
				dependentFieldValue:
					getAttr('table') ||
					controlProps.dependentFieldValue ||
					controlProps.dependentValue
			};
			break;
		}

		case FIELD_TYPE.FIELD_LOOKUP: {
			Control = 'now-record-field-lookup-connected';
			controlProps = {
				...controlProps,
				suggestions: getRecommendations(field),
				highlightedValue: concatRecommendationLabel(field)
			};
			break;
		}

		case FIELD_TYPE.USER_ROLES: {
			Control = 'sn-record-user-roles-lookup-connected';

			let resultLimit = Number.parseInt(
				getProperty('glide.ui.max_ref_dropdown'),
				10
			);
			if (Number.isNaN(resultLimit)) resultLimit = undefined;
			controlProps = {
				...controlProps,
				resultLimit,
				suggestions: getRecommendations(field),
				highlightedValue: concatRecommendationLabel(field)
			};
			break;
		}

		case FIELD_TYPE.DOCUMENT_ID:
			Control = 'sn-record-document-id-connected';
			const prepareDeclarativeActions = controlProps => ({
				...controlProps,
				declarativeActionsProps: {
					...controlProps.declarativeActionsProps,
					reference: controlProps.dependentValue,
					referenceTable: controlProps.dependentValue,
					ignoreDepAsRefQual: true
				},
				suggestions: getRecommendations(field),
				highlightedValue: concatRecommendationLabel(field)
			});
			controlProps = flow(
				getReferenceProps,
				prepareDeclarativeActions
			)({
				...controlProps,
				searchAddon: false,
				referenceAddonReadonly: true,
				declarativeActionsProps,
				dependentFieldLabel: get(controlProps, 'dictionary.dependentFieldLabel')
			});
			break;

		case FIELD_TYPE.STRING_LONG:
		case FIELD_TYPE.ENCRYPTED_TEXT:
		case FIELD_TYPE.TEXTAREA:
		case FIELD_TYPE.MULTI_TWO_LINES: {
			Control = 'sn-record-input-connected';
			const { isEncrypted, encryptionContext, label } = controlProps;
			const ignoreMaxlength =
				Number.parseInt(controlProps.maxlength) >= 1000 || undefined;
			controlProps = setInitialValue({
				...controlProps,
				type: 'textarea',
				ignoreMaxlength,
				showCounter: isAttrTrue(
					controlOrSysProp(
						false,
						'glide.ui.textarea.character_counter',
						controlProps.showCounter
					)
				),
				label: isEncrypted
					? getEncryptedFieldLabel(label, encryptionContext)
					: label,
				dictionaryAttributes: {
					dynamicTranslationEnabled: isAttrTrue(
						getDictionaryAttrs(controlProps)['dynamic_translation_enabled']
					)
				},
				suggestions: getRecommendations(field),
				highlightedValue: concatRecommendationLabel(field),
				autoresizeLineLimit: getProperty(
					'glide.ui.textarea.autoresize_line_limit'
				)
			});
			break;
		}
		case FIELD_TYPE.COMPOSITE_FIELD:
		case FIELD_TYPE.WIDE_TEXT:
		case FIELD_TYPE.TRANSLATED_FIELD:
		case FIELD_TYPE.TRANSLATED_TEXT:
		case FIELD_TYPE.STRING:
		case FIELD_TYPE.GUID:
		case FIELD_TYPE.STRING_FULL_UTF8: {
			const isLargeField = Number.parseInt(controlProps.maxlength) > 255;
			const ignoreMaxlength =
				Number.parseInt(controlProps.maxlength) >= 1000 || undefined;
			const { isEncrypted, encryptionContext, label } = controlProps;
			Control = 'sn-record-input-connected';
			controlProps = setInitialValue({
				...controlProps,
				type: isLargeField ? 'textarea' : 'text',
				ignoreMaxlength,
				showCounter:
					type !== FIELD_TYPE.WIDE_TEXT &&
					isAttrTrue(
						controlOrSysProp(
							false,
							'glide.ui.textarea.character_counter',
							isLargeField && controlProps.showCounter
						)
					),
				label: isEncrypted
					? getEncryptedFieldLabel(label, encryptionContext)
					: label,
				declarativeActionsProps,
				dictionaryAttributes: {
					dynamicTranslationEnabled: isAttrTrue(
						getDictionaryAttrs(controlProps)['dynamic_translation_enabled']
					)
				},
				suggestions: getRecommendations(field),
				highlightedValue: concatRecommendationLabel(field),
				autoresizeLineLimit: getProperty(
					'glide.ui.textarea.autoresize_line_limit'
				)
			});
			break;
		}
		case FIELD_TYPE.AUTO_NUMBER:
			Control = 'sn-record-auto-number-connected';
			break;
		case FIELD_TYPE.CHAR:
		case FIELD_TYPE.WORKFLOW:
		case FIELD_TYPE.STRING_SHORT:
			Control = 'sn-record-input-connected';
			controlProps = setInitialValue({
				...controlProps,
				type: 'text',
				declarativeActionsProps,
				dictionaryAttributes: {
					dynamicTranslationEnabled: isAttrTrue(
						getDictionaryAttrs(controlProps)['dynamic_translation_enabled']
					)
				},
				suggestions: getRecommendations(field),
				highlightedValue: concatRecommendationLabel(field)
			});
			break;
		case FIELD_TYPE.AUTO_INCREMENT:
		case FIELD_TYPE.INTEGER:
			Control = 'now-record-number';
			controlProps = setInitialValue({
				...controlProps,
				decimal: false,
				locale: fixLocale(getProperty('glide.system.locale')),
				format: getDictionaryAttrs(controlProps)['format'],
				declarativeActionsProps
			});
			break;
		case FIELD_TYPE.FLOAT:
		case FIELD_TYPE.DECIMAL:
			Control = 'now-record-number';
			controlProps = setInitialValue({
				...controlProps,
				locale: fixLocale(getProperty('glide.system.locale')),
				format: getDictionaryAttrs(controlProps)['format'],
				declarativeActionsProps
			});
			break;

		case FIELD_TYPE.PERCENT_COMPLETE:
			Control = 'now-record-number';
			controlProps = setInitialValue({
				...controlProps,
				percent: true,
				locale: fixLocale(getProperty('glide.system.locale')),
				format: getDictionaryAttrs(controlProps)['format'],
				declarativeActionsProps
			});
			break;

		case FIELD_TYPE.INPUT_GROUP:
			Control = 'sn-record-input-group';
			break;

		case FIELD_TYPE.URL: {
			Control = 'sn-record-url';
			const { isEncrypted, encryptionContext, label } = controlProps;

			controlProps = setInitialValue({
				...controlProps,
				label: isEncrypted
					? getEncryptedFieldLabel(label, encryptionContext)
					: label
			});
			break;
		}
		case FIELD_TYPE.JOURNAL: {
			const useHTML = isAttrTrue(
				getProperty('glide.ui.journal.use_html', false)
			);

			if (!useHTML) {
				Control = 'sn-record-input-connected';
				controlProps = setInitialValue({
					...omit(controlProps, ['maxlength', 'maxLength']),
					mentions: userMention,
					type: 'textarea',
					showCounter: isAttrTrue(
						controlOrSysProp(
							false,
							'glide.ui.textarea.character_counter',
							controlProps.showCounter
						)
					),
					suggestions: getRecommendations(field),
					highlightedValue: concatRecommendationLabel(field),
					autoresizeLineLimit: getProperty(
						'glide.ui.textarea.autoresize_line_limit'
					)
				});
				break;
			}

			controlProps.enableMentions = isAttrTrue(
				getProperty('glide.ui.journal.enable_mentions', true)
			);

			controlProps.useCodeBlocks = true;
			controlProps.resizable = true;

			const systemLanguage = getProperty('glide.sys.language');
			const supportedLanguages = getProperty(
				`glide.ui.html.editor.${TINYMCE_VERSION}.languages`,
				''
			);

			const userLanguage = getUserLanguage(currentUser);
			const defaultPlugins =
				'link lists advlist table powerpaste searchreplace preview fullscreen placeholder';

			controlProps = {
				...controlProps,
				language: resolveLanguage(
					userLanguage,
					systemLanguage,
					supportedLanguages
				),
				toolbar: [
					'bold italic underline | fontselect | alignleft aligncenter alignright | bullist numlist | link unlink'
				],
				plugins: isAttrTrue(
					getProperty('glide.ui.journal.html.editor.autoresize', false)
				)
					? `${defaultPlugins}  autoresize`
					: defaultPlugins,
				minLineCount: 3,
				autoresizeLineLimit:
					getProperty('glide.ui.journal.html.editor.autoresize_line_limit') ||
					undefined,
				fonts: getProperty(
					`glide.ui.html.editor.${TINYMCE_VERSION}.font.collection`
				),
				removeHost: isAttrTrue(getProperty('glide.ui.html.editor.remove_host')),
				relativeUrls: isAttrTrue(
					getProperty('glide.ui.html.editor.relative_urls')
				),
				convertUrls: isAttrTrue(
					getProperty('glide.ui.html.editor.convert_urls')
				),
				extendedValidElements: getProperty(
					'glide.ui.html.editor.extended_valid_elements'
				),
				isJournal: true,
				defaultLinkTarget: getProperty(
					'glide.ui.html.editor.default_link_target',
					''
				),
				configMentions: {
					enableMentions: controlProps.enableMentions,
					resourceTable: field.referringTable,
					resourceSysId: field.referringRecordId
				},
				contextmenu: getProperty(
					`glide.ui.html.editor.contextmenu`,
					'link image table'
				)
			};
			Control = 'now-record-html-editor';
			break;
		}

		case FIELD_TYPE.TRANSLATED_HTML:
		case FIELD_TYPE.HTML:
			const systemLanguage = getProperty('glide.sys.language');
			// This property is actually spelled this way and is not a typo
			const supportedLanguages = getProperty(
				`glide.ui.html.editor.${TINYMCE_VERSION}.languages`,
				'cs,de,en,es,fi,fr,fq,he,hu,it,ja,ko,nl,pl,pt,ru,th,tr,zh,zt'
			);

			const userLanguage = getUserLanguage(currentUser);

			//make object array to single object with name as key
			const dictionaryAttributes = getDictionaryAttrs(controlProps);
			const htmlAttributes = getHtmlAttributes(
				dictionaryAttributes,
				controlProps.fieldType
			);

			if (controlProps.referringTable === 'kb_knowledge') {
				const knowledgeBlockStyles =
					"body .kb-block-content-item[contentEditable='false'][data-mce-selected]" +
					' { background: #d9ebee; outline: 2px solid #01778e;}';
				controlProps.contentStyle = controlProps.contentStyle
					? `${controlProps.contentStyle} ${knowledgeBlockStyles}`
					: knowledgeBlockStyles;
			}

			controlProps = {
				...controlProps,
				language: resolveLanguage(
					userLanguage,
					systemLanguage,
					supportedLanguages
				),
				toolbar: getTinyMCEToolbar(),
				validButtons:
					getProperty(
						`glide.ui.html.editor.${TINYMCE_VERSION}.toolbar.valid_buttons`
					) || undefined,
				validPlugins:
					getProperty(
						`glide.ui.html.editor.${TINYMCE_VERSION}.valid_plugins`
					) || undefined,
				plugins:
					getProperty(
						`glide.ui.html.editor.${TINYMCE_VERSION}.enabled_plugins`
					) || undefined,
				autoresizeLineLimit:
					getProperty('glide.ui.html.editor.autoresize_line_limit') ||
					undefined,
				fonts:
					getProperty(
						`glide.ui.html.editor.${TINYMCE_VERSION}.font.collection`
					) || undefined,
				removeHost: isAttrTrue(getProperty('glide.ui.html.editor.remove_host')),
				relativeUrls: isAttrTrue(
					getProperty('glide.ui.html.editor.relative_urls')
				),
				convertUrls: isAttrTrue(
					getProperty('glide.ui.html.editor.convert_urls')
				),
				extendedValidElements:
					getProperty('glide.ui.html.editor.extended_valid_elements') ||
					undefined,
				powerPasteHtmlImport:
					getProperty(
						`glide.ui.html.editor.${TINYMCE_VERSION}.paste.html_import`
					) || undefined,
				powerPasteWordImport:
					getProperty(
						`glide.ui.html.editor.${TINYMCE_VERSION}.paste.word_import`
					) || undefined,
				defaultLinkTarget: getProperty(
					'glide.ui.html.editor.default_link_target',
					''
				),
				contextmenu: getProperty(
					`glide.ui.html.editor.contextmenu`,
					'link image table'
				),
				configMentions: {
					enableMentions: controlProps.enableMentions,
					resourceTable: field.referringTable,
					resourceSysId: field.referringRecordId
				},
				dictionaryAttributes: {
					dynamicTranslationEnabled: isAttrTrue(
						getDictionaryAttrs(controlProps)['dynamic_translation_enabled']
					)
				},
				...htmlAttributes
			};
			Control = 'now-record-html-editor';
			break;

		case FIELD_TYPE.JSON:
			Control = 'sn-record-code-editor';
			controlProps = {
				...controlProps,
				editorLanguage: 'json'
			};
			break;

		case FIELD_TYPE.CSS:
			Control = 'sn-record-code-editor';
			controlProps = {
				...controlProps,
				editorLanguage: 'css'
			};
			break;

		case FIELD_TYPE.FILE_ATTACHMENT:
			Control = 'sn-record-file-attachment';
			controlProps = {
				maxAttachmentSize: getProperty('com.glide.attachment.max_size'),
				...controlProps,
				tableName: controlProps.referringTable,
				tableSysId: controlProps.referringRecordId,
				contentType: controlProps.contentType,
				virusState: controlProps.state,
				extensions: getProperty('glide.attachment.extensions')
			};
			break;

		case FIELD_TYPE.DURATION:
			Control = 'sn-record-duration';
			controlProps = {
				...controlProps,
				value: controlProps.value
			};
			break;

		case FIELD_TYPE.ANNOTATION:
			Control = 'sn-record-annotation';
			controlChildren = field.isPlainText ? field.text : [toHtml(field.text)];
			//Explicitly setting the text property to it's default value after resolving text property to controlChildren as the uiElement text property is conflicting with the component text property.
			controlProps.text = false;
			switch (field.typeDisplayValue) {
				case 'Info Box Red':
					controlProps.important = true;
					break;
				case 'Line Separator':
					controlProps.lineSeparator = true;
					break;
				case 'Section Separator':
					controlProps.sectionSeparator = true;
					break;
				case 'Section Details':
					controlProps.sectionDetails = true;
					break;
				case 'Text':
					controlProps.text = true;
					break;
			}
			break;

		case FIELD_TYPE.IP_ADDR:
		case FIELD_TYPE.IP_ADDRESS:
			Control = 'now-record-ip-address';
			break;

		case FIELD_TYPE.NAME_VALUE:
			Control = 'sn-record-name-value';
			const dictAttributes = getDictionaryAttrs(controlProps);
			controlProps = {
				...controlProps,
				keyReadOnly: isAttrTrue(dictAttributes['key_readonly']),
				valueReadOnly: isAttrTrue(dictAttributes['value_readonly']),
				noActions: isAttrTrue(dictAttributes['no_actions'])
			};

			break;

		case FIELD_TYPE.TEMPLATE_VALUE:
			Control = 'sn-record-template-value-connected';
			controlProps = {
				...controlProps,
				formData: getFormDataForTemplateValue(formData)
			};
			break;

		case FIELD_TYPE.USER_IMAGE:
			Control = 'sn-record-file-attachment';
			controlProps = {
				...controlProps,
				maxAttachmentSize: getProperty('com.glide.attachment.max_size'),
				tableName: controlProps.referringTable,
				tableSysId: controlProps.referringRecordId,
				contentType: controlProps.contentType,
				virusState: controlProps.state,
				extensions: 'jpg,png,bmp,gif,jpeg,ico,svg',
				type: 'image',
				messages: messages.map(m => {
					if (m.message instanceof LiveUpdateMessage) {
						m.message.setHideValue(true);
					}
					return m;
				})
			};
			break;

		case FIELD_TYPE.WIKI_TEXT: {
			Control = 'sn-record-wiki-text-connected';
			controlProps = {
				...controlProps,
				dualMode: isAttrTrue(getDictionaryAttrs(controlProps)['dual_mode']),
				inlineMode: isAttrFalse(
					getDictionaryAttrs(controlProps)['preview_selector']
				)
			};
			break;
		}

		case FIELD_TYPE.TIME_WORKED: {
			Control = 'sn-record-time-worked-connected';
			controlProps = setInitialValue({
				...controlProps,
				autoStart: isAttrTrue(getProperty('glide.ui.timer.started', true))
			});
			break;
		}

		case FIELD_TYPE.SCRIPT_PLAIN:
		case FIELD_TYPE.SCRIPT:
			const codeEditorEnable = isAttrTrue(
				getProperty('glide.ui.workspace.script.code_editor.enable', false)
			);
			if (codeEditorEnable) {
				Control = 'sn-record-code-editor';
				controlProps = {
					...controlProps,
					editorLanguage: JAVASCRIPT,
					autoresizeLineLimit: getProperty(
						'glide.ui.workspace.script.code_editor.autoresize_line_limit'
					)
				};
			} else {
				const defaultControl = getDefaultFormControl(controlProps, type);
				Control = defaultControl.Control;
				controlProps = defaultControl.controlProps;
			}
			break;

		default:
			const defaultControl = getDefaultFormControl(controlProps, type);
			Control = defaultControl.Control;
			controlProps = defaultControl.controlProps;
	}

	return {
		Control,
		props: controlProps,
		children: controlChildren,
		render: true
	};
}

export default {
	isSupported,
	createFormControl,
	getFormControl
};
