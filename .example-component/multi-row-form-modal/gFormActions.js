import _ from 'lodash';

export const GFORM_SET_VALUE = 'GFORM#SET_VALUE';

export const GFORM_ADD_INFO_MESSAGE = 'GFORM#ADD_INFO_MESSAGE';
export const GFORM_ADD_WARNING_MESSAGE = 'GFORM#ADD_WARNING_MESSAGE';
export const GFORM_ADD_ERROR_MESSAGE = 'GFORM#ADD_ERROR_MESSAGE';
export const GFORM_CLEAR_MESSAGE = 'GFORM#CLEAR_MESSAGE';

export const GFORM_SHOW_FIELD_MESSAGE = 'GFORM#SHOW_FIELD_MESSAGE';
export const GFORM_HIDE_FIELD_MESSAGE = 'GFORM#HIDE_FIELD_MESSAGE';

export const GFORM_SET_VISIBLE = 'GFORM#SET_VISIBLE';
export const GFORM_SET_READ_ONLY = 'GFORM#SET_READ_ONLY';
export const GFORM_SET_MANDATORY = 'GFORM#SET_MANDATORY';

export const GFORM_SUBMIT = 'GFORM#SUBMIT';

export const GFORM_CLEAR_OPTIONS = 'GFORM#CLEAR_OPTIONS';
export const GFORM_ADD_OPTION = 'GFORM#ADD_OPTION';
export const GFORM_REMOVE_OPTION = 'GFORM#REMOVE_OPTION';

export const GFORM_ENABLE_ATTACHMENTS = 'GFORM#ENABLE_ATTACHMENTS';
export const GFORM_DISABLE_ATTACHMENTS = 'GFORM#DISABLE_ATTACHMENTS';

export const GFORM_INTERNAL_CLEAR_OPTION_STACK =
	'GFORM_INTERNAL#CLEAR_OPTION_STACK';
export const GFORM_INTERNAL_SET_FIELD_INVALID =
	'GFORM_INTERNAL#SET_FIELD_INVALID';

export const GFORM_INTERNAL_SET_ADDITIONAL_FIELD_STATE =
	'GFORM#SET_ADDITIONAL_FIELD_STATE';

export const GFORM_INTERNAL_BATCH_ACTIONS = 'GFORM_INTERNAL#BATCH_ACTIONS';

const getProps = (state, properties, prop) => {
	return state[prop] || properties[prop];
};

const getGForm = (state, properties) =>
	(state.glideEnvironment && state.glideEnvironment.gForm) ||
	getProps(state, properties, 'gForm');

export const getGFormAttributes = (state, properties) => {
	const gForm = getGForm(state, properties);
	if (!gForm) {
		return {};
	}

	const isAttachmentUploadDisabled = gForm.isAttachmentUploadDisabled();
	const serializedChanges = JSON.stringify(gForm.serialize(true));
	const { formData } = state;
	const encodedRecord = formData.layout.encodedRecord;
	return {
		isAttachmentUploadDisabled,
		serializedChanges,
		encodedRecord
	};
};

const primitiveActionHandlers = {
	/**
	 * Update a glide form field value
	 * @type {string} fieldName - name of the field to set value
	 * @type {string} value - value to set
	 * @type {string} [displayValue] - display value to set
	 */
	[GFORM_SET_VALUE]: ({ state, properties, action }) => {
		action.stopPropagation();
		const gForm = getGForm(state, properties);

		if (!gForm || !gForm.setUserValue) {
			return;
		}
		let {
			payload: { fieldName, value, displayValue }
		} = action;
		// When there is no display value, assign value
		if (!displayValue) {
			displayValue = value;
		}
		// ignore if there is no change
		if (
			gForm.getValue(fieldName) === value &&
			gForm.getDisplayValue(fieldName) === displayValue
		) {
			return;
		}
		gForm.setUserValue(fieldName, value, displayValue);
	},
	/**
	 * Displays an informational message at the top of the form
	 * @type {string} message - info message to display
	 */
	[GFORM_ADD_INFO_MESSAGE]: ({ state, properties, action }) => {
		action.stopPropagation();
		const gForm = getGForm(state, properties);
		if (!gForm || !gForm.addInfoMessage) {
			return;
		}

		const {
			payload: { message }
		} = action;
		gForm.addInfoMessage(message);
	},
	/**
	 * Displays an warning message at the top of the form
	 * @type {string} message - a warning message to be displayed
	 */
	[GFORM_ADD_WARNING_MESSAGE]: ({ state, properties, action }) => {
		action.stopPropagation();
		const gForm = getGForm(state, properties);
		if (!gForm || !gForm.addWarningMessage) {
			return;
		}

		const {
			payload: { message }
		} = action;
		gForm.addWarningMessage(message);
	},
	/**
	 * Displays an error message at the top of the form
	 * @type {string} message - error message
	 */
	[GFORM_ADD_ERROR_MESSAGE]: ({ state, properties, action }) => {
		action.stopPropagation();
		const gForm = getGForm(state, properties);
		if (!gForm || !gForm.addErrorMessage) {
			return;
		}

		const {
			payload: { message }
		} = action;
		gForm.addErrorMessage(message);
	},
	/**
	 * Removes all information and error messages at the top of the form
	 */
	[GFORM_CLEAR_MESSAGE]: ({ state, properties, action }) => {
		action.stopPropagation();
		const gForm = getGForm(state, properties);
		if (!gForm || !gForm.clearMessages) {
			return;
		}

		gForm.clearMessages();
	},
	/**
	 * Trigger form submission using the given ui-action name
	 * @type {string} submitActionName - name of action to execute
	 * @type {callback}
	 */
	[GFORM_SUBMIT]: ({ state, properties, action }) => {
		action.stopPropagation();
		const gForm = getGForm(state, properties);
		if (!gForm || !gForm.submit) {
			return;
		}

		const {
			payload: { submitActionName },
			meta: { callback }
		} = action;
		const result = gForm.submit(submitActionName);
		if (callback) {
			callback(result);
		}
	},
	/**
	 * Shows a message next to the field
	 * @type {string} fieldName - name of the field to show text message
	 * @type {string} message - text message
	 * @type {('info'|'warning'|'error')} [type='info'] - type of message
	 */
	[GFORM_SHOW_FIELD_MESSAGE]: ({ state, properties, action }) => {
		action.stopPropagation();
		const gForm = getGForm(state, properties);
		if (!gForm || !gForm.showFieldMsg) {
			return;
		}

		const {
			payload: { fieldName, message, type }
		} = action;
		gForm.showFieldMsg(fieldName, message, type);
	},
	/**
	 * Hides the first (oldest) message by a field
	 * @type {string} fieldName - name of the field
	 * @type {boolean} [clearAll] - clear all the messages if true
	 */
	[GFORM_HIDE_FIELD_MESSAGE]: ({ state, properties, action }) => {
		action.stopPropagation();
		const gForm = getGForm(state, properties);
		if (!gForm || !gForm.hideFieldMsg) {
			return;
		}

		const {
			payload: { fieldName, clearAll }
		} = action;
		gForm.hideFieldMsg(fieldName, clearAll);
	},
	/**
	 * Sets the field visible if true. Makes the field hidden if false.
	 * @type fieldName - name of the field to set visible
	 * @type visibility - if true, set the given field visible
	 */
	[GFORM_SET_VISIBLE]: ({ state, properties, action }) => {
		action.stopPropagation();
		const gForm = getGForm(state, properties);
		if (!gForm || !gForm.setVisible) {
			return;
		}

		const {
			payload: { fieldName, isVisible }
		} = action;
		gForm.setVisible(fieldName, isVisible);
	},
	/**
	 * Makes the field read-only if true. Makes the field editable if false.
	 * @note: Best Practice: Use UI Policy rather than this method whenever possible.
	 * @type {string} fieldName - name of the field to set readonly
	 * @type {boolean} readonly - if true, set the given field read only
	 */
	[GFORM_SET_READ_ONLY]: ({ state, properties, action }) => {
		action.stopPropagation();
		const gForm = getGForm(state, properties);
		if (!gForm || !gForm.setReadOnly) {
			return;
		}

		const {
			payload: { fieldName, readonly }
		} = action;
		gForm.setReadOnly(fieldName, readonly);
	},
	/**
	 * Makes the field required if true. Makes the field optional if false.
	 * @note Best Practice: Use UI Policy rather than this method whenever possible.
	 * @type {string} fieldName - name of the field
	 * @type {boolean} mandatory - if true set the given field madatory
	 */
	[GFORM_SET_MANDATORY]: ({ state, properties, action }) => {
		action.stopPropagation();
		const gForm = getGForm(state, properties);
		if (!gForm || !gForm.setMandatory) {
			return;
		}

		const {
			payload: { fieldName, isMandatory }
		} = action;
		gForm.setMandatory(fieldName, isMandatory);
	},
	/**
	 * Clears all options for a choice list
	 * @type {string} fieldName - the field name to add the option to
	 */
	[GFORM_CLEAR_OPTIONS]: ({ state, properties, action }) => {
		action.stopPropagation();
		const gForm = getGForm(state, properties);
		if (!gForm || !gForm.clearOptions) {
			return;
		}

		const {
			payload: { fieldName }
		} = action;
		gForm.clearOptions(fieldName);
	},
	/**
	 * Adds an option to a choice type
	 * @type {string} fieldName - field name to add the option to
	 * @type {string} choiceValue - value of the option
	 * @type {string} choiceLabel - label of the option
	 * @type {number} [choiceIndex] - index to insert the option at
	 */
	[GFORM_ADD_OPTION]: ({ state, properties, action }) => {
		action.stopPropagation();
		const gForm = getGForm(state, properties);
		if (!gForm || !gForm.addOption) {
			return;
		}

		const {
			payload: { fieldName, choiceValue, choiceLabel, choiceIndex }
		} = action;
		gForm.addOption(fieldName, choiceValue, choiceLabel, choiceIndex);
	},
	/**
	 * Removes an option from a choice list
	 * @type {string} fieldName - the field name to add the option to
	 * @type {string} choiceValue - the value of the option
	 */
	[GFORM_REMOVE_OPTION]: ({ state, properties, action }) => {
		action.stopPropagation();
		const gForm = getGForm(state, properties);
		if (!gForm || !gForm.removeOption) {
			return;
		}

		const {
			payload: { fieldName, choiceValue }
		} = action;
		gForm.removeOption(fieldName, choiceValue);
	},
	/**
	 * enable upload attachments
	 */
	[GFORM_ENABLE_ATTACHMENTS]: ({
		state,
		properties,
		action,
		updateProperties
	}) => {
		action.stopPropagation();
		const gForm = getGForm(state, properties);
		if (!gForm || !gForm.enableAttachments) {
			return;
		}
		gForm.enableAttachments();
		const { attachmentDetails = {} } = properties;
		updateProperties({
			attachmentDetails: {
				...attachmentDetails,
				disabled: false
			}
		});
	},
	/**
	 * disable upload attachments
	 */
	[GFORM_DISABLE_ATTACHMENTS]: ({
		state,
		properties,
		action,
		updateProperties
	}) => {
		action.stopPropagation();
		const gForm = getGForm(state, properties);
		if (!gForm || !gForm.disableAttachments) {
			return;
		}

		gForm.disableAttachments();

		const { attachmentDetails = {} } = properties;
		updateProperties({
			attachmentDetails: {
				...attachmentDetails,
				disabled: false
			}
		});
	},
	/**
	 * Resets the optionStack of the field to empty stack
	 * @type {string} fieldName - the field name to clear optionStack
	 */
	[GFORM_INTERNAL_CLEAR_OPTION_STACK]: ({ state, properties, action }) => {
		action.stopPropagation();
		const gForm = getGForm(state, properties);
		if (!gForm || !gForm.$private || !gForm.$private.clearOptionStack) {
			return;
		}

		const {
			payload: { fieldName }
		} = action;
		gForm.$private.clearOptionStack(fieldName);
	},
	/**
	 * Sets the field invalid if true.
	 * @type {string} fieldName - name of the filed to set invalid
	 * @type {boolean} isInvalid - if true set field invalid
	 */
	[GFORM_INTERNAL_SET_FIELD_INVALID]: ({ state, properties, action }) => {
		action.stopPropagation();
		const gForm = getGForm(state, properties);
		if (!gForm || !gForm.$private || !gForm.$private.setFieldInvalid) {
			return;
		}

		const {
			payload: { fieldName, isInvalid }
		} = action;
		gForm.$private.setFieldInvalid(fieldName, isInvalid);
	},
	[GFORM_INTERNAL_SET_ADDITIONAL_FIELD_STATE]: ({
		state,
		properties,
		action
	}) => {
		action.stopPropagation();
		const gForm = getGForm(state, properties);
		if (
			!gForm ||
			!gForm.$private ||
			!gForm.$private.fieldState ||
			!gForm.$private.fieldState.applyTemplateValue
		) {
			return;
		}

		const {
			payload: { fieldName, value, propName }
		} = action;
		gForm.$private.setAdditionalFieldState(fieldName, propName, value);
	}
};

export const gFormActionHandlers = {
	actions: {
		[GFORM_SET_VALUE]: { private: true },
		[GFORM_ADD_INFO_MESSAGE]: { private: true },
		[GFORM_ADD_WARNING_MESSAGE]: { private: true },
		[GFORM_ADD_ERROR_MESSAGE]: { private: true },
		[GFORM_CLEAR_MESSAGE]: { private: true },
		[GFORM_SUBMIT]: { private: true },
		[GFORM_SHOW_FIELD_MESSAGE]: { private: true },
		[GFORM_HIDE_FIELD_MESSAGE]: { private: true },
		[GFORM_SET_VISIBLE]: { private: true },
		[GFORM_SET_READ_ONLY]: { private: true },
		[GFORM_SET_MANDATORY]: { private: true },
		[GFORM_CLEAR_OPTIONS]: { private: true },
		[GFORM_ADD_OPTION]: { private: true },
		[GFORM_REMOVE_OPTION]: { private: true },
		[GFORM_INTERNAL_CLEAR_OPTION_STACK]: { private: true },
		[GFORM_INTERNAL_SET_FIELD_INVALID]: { private: true },
		[GFORM_INTERNAL_SET_ADDITIONAL_FIELD_STATE]: { private: true },
		[GFORM_INTERNAL_BATCH_ACTIONS]: { private: true }
	},
	actionHandlers: {
		...primitiveActionHandlers,
		[GFORM_INTERNAL_BATCH_ACTIONS]: coeffects => {
			const { action } = coeffects;
			const {
				payload: { actions }
			} = action;
			action.stopPropagation();
			if (!_.isArray(actions)) {
				return;
			}
			actions.forEach(({ name, payload }) => {
				const handler = primitiveActionHandlers[name];
				if (!handler) {
					return;
				}
				handler({
					...coeffects,
					action: {
						...action,
						type: name,
						payload
					}
				});
			});
		}
	}
};
