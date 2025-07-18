import '@devsnc/sn-form-controls';
import '@devsnc/sn-record-annotation';
import '@devsnc/sn-record-email';
import '@devsnc/sn-record-input-connected';
import '@devsnc/sn-record-reference-connected';
import '@devsnc/sn-record-tablename-connected';
import '@devsnc/sn-record-url';
import '@servicenow/now-button';
import '@servicenow/now-loader';
import '@servicenow/now-record-date-picker';
import '@servicenow/now-record-number';

import {
	findAllTabbableElements,
	findFirstTabbableElement
} from '@devsnc/sn-list-commons';
import {
	NOW_GRID_CLOSE_POPOVER,
	NOW_GRID_SET_IGNORE_POPOVER_CLOSE
} from '@servicenow/now-grid';
import {actionTypes, createCustomElement} from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';
import find from 'lodash/find';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import moment from 'moment';
import {t} from 'sn-translate';
import {getProperty} from 'sn-uxpage-presource';

import {
	BUTTON_CLICKED,
	CLICK,
	DATE_VALUE_CHANGED,
	DURATION_VALUE_CHANGED,
	INLINE_EDITING_PREFETCH_REQUEST,
	INLINE_EDITING_WRITE_REQUEST,
	INPUT_VALUE_CHANGED,
	LIST_TYPE_TAGS,
	MODAL_ACTIONS,
	NOW_POPOVER_CONTENT_HIDDEN,
	NOW_POPOVER_CONTENT_VISIBLE,
	NOW_POPOVER_OPENED_SET,
	NOW_RECORD_LIST_CONNECTED_REFERENCE_CONNECTED,
	NOW_RECORD_MINI_CALENDAR_OK,
	NUMBER_VALUE_CHANGED,
	PHONE_STAGED_VALUE_CHANGED,
	PHONE_VALUE_CHANGED,
	REFERENCE_VALUE_CHANGED,
	SEISMIC_HOIST
} from '../../constants';
import * as FieldType from '../../fieldType';

import styles from './styles.scss';
import {getInlineAnnotations} from './utils';

const {COMPONENT_BOOTSTRAPPED} = actionTypes;

export const INLINE_EDIT_COMPONENT_NAME = 'sn-record-list-inline-editor';
const phoneControlName = 'sn-record-phone-connected';
const saveComponentName = 'OK';
const cancelComponentName = 'CANCEL';

const cancelAriaConfig = {'aria-label': t('Cancel')};
const okAriaConfig = {'aria-label': t('Ok')};

const cancelTranslated = t('Cancel');
const okTranslated = t('Ok');

const getFormControlValue = (fieldType, stagedValue, value) => {
	switch (fieldType) {
		case FieldType.PHONE_NUMBER_E164:
		case FieldType.PHONE:
			return stagedValue;
		default:
			return stagedValue || value;
	}
};

export const view = (state, {dispatch, updateProperties, updateState}) => {
	const {
		saving,
		pendingDurationValue,
		pendingDateValue,
		pendingPhoneValue,
		error,
		properties: {
			allColumns,
			displayValue,
			fieldName,
			fieldType,
			label,
			recordSysId,
			tableName,
			value,
			popoverStyle,
			tableMetadata,
			prefetchData: {
				canListEdit = false,
				stagedValue = '',
				stagedDisplayValue = '',
				verifiedTable = '',
				verifiedColumn = '',
				verifiedSysId = '',
				verifiedSysIds = [],
				numRecords,
				numEditableRecords,
				numVerifiedRecords,
				phoneCurrentCountry = '',
				phoneCountryCodes = []
			}
		},
		nestedPopoverOpen = false
	} = state;

	if (saving) {
		const loaderStyle = {
			...popoverStyle,
			display: 'flex',
			'align-items': 'center',
			'justify-content': 'center'
		};
		return (
			<div style={loaderStyle}>
				<now-loader />
			</div>
		);
	}

	const columnMetadata = allColumns.get(fieldName);
	const isMultiText = get(columnMetadata, 'columnData.isMultiText', false);

	const {Control, props} = getFormControl({
		displayValue: displayValue || stagedDisplayValue,
		fieldName: verifiedColumn || fieldName,
		fieldType,
		label,
		recordSysId: verifiedSysId || recordSysId,
		tableName: verifiedTable || tableName,
		value: getFormControlValue(fieldType, stagedValue, value),
		dispatch,
		updateProperties,
		canListEdit,
		tableMetadata,
		pendingDurationValue,
		pendingDateValue,
		pendingPhoneValue,
		error,
		phoneCurrentCountry,
		phoneCountryCodes,
		isMultiText
	});

	const annotations = getInlineAnnotations(
		numRecords,
		numEditableRecords,
		numVerifiedRecords
	);

	const useEditorWithOkCancelButtons = useOkCancelButtons(fieldType, Control);
	const className = useEditorWithOkCancelButtons
		? 'sn-inline-editor-with-ok-cancel'
		: 'sn-inline-editor';

	const isSubmittingPhone = (path, key) => {
		return path[0].type == 'tel' && key === 'Enter';
	};

	const isEditingPhone = () => {
		return isEmpty(error) && !isEmpty(pendingPhoneValue);
	};

	const handleControlFocus = (fieldType, element) => {
		const firstTab = findFirstTabbableElement(element);

		if (firstTab) {
			switch (fieldType) {
				case FieldType.PHONE:
					firstTab.focus();
					if (canListEdit && !isEditingPhone()) firstTab.select();
					break;
				case FieldType.PHONE_NUMBER_E164:
					if (isEditingPhone()) {
						const tabbies = findAllTabbableElements(element);
						if (tabbies.length > 1) tabbies[1].focus();
					} else {
						firstTab.focus();
					}
					break;
				default:
					if (canListEdit) {
						if (firstTab.value.length === 1) {
							firstTab.focus();
						} else {
							firstTab.select();
						}
					}
					break;
			}
		}
	};

	const onKeyDown = e => {
		e.stopPropagation();

		// only fieldType = `glide_date_time` or `reference` have a button component in addition to the dateTime/reference component.
		// This check will restrict writing to these field and clearing the values unintentionally
		const path = e.composedPath ? e.composedPath() : e.path;
		const isLastPathButton = path[0].nodeName === 'BUTTON';

		const isReferenceType = fieldType === 'reference';

		const inputValue = path[0].value;

		if (
			isDurationField(fieldType) &&
			useOkCancelButtons(fieldType, Control) &&
			e.key == 'Enter'
		) {
			clickOkButton(path);
			return;
		}

		if (isPhoneField(fieldType) && useOkCancelButtons(fieldType, Control)) {
			if (isSubmittingPhone(path, e.key)) {
				clickOkButton(path);
			} else if (
				e.key === 'Tab' &&
				path[0].className === 'sn-record-choice-search-trigger'
			) {
				const phoneControl = find(path, item => {
					return item.nodeName === 'SN-RECORD-PHONE-CONNECTED';
				});
				phoneControl.shadowRoot.querySelector('input').focus();
			}
			return;
		} else if (
			e.key !== 'Enter' ||
			(e.key === 'Enter' && e.shiftKey) ||
			isLastPathButton
		) {
			return;
		}
		// if the field is of reference type and the user input is not an empty string, we will close the popover,
		// otherwise, if the inputValue is an empty string, the reference field will be saved to be empty
		//
		else if (isReferenceType && inputValue !== '') {
			if (!nestedPopoverOpen) {
				dispatch(NOW_GRID_CLOSE_POPOVER, {setParentFocus: true});
			}
			return;
		}

		saveValues({
			dispatch,
			updateState,
			verifiedColumn,
			verifiedSysIds,
			verifiedTable,
			value: inputValue,
			fieldType
		});
	};

	return !isEmpty(Control) && canListEdit != undefined ? (
		<div className={className}>
			<div style={popoverStyle}>
				<Control
					on-keydown={onKeyDown}
					ref={element => {
						handleControlFocus(fieldType, element);
					}}
					{...props}
				/>
			</div>

			{!isEmpty(annotations) ? (
				<div style={popoverStyle}>
					<sn-record-annotation important>{annotations}</sn-record-annotation>
				</div>
			) : null}

			{useEditorWithOkCancelButtons ? (
				<div className={'dependent-field-buttons-container'}>
					<now-button
						tooltip-content={cancelTranslated}
						className="clear-button"
						variant="tertiary"
						config-aria={cancelAriaConfig}
						size="sm"
						label={cancelTranslated}
						component-name={cancelComponentName}
					/>
					<now-button
						tooltip-content={okTranslated}
						className="apply-button"
						variant="secondary"
						config-aria={okAriaConfig}
						size="sm"
						label={okTranslated}
						component-name={saveComponentName}
						disabled={!canListEdit}
					/>
				</div>
			) : null}
		</div>
	) : null;
};

const useOkCancelButtons = (fieldType, Control) => {
	switch (fieldType) {
		case FieldType.DATE:
		case FieldType.DATE_TIME:
		case FieldType.DURATION:
		case FieldType.PHONE_NUMBER_E164:
			return true;
		case FieldType.PHONE:
			return Control === phoneControlName;
		default:
			return false;
	}
};

const saveValues = ({
	dispatch,
	updateState,
	verifiedColumn,
	verifiedSysIds,
	verifiedTable,
	value
}) => {
	updateState({saving: true});

	const newInlineValue = [
		{
			column: verifiedColumn,
			value: value
		}
	];

	dispatch(INLINE_EDITING_WRITE_REQUEST, {
		sysIds: verifiedSysIds,
		table: verifiedTable,
		multiRowInlineValue: newInlineValue
	});
};

const getFormControl = ({
	displayValue,
	fieldName,
	fieldType,
	label,
	recordSysId,
	tableName,
	value,
	canListEdit,
	tableMetadata,
	error,
	pendingDurationValue,
	pendingDateValue,
	pendingPhoneValue,
	phoneCurrentCountry,
	phoneCountryCodes,
	dispatch,
	isMultiText
}) => {
	let Control = '';
	let controlProps = {};
	const commonProps = {
		autofocus: 'true',
		className: 'inline-editor-input',
		displayValue,
		initialValue: displayValue,
		recordSysId,
		value,
		messages: isEmpty(error) ? [] : [error],
		readonly: !canListEdit
	};

	const declarativeActionsProps = canListEdit
		? {
				declarativeUiActions: [],
				referringRecordId: recordSysId,
				referringTable: tableName,
				serializedChanges: '{}'
		  }
		: {};

	switch (fieldType) {
		case FieldType.DATE_TIME: {
			Control = 'now-record-date-picker';
			const dateFormat =
				get(tableMetadata, 'dateFormat', 'YYYY-MM-DD').toUpperCase() +
				' ' +
				get(tableMetadata, 'timeFormat', 'HH:mm:ss');

			controlProps = {
				hasTimePicker: true,
				value: isEmpty(pendingDateValue)
					? displayValue.toLowerCase()
					: pendingDateValue.toLowerCase(),
				format: dateFormat
			};
			break;
		}
		case FieldType.DATE: {
			Control = 'now-record-date-picker';
			const dateFormat = get(
				tableMetadata,
				'dateFormat',
				'YYYY-MM-DD'
			).toUpperCase();
			controlProps = {
				value: isEmpty(pendingDateValue) ? displayValue : pendingDateValue,
				format: dateFormat
			};
			break;
		}
		case FieldType.STRING: {
			Control = 'sn-record-input-connected';
			controlProps = {
				type: isMultiText ? 'textarea' : ''
			};
			break;
		}
		case FieldType.URL: {
			Control = 'sn-record-url';
			break;
		}

		case FieldType.DECIMAL:
		case FieldType.FLOAT: {
			Control = 'now-record-number';
			controlProps = {
				decimal: true,
				integer: false
			};
			break;
		}
		case FieldType.INTEGER: {
			Control = 'now-record-number';
			controlProps = {
				decimal: false,
				integer: true
			};
			break;
		}
		case FieldType.DURATION: {
			Control = 'sn-record-duration';
			controlProps = {
				value: isEmpty(pendingDurationValue)
					? normalizeDurationValue(value)
					: pendingDurationValue,
				maxUnit: 'days'
			};
			break;
		}

		case FieldType.REFERENCE: {
			if (canListEdit) {
				declarativeActionsProps.declarativeUiActions.push({
					name: 'reference_search',
					icon: 'magnifying-glass-outline',
					label: t('Search For Record'),
					dependency: '',
					requiresValue: false,
					order: 0,
					conditions: '',
					actionType: 'action_component',
					actionComponent: 'sn-declarative-reference-search',
					actionDispatch: '',
					actionPayload: '',
					actionAttributes: `{"context":"", "label":"${label}"}`,
					groupBy: false,
					group: '',
					confirmationRequired: false,
					confirmationMessage: '',
					tooltip: t('Search for Record'),
					modelConditions: [],
					payloadMap: []
				});
			}
			Control = 'sn-record-reference-connected';
			controlProps = {
				fieldName,
				tableName,
				recordSysId,
				name: fieldName,
				value,
				required: 'false',
				invalid: false,
				fieldType,
				resultLimit: 25,
				maxSearchMatches: 250,
				searchCancelable: true,
				searchUsingStartsWith: false,
				searchOnClick: true,
				referenceAddonReadonly: false,
				disableDisplayValueWarning: true,
				displayValue,
				declarativeActionsProps
			};
			break;
		}
		case FieldType.TABLE_NAME: {
			Control = 'sn-record-tablename-connected';
			controlProps = {
				name: fieldName,
				tableName,
				value,
				isSearching: false,
				displayValue,
				resultLimit: 25,
				searchUsingStartsWith: true,
				searchOnClick: true,
				disableDisplayValueWarning: false,
				required: 'false',
				readonly: 'false',
				invalid: false,
				reversed: false,
				referringRecordId: recordSysId,
				dictionaryAttributes: {
					shortList: true,
					canRead: false,
					includeDefault: false,
					selectedOnly: false,
					noViews: false,
					noSystemTables: false,
					filterEntitledTables: false,
					showTableNames: false,
					showTableNamesOnLabel: false,
					skipRoot: false,
					allowPublic: false
				}
			};
			break;
		}
		case FieldType.EMAIL: {
			Control = 'sn-record-email';
			controlProps = {
				name: 'email',
				fieldType: 'email',
				autofocus: false, // remove once form controls fixes DEF0211670
				hideEmailIcon: true
			};
			break;
		}
		case FieldType.PHONE: {
			const formatPhone = getProperty('glide.ui.format_phone', true);
			const formatUsPhone = formatPhone === true || formatPhone === 'true';
			if (!formatUsPhone) {
				Control = 'sn-record-input-connected';
				break;
			}

			const editorValue = isEmpty(pendingPhoneValue)
				? displayValue
				: pendingPhoneValue;

			if (
				canListEdit &&
				isEmpty(declarativeActionsProps.declarativeUiActions)
			) {
				declarativeActionsProps.declarativeUiActions.push({
					name: fieldName,
					referringRecordId: recordSysId,
					referringTable: tableName,
					value: editorValue,
					displayValue: editorValue,
					tableName,
					fieldName,
					recordSysId
				});
			}

			Control = phoneControlName;
			controlProps = {
				name: fieldName,
				tableName,
				formData: {
					classicForm: true
				},
				fieldType,
				formatUsPhone: true,
				phoneAddon: false,
				declarativeActionsProps,
				value: editorValue,
				displayValue: editorValue,
				initialValue: editorValue,
				onValueChange: (e, name, value, displayValue, error) => {
					dispatch(PHONE_VALUE_CHANGED, {
						name,
						value,
						displayValue,
						error
					});
				},
				onStagedValueChange: (e, name, value) => {
					if (!isEmpty(error)) {
						dispatch(PHONE_STAGED_VALUE_CHANGED, {
							name,
							value
						});
					}
				}
			};
			break;
		}
		case FieldType.PHONE_NUMBER_E164: {
			const editorValue = isEmpty(pendingPhoneValue)
				? value
				: pendingPhoneValue;

			if (isEmpty(declarativeActionsProps.declarativeUiActions)) {
				declarativeActionsProps.declarativeUiActions.push({
					name: fieldName,
					referringRecordId: recordSysId,
					referringTable: tableName,
					value: editorValue,
					displayValue: editorValue,
					tableName,
					fieldName,
					recordSysId
				});
			}

			Control = phoneControlName;
			controlProps = {
				name: fieldName,
				defaultCode: get(phoneCountryCodes, '0.code', '1'),
				tableName,
				countryCode: phoneCurrentCountry,
				countryCodes: phoneCountryCodes,
				formData: {
					classicForm: true
				},
				fieldType,
				formatUsPhone: true,
				phoneAddon: false,
				declarativeActionsProps,
				value: editorValue,
				displayValue: editorValue,
				initialValue: editorValue,
				onValueChange: (e, name, value, displayValue, error) => {
					dispatch(PHONE_VALUE_CHANGED, {
						name,
						value,
						displayValue,
						error
					});
				},
				onStagedValueChange: (e, name, value) => {
					if (!isEmpty(error)) {
						dispatch(PHONE_STAGED_VALUE_CHANGED, {
							name,
							value
						});
					}
				}
			};
			break;
		}
		default: {
			break;
		}
	}

	return {
		Control,
		props: Object.assign({}, commonProps, controlProps)
	};
};

const normalizeDurationValue = value => {
	const dateValue = moment(value, 'YYYY-MM-DD hh:mm:ss', true);

	if (dateValue.isValid()) {
		const days = dateValue.diff(moment('1970-01-01'), 'days');
		value = `${days} ${dateValue.format('hh:mm:ss').toString()}`;
	}

	return value;
};

const inputClickHandler = ({action, dispatch}) => {
	const event = get(action, 'payload.event', {});
	const path = event.composedPath ? event.composedPath() : event.path;

	if (
		!path.some(item => {
			return (
				item.localName === INLINE_EDIT_COMPONENT_NAME ||
				item.localName === LIST_TYPE_TAGS.REFERENCE ||
				item.tagName === SEISMIC_HOIST
			);
		})
	) {
		dispatch(NOW_GRID_CLOSE_POPOVER, {setParentFocus: false});
	}
};

const bootstrapEffect = ({state, dispatch}) => {
	const {
		tableName,
		fieldName,
		selectedSysIds,
		recordSysId,
		fieldType
	} = state.properties;
	dispatch(INLINE_EDITING_PREFETCH_REQUEST, {
		table: tableName,
		column: fieldName,
		sysIds: selectedSysIds,
		selectedSysId: recordSysId,
		fieldType
	});
};

const valueChangedEffect = ({
	dispatch,
	action,
	properties,
	state,
	updateState
}) => {
	const {
		displayValue: previousDisplayValue,
		value: previousValue,
		prefetchData: {verifiedSysIds, verifiedTable, verifiedColumn}
	} = properties;
	const {pendingDateValue} = state;
	const {
		payload: {value: payloadValue}
	} = action;
	const value = pendingDateValue ? pendingDateValue : payloadValue;
	if (
		isEmpty(value) ||
		value === previousValue ||
		value === previousDisplayValue
	) {
		return;
	}

	updateState({saving: true});

	const newInlineValue = [
		{
			column: verifiedColumn,
			value
		}
	];

	dispatch(INLINE_EDITING_WRITE_REQUEST, {
		sysIds: verifiedSysIds,
		table: verifiedTable,
		multiRowInlineValue: newInlineValue
	});
};

const dateValueChangedEffect = ({action, updateState}) => {
	const {payload} = action;
	const {error, value} = payload;

	isEmpty(error)
		? updateState({pendingDateValue: value})
		: updateState({error: error, pendingDateValue: ''});
};

const durationValueChangedEffect = ({action, updateState}) => {
	const {payload} = action;
	const {error, value} = payload;

	isEmpty(error)
		? updateState({pendingDurationValue: value})
		: updateState({error: error, pendingDurationValue: ''});
};

const isDurationField = fieldType => {
	return fieldType == FieldType.DURATION;
};

const phoneStagedValueChangedEffect = ({action, properties, updateState}) => {
	const {fieldType} = properties;
	const {
		payload: {value}
	} = action;

	if (fieldType == FieldType.PHONE_NUMBER_E164) {
		updateState({error: ''});
	} else if (fieldType == FieldType.PHONE) {
		updateState({error: '', pendingPhoneValue: value});
	}
};

const phoneValueChangedEffect = ({action, properties, updateState}) => {
	const {fieldType} = properties;

	if (!isPhoneField(fieldType)) return;

	const {payload} = action;
	const {error, displayValue, value} = payload;

	if (fieldType == FieldType.PHONE_NUMBER_E164) {
		updateState({error: isEmpty(error) ? '' : error, pendingPhoneValue: value});
	} else if (fieldType == FieldType.PHONE) {
		updateState({
			error: isEmpty(error) ? '' : error,
			pendingPhoneValue: displayValue
		});
	}
};

const isPhoneField = fieldType => {
	return (
		fieldType == FieldType.PHONE || fieldType == FieldType.PHONE_NUMBER_E164
	);
};

const clickOkButton = path => {
	path[0].blur();
	const editorContainer = find(path, item => {
		return item.className === 'sn-inline-editor-with-ok-cancel';
	});
	if (editorContainer) {
		const okButton = editorContainer.querySelector('.apply-button');
		setTimeout(() => {
			okButton.shadowRoot.querySelector('.now-button').click();
		});
	}
};
createCustomElement(INLINE_EDIT_COMPONENT_NAME, {
	renderer: {
		type: snabbdom,
		view
	},
	initialState: {
		saving: false
	},
	properties: {
		popoverStyle: {default: ''},
		displayValue: {default: ''},
		fieldName: {default: ''},
		fieldType: {default: ''},
		label: {default: ''},
		recordSysId: {default: ''},
		tableName: {default: ''},
		value: {default: ''},
		selectedSysIds: {default: []},
		allColumns: {default: new Map()},
		prefetchData: {default: {}},
		tableMetadata: {default: {}}
	},
	eventHandlers: [
		{
			events: [CLICK],
			effect: inputClickHandler,
			target: document
		}
	],
	actionHandlers: {
		[COMPONENT_BOOTSTRAPPED]: {
			effect: bootstrapEffect,
			stopPropagation: true
		},
		[DATE_VALUE_CHANGED]: {
			effect: dateValueChangedEffect,
			stopPropagation: true
		},
		[NUMBER_VALUE_CHANGED]: {
			stopPropagation: true
		},
		[INPUT_VALUE_CHANGED]: {
			stopPropagation: true
		},
		[NOW_RECORD_MINI_CALENDAR_OK]: {
			effect: valueChangedEffect,
			stopPropagation: true
		},
		[REFERENCE_VALUE_CHANGED]: {
			effect: valueChangedEffect,
			stopPropagation: true
		},
		[DURATION_VALUE_CHANGED]: {
			effect: durationValueChangedEffect,
			stopPropagation: true
		},
		[PHONE_VALUE_CHANGED]: {
			effect: phoneValueChangedEffect,
			stopPropagation: true
		},
		[PHONE_STAGED_VALUE_CHANGED]: {
			effect: phoneStagedValueChangedEffect,
			stopPropagation: true
		},
		[BUTTON_CLICKED]: {
			effect: ({dispatch, action, state, updateState}) => {
				const {
					meta: {componentName}
				} = action;

				const {
					pendingDurationValue,
					pendingDateValue,
					pendingPhoneValue,
					error,
					properties: {
						prefetchData: {verifiedTable, verifiedColumn, verifiedSysIds},
						fieldType
					}
				} = state;

				switch (componentName) {
					case saveComponentName: {
						let updatedValue;
						//do we need 3 different variables for pending values??
						if (fieldType === FieldType.DURATION) {
							updatedValue = pendingDurationValue;
						} else if (isPhoneField(fieldType)) {
							if (!isEmpty(error)) return;
							updatedValue = pendingPhoneValue;
						} else {
							updatedValue = pendingDateValue;
						}
						saveValues({
							dispatch,
							updateState,
							verifiedColumn,
							verifiedSysIds,
							verifiedTable,
							value: updatedValue
						});
						break;
					}
					case cancelComponentName:
						dispatch(NOW_GRID_CLOSE_POPOVER, {setParentFocus: true});
						break;
					default:
						break;
				}
			},
			stopPropagation: true
		},
		[NOW_RECORD_LIST_CONNECTED_REFERENCE_CONNECTED]: {
			effect: coeffects => {
				const {
					properties: {fieldType},
					dispatch
				} = coeffects;
				// Sadly another hack. This and MODAL_ACTIONS.OPENED_SET are handling the edge case where the related list for
				// a reference picker is opened in a modal. Pressing the escape key in the modal would trigger the inline popover
				// to close without this dispatch
				const isReference = fieldType === FieldType.REFERENCE;
				if (isReference) {
					dispatch(NOW_GRID_SET_IGNORE_POPOVER_CLOSE, {value: true});
				}
			},
			stopPropagation: true
		},
		[MODAL_ACTIONS.OPENED_SET]: {
			effect: coeffects => {
				const {
					properties: {fieldType},
					dispatch
				} = coeffects;
				const isReference = fieldType === FieldType.REFERENCE;
				if (isReference) {
					dispatch(NOW_GRID_SET_IGNORE_POPOVER_CLOSE, {value: false});
				}
			},
			stopPropagation: true
		},
		[NOW_POPOVER_OPENED_SET]: {
			stopPropagation: true
		},
		[NOW_POPOVER_CONTENT_VISIBLE]: {
			effect: coeffects => {
				const {
					action: {
						payload: {id}
					},
					updateState
				} = coeffects;
				// this handles the case of if the dropdown-list is open in the reference picker
				// when pressing enter the key in the dropdown we don't want it to close the inline editor
				// popover immediately, it should be showing the saving indicator, so this flag is added to
				// keep track of whether a nested popover is open or not
				if (id === 'now-dropdown-list') {
					updateState({
						path: 'nestedPopoverOpen',
						value: true,
						operation: 'set'
					});
				}
			},
			stopPropagation: true
		},
		[NOW_POPOVER_CONTENT_HIDDEN]: {
			effect: coeffects => {
				const {
					action: {
						payload: {id}
					},
					updateState
				} = coeffects;
				if (id === 'now-dropdown-list') {
					updateState({
						path: 'nestedPopoverOpen',
						value: false,
						operation: 'set'
					});
				}
			},
			stopPropagation: true
		}
	},
	styles
});
