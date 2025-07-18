import { actionTypes, declarativeOperations } from '@servicenow/ui-core';
import { toString } from 'lodash';
import {
	translationActionTypes,
	translationBehavior,
	isEnabledActionTypes,
	isEnabledBehavior
} from '@servicenow/behavior-dynamic-translation';
import {
	CLOSE,
	FIELD_VALUE_CHANGED,
	LANG_NOT_SUPPORTED,
	MAX_LENGTH_ERROR_MSG,
	MISSING_CREDENTIALS,
	NOW_BUTTON_ICONIC_CLICKED,
	NOW_TEXT_LINK_CLICKED,
	NO_TEXT,
	PREFERRED_LANGUAGE,
	RETRANSLATE,
	TRANSLATED_BY,
	TRANSLATING,
	TRY_AGAIN,
	UNABLE_TO_TRANSLATE,
	TRANSLATE,
	FORM_CLICK_WORKSPACE,
	METRICS_TRANSLATE_BUTTON_CLICKED,
	METRICS_RETRANSLATE_TEXT_REQUESTED,
	METRICS_CLOSE_TRANSLATED_TEXT_PANEL,
	METRICS_TRYING_TRANSLATION_AGAIN
} from './constants';
import '@servicenow/now-text-link';
import '@servicenow/now-rich-text';

const { COMPONENT_BOOTSTRAPPED } = actionTypes;

const {
	DYNAMIC_TRANSLATION_TEXT_TRANSLATED,
	DYNAMIC_TRANSLATION_TEXT_TRANSLATION_REQUESTED
} = translationActionTypes;

const {
	DYNAMIC_TRANSLATION_IS_ENABLED_REQUESTED,
	DYNAMIC_TRANSLATION_IS_ENABLED
} = isEnabledActionTypes;

const trackDynamicTranslationEvents = (eventTitle, metaData, dispatch) => {
	dispatch('TRACK_DYNAMIC_TRANSLATION_EVENTS', {
		eventTitle,
		metaData
	});
};

const translatedInputEffect = ({ action, updateState }) => {
	const { payload, error } = action;
	let translatedState = [
		{
			path: 'translatedText.isRetranslate',
			value: false,
			operation: declarativeOperations.SET
		}
	];
	const translatedResponse = payload.response;
	if (!error && translatedResponse) {
		const translationsObj = translatedResponse.translations[0];
		const detectedLang = translatedResponse.detectedLanguage?.code;
		const targetLang = translationsObj.targetLanguage;
		if (detectedLang !== targetLang) {
			translatedState.push(
				{
					path: 'translatedText.text',
					value: translationsObj.translatedText,
					operation: declarativeOperations.SET
				},
				{
					path: 'translatedText.currentStatus',
					value: TRANSLATED_BY(translatedResponse.translator),
					operation: declarativeOperations.SET
				},
				{
					path: 'translatedText.showRetry',
					value: false,
					operation: declarativeOperations.SET
				},
				{
					path: 'translatedText.language',
					value: detectedLang,
					operation: declarativeOperations.SET
				}
			);
		} else {
			translatedState.push(
				{
					path: 'translatedText.currentStatus',
					value: PREFERRED_LANGUAGE,
					operation: declarativeOperations.SET
				},
				{
					path: 'translatedText.text',
					value: null,
					operation: declarativeOperations.SET
				},
				{
					path: 'translatedText.showRetry',
					value: false,
					operation: declarativeOperations.SET
				}
			);
		}
	} else {
		const errorCode = translatedResponse?.code;
		let errorMessage = '';
		let showRetry = false;
		switch (errorCode) {
			case '40052':
				errorMessage = MAX_LENGTH_ERROR_MSG;
				break;
			case '40055':
				errorMessage = MISSING_CREDENTIALS;
				break;
			case '40053':
			case '40054':
			case '40056':
				errorMessage = LANG_NOT_SUPPORTED;
				break;
			default:
				errorMessage = UNABLE_TO_TRANSLATE;
				showRetry = true;
		}

		translatedState.push(
			{
				path: 'translatedText.currentStatus',
				value: errorMessage,
				operation: declarativeOperations.SET
			},
			{
				path: 'translatedText.text',
				value: null,
				operation: declarativeOperations.SET
			},
			{
				path: 'translatedText.showRetry',
				value: showRetry,
				operation: declarativeOperations.SET
			}
		);
	}

	updateState(translatedState);
};

export const dynamicTranslationBehaviour = {
	actionHandlers: {
		[DYNAMIC_TRANSLATION_TEXT_TRANSLATED]: {
			effect: translatedInputEffect,
			stopPropagation: true
		},
		[DYNAMIC_TRANSLATION_IS_ENABLED]: ({ action, updateState, host }) => {
			const { payload } = action;
			const isTranslationEnabled = payload?.response?.translation;
			updateState([
				{
					path: 'isTranslationEnabled',
					value: payload?.response?.translation,
					operation: declarativeOperations.SET
				}
			]);
			if (host.getProperty('type') === 'textarea' && isTranslationEnabled) {
				const nowTextArea = host.shadowRoot.querySelector('now-textarea');
				const nativeTextArea = nowTextArea.shadowRoot.querySelector('textarea');
				nativeTextArea.style.paddingRight = '1.5rem';
			}
		},
		[COMPONENT_BOOTSTRAPPED]: {
			effect({ dispatch, properties }) {
				const { dictionaryAttributes = {} } = properties;
				const dynamicTranslationEnabled =
					dictionaryAttributes['dynamicTranslationEnabled'];
				if (dynamicTranslationEnabled) {
					dispatch(DYNAMIC_TRANSLATION_IS_ENABLED_REQUESTED, {
						translator: ''
					});
				}
			}
		},
		[NOW_BUTTON_ICONIC_CLICKED]: {
			effect({ updateState, dispatch, properties, state }) {
				trackDynamicTranslationEvents(
					METRICS_CLOSE_TRANSLATED_TEXT_PANEL,
					{
						record: properties.referringRecordId,
						fieldType: properties.fieldType,
						language: state.translatedText?.language
					},
					dispatch
				);
				updateState({
					path: 'translatedText',
					value: null,
					operation: declarativeOperations.SET
				});
			},
			stopPropagation: true
		},
		[NOW_TEXT_LINK_CLICKED]: {
			effect({ dispatch, updateState, properties, state }) {
				const props = {
					value: properties.initialValue || state.value
				};
				const recordMetics = {
					record: properties.referringRecordId,
					fieldType: properties.fieldType,
					language: state.translatedText.language
				};

				handleDynamicTranslationClick(
					props,
					dispatch,
					updateState,
					!properties.initialValue
				);
				if (state.translatedText.showRetry) {
					trackDynamicTranslationEvents(
						METRICS_TRYING_TRANSLATION_AGAIN,
						recordMetics,
						dispatch
					);
				} else if (state.translatedText.isRetranslate) {
					trackDynamicTranslationEvents(
						METRICS_RETRANSLATE_TEXT_REQUESTED,
						recordMetics,
						dispatch
					);
				}
			},
			stopPropagation: true
		}
	}
};

export const handleDynamicTranslationClick = (
	props,
	dispatch,
	updateState,
	isHTML
) => {
	// Get the current text from the Input and call Translate service here
	let translatedState = [
		{
			path: 'translatedText.text',
			value: null,
			operation: declarativeOperations.SET
		},
		{
			path: 'translatedText.isRetranslate',
			value: false,
			operation: declarativeOperations.SET
		},
		{
			path: 'translatedText.showRetry',
			value: false,
			operation: declarativeOperations.SET
		}
	];
	if (!props.value) {
		translatedState.push({
			path: 'translatedText.currentStatus',
			value: NO_TEXT,
			operation: declarativeOperations.SET
		});
	} else {
		const msg = toString(props.value);
		const dtsRequestBody = {
			msg,
			event: {
				source: 'behaviourAPI',
				eventName: FORM_CLICK_WORKSPACE,
				tableName: props.referringTable,
				fieldName: props.name,
				fieldType: props.fieldType
			}
		};
		if (isHTML) {
			dtsRequestBody.additionalParameters = [
				{ parameterName: 'texttype', parameterValue: 'html' }
			];
		}
		dispatch(DYNAMIC_TRANSLATION_TEXT_TRANSLATION_REQUESTED, dtsRequestBody);
		translatedState.push(
			{
				path: 'translatedText.previousText',
				value: msg,
				operation: declarativeOperations.SET
			},
			{
				path: 'translatedText.currentStatus',
				value: TRANSLATING,
				operation: declarativeOperations.SET
			}
		);
	}
	updateState(translatedState);
};

export const handleDynamicTranslationBlur = (
	inputValue,
	updateState,
	translatedText = {}
) => {
	const previousTranslatedText = translatedText.previousText;
	const currentTranslationStatus = translatedText.currentStatus;
	if (currentTranslationStatus && previousTranslatedText !== inputValue) {
		updateState([
			{
				path: 'translatedText.currentStatus',
				value: FIELD_VALUE_CHANGED,
				operation: declarativeOperations.SET
			},
			{
				path: 'translatedText.isRetranslate',
				value: true,
				operation: declarativeOperations.SET
			},
			{
				path: 'translatedText.previousText',
				value: inputValue,
				operation: declarativeOperations.SET
			},
			{
				path: 'translatedText.text',
				value: null,
				operation: declarativeOperations.SET
			},
			{
				path: 'translatedText.showRetry',
				value: false,
				operation: declarativeOperations.SET
			}
		]);
	}
};

export const renderTranslatedText = (translatedText, isHTML = false) => {
	if (translatedText) {
		return (
			<div className="sn-record-dts" size="md" hideShadow="true">
				<div className="sn-record-dts-header">
					<div className="sn-record-dts-translator">
						{translatedText.currentStatus && (
							<i>
								{translatedText.currentStatus}
								{translatedText.isRetranslate && renderTextLink(RETRANSLATE)}
								{translatedText.showRetry && renderTextLink(TRY_AGAIN)}
							</i>
						)}
					</div>
					<now-button-iconic
						icon="close-fill"
						size="md"
						variant="primary"
						bare={true}
						hidePadding={true}
						tooltip-content={CLOSE}
						configAria={{
							role: 'button'
						}}
					/>
				</div>

				{translatedText?.text ? (
					<div className="sn-record-dts-response">
						{!isHTML ? (
							translatedText.text
						) : (
							<now-rich-text
								id="richTextId-component-dts"
								html={translatedText.text}
							/>
						)}{' '}
					</div>
				) : (
					[]
				)}
			</div>
		);
	}
};

const renderTextLink = label => {
	return (
		<now-text-link
			label={label}
			href="javascript:;"
			variant="secondary"
			configAria={{
				role: 'button'
			}}
		/>
	);
};

export const renderTranslateIcon = (props, dispatch, updateState, isHTML) => {
	return (
		<sn-record-control
			icon="translated-text-fill"
			tooltip={TRANSLATE}
			slot="controls"
			onClick={() => {
				handleDynamicTranslationClick(props, dispatch, updateState, isHTML);
				// language here will be null , Since it is still not identified
				trackDynamicTranslationEvents(
					METRICS_TRANSLATE_BUTTON_CLICKED,
					{
						record: props.referringRecordId,
						fieldType: props.fieldType,
						language: null
					},
					dispatch
				);
			}}
		/>
	);
};

export { translationBehavior, isEnabledBehavior };
