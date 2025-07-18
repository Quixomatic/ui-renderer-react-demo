import _ from 'lodash';
import {
	GFORM_EVENT_CHANGED,
	GFORM_EVENT_CHANGE,
	GFORM_EVENT_SUBMITTED,
	GFORM_ON_PROP_CHANGE,
	CATALOG_FORM_SUBMITTED,
	CATALOG_FORM_CHANGED
} from './actions';
import {
	G_MODAL,
	G_SCRATCHPAD,
	G_UI_ACTIONS,
	G_UI_SCRIPTS,
	G_USER
} from './constants';
import { createCatalogDataLookup } from './CatalogDataLookup';
import { SnFormModal } from '@devsnc/sn-scripted-modal';
import { getGCKFromGlobal } from './utils';
import { snHttpFactory } from 'sn-http-request';
import { createUIMessageHandler } from './createUIMessageHandler';
import {
	createMessageLocaliazationHandler,
	GET_MESSAGE,
	GET_MESSAGES,
	LOAD_MESSAGE,
	CLEAR_MESSAGES
} from './MessageLocalizationHandler';
import { t } from 'sn-translate';

const sendRequest = snHttpFactory({
	xsrfToken: getGCKFromGlobal()
});

const getMappedFieldNameFactory = fieldMap => fieldName => {
	if (fieldMap[fieldName]) {
		return fieldMap[fieldName].variable_name;
	}
	return fieldName;
};

export class CatalogFormEnvironment {
	constructor(
		formData,
		{
			glideFormEnvironmentFactory,
			glideFormFactory,
			glideAjax,
			glideRecord,
			glideModalFactory,
			glideUser,
			uiScriptFactory
		},
		dispatch,
		environmentOptions
	) {
		this._glideFormEnvironmentFactory = glideFormEnvironmentFactory;
		this._glideFormFactory = glideFormFactory;
		this._glideAjax = glideAjax;
		this._glideRecord = glideRecord;
		this._glideModalFactory = glideModalFactory;
		this._glideUser = glideUser;
		this._uiScriptFactory = uiScriptFactory;
		this.formData = formData;
		this.g_form = {};
		this.globals = {};
		this.dispatch = dispatch;
		this.formModal = new SnFormModal();
		this.environmentOptions = environmentOptions;
		this._initialized = false;
		this.initializeEnvironment();
	}

	initializeEnvironment() {
		this.formModal.initialize();
		this.instrumentGlobals();
		this.initializeGForm();
		this.instrumentDataLookup();
		this.instrumentGlideFormEnvironment();
	}

	instrumentGlobals() {
		//TODO: Init G_USER
		this.globals[G_USER] = {}; //this._glideUser(this.formData.getUserDetails());
		this.globals[G_SCRATCHPAD] = this.formData.getScratchpad();
		this.globals[G_MODAL] = this.formModal;
		this.globals[G_UI_SCRIPTS] = this._uiScriptFactory.create(
			this.formData.getUIScripts()
		);
	}

	initializeGForm() {
		const messages = this.generateMessages();
		this._glideFormFields = _.cloneDeep(this.formData.getFields());
		const gFormFieldList = _.reduce(
			this._glideFormFields,
			(acc, field) => {
				acc.push(field);
				return acc;
			},
			[]
		);
		let g_form = this._glideFormFactory.create(
			this.formData.sourceTable,
			this.formData.variableSetId,
			gFormFieldList,
			this.getGlobals(G_UI_ACTIONS),
			{
				useCatalogVariableFieldHandler: true,
				getMappedFieldName: getMappedFieldNameFactory(
					this.formData.getFields()
				),
				uiMessageHandler: createUIMessageHandler(this.dispatch),
				messages
			}
		);
		this.wireupFormEvents(g_form);

		this.g_form = g_form;
	}

	generateMessages() {
		return {
			MANDATORY_MESSAGE: t('The following mandatory fields are not filled in'),
			FIELD_ERROR_MESSAGE: t('The following fields contain errors')
		};
	}

	wireupFormEvents(g_form) {
		// Mutating Cache to avoid multiple rendering for change events
		var changedFields = {};
		const emptyChangedFields = () => {
			changedFields = {};
		};
		g_form.$private.events.on(GFORM_EVENT_CHANGE, fieldName => {
			changedFields[fieldName] = true;
		});

		this.formData.addChangedSubscriber(emptyChangedFields);
		this.formData.addChangedSubscriber(fields =>
			this.dispatch(CATALOG_FORM_CHANGED, {
				fields
			})
		);
		g_form.$private.events.on(GFORM_EVENT_CHANGED, () => {
			if (Object.keys(changedFields).length > 0) {
				const changedFieldsCopy = _.reduce(
					changedFields,
					(acc, val, name) => {
						acc[name] = {
							...this._glideFormFields[name]
						};
						return acc;
					},
					{}
				);
				this.formData.onFieldsChange(changedFieldsCopy);
			}
		});
		this.formData.addPropertyChangeSubscriber((property, fields) => {
			switch (property) {
				case 'messages':
				case 'confirmationValue':
				case 'isInvalid':
					this.dispatch(CATALOG_FORM_CHANGED, {
						fields
					});
					break;
				default:
					break;
			}
		});
		g_form.$private.events.on(
			GFORM_ON_PROP_CHANGE,
			(type, name, property, propertyValue) => {
				this.formData.onFieldPropertyChange(name, property, propertyValue);
			}
		);
		//Submitted events need not go through formData
		g_form.$private.events.on(GFORM_EVENT_SUBMITTED, () =>
			this.dispatch(CATALOG_FORM_SUBMITTED)
		);
	}

	instrumentDataLookup() {
		let dataLookupFields = this.formData.getDataLookups();
		this._dataLookup = createCatalogDataLookup(
			this.g_form,
			dataLookupFields,
			sendRequest
		);
	}

	instrumentGlideFormEnvironment() {
		this._environment = this._glideFormEnvironmentFactory.createWithConfiguration(
			this.g_form,
			this.getGlobals(G_USER),
			this.getGlobals(G_SCRATCHPAD),
			this.formData.getClientScripts(),
			this.formData.getUIPolicies(),
			this.getGlobals(G_MODAL),
			this.formData.getValidationScripts(),
			this.getGlobals(G_UI_SCRIPTS)
		);
		const parentFields = this.formData.parentFields;
		let { g_env } = this._environment;
		_.forEach(this.getGlobals(), (val, key) => {
			g_env.registerExtensionPoint(key, val);
		});
		const messageLocalizationHandler = createMessageLocaliazationHandler(
			sendRequest
		);
		var fieldMap;
		const getFieldMap = function() {
			fieldMap = new Map(Object.entries(parentFields));
			return fieldMap;
		};
		const getParentFormField = {
			getValue: function(fieldName) {
				if (!fieldName) {
					return '';
				}
				var field = null;
				if (
					typeof fieldMap === 'undefined' ||
					fieldMap == null ||
					fieldMap.size === 0
				) {
					fieldMap = getFieldMap();
				}
				field = fieldMap.get('variables.' + fieldName);
				if (field) {
					return typeof field.value !== 'undefined' && field.value !== null
						? field.value.toString()
						: '';
				}
			}
		};
		g_env.registerExtensionPoint(
			GET_MESSAGE,
			messageLocalizationHandler[GET_MESSAGE]
		);
		g_env.registerExtensionPoint(
			GET_MESSAGES,
			messageLocalizationHandler[GET_MESSAGES]
		);
		g_env.registerExtensionPoint(
			LOAD_MESSAGE,
			messageLocalizationHandler[LOAD_MESSAGE]
		);
		g_env.registerExtensionPoint(
			CLEAR_MESSAGES,
			messageLocalizationHandler[CLEAR_MESSAGES]
		);
		g_env.registerExtensionPoint('NOW', {});
		g_env.registerExtensionPoint('g_service_catalog', {
			parent: getParentFormField
		});
	}

	initialize() {
		this._environment.initialize();
		this._dataLookup.initialize();
		this._initialized = true;
	}

	isInitialized() {
		return this._initialized;
	}

	getGlobals(variable) {
		return this.globals[variable];
	}

	getFormFields() {
		return this.formData.getFields();
	}

	getFormController() {
		return this.g_form;
	}

	getVariablesLayout() {
		return this.formData.getVariablesLayout();
	}
}
