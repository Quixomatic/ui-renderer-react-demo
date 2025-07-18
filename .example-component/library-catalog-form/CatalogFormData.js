import _ from 'lodash';
import {
	transformVariablesLayout,
	setUpParentChildRelationships,
	transformClientScripts,
	transformUIPolcies,
	transformValidationScripts
} from './utils';
import { PROP_CHANGE_EVENT, CHANGE_EVENT } from './formEventHandlers';

export class CatalogFormData {
	constructor(
		sourceTable,
		sourceId,
		parentFields,
		variableSetId,
		fields,
		layout,
		uiPolicies,
		clientScripts,
		uiScripts,
		validationScripts,
		dataLookups
	) {
		this.sourceTable = sourceTable;
		this.sourceId = sourceId;
		this.parentFields = parentFields;
		this.variableSetId = variableSetId || sourceId;
		this.layout = transformVariablesLayout(variableSetId, layout);
		this.fields = setUpParentChildRelationships(fields, this.layout);
		this.uiPolicies = transformUIPolcies(this.fields, uiPolicies);
		this.clientScripts = transformClientScripts(clientScripts);
		this.uiScripts = uiScripts;
		this.validationScripts = transformValidationScripts(validationScripts);
		this.dataLookups = dataLookups;
		this.initEventListeners();
	}

	getFields() {
		return this.fields;
	}

	getFieldList() {
		return _.reduce(
			this.getFields(),
			(result, value) => {
				result.push(value);
				return result;
			},
			[]
		);
	}

	getVariablesLayout() {
		return this.layout;
	}

	getValidationScripts() {
		return this.validationScripts;
	}

	getDataLookups() {
		return this.dataLookups;
	}

	getUserDetails() {
		return {};
	}

	getUIScripts() {
		return this.uiScripts;
	}

	getScratchpad() {
		return {};
	}

	getClientScripts() {
		return this.clientScripts;
	}

	getUIPolicies() {
		return this.uiPolicies;
	}

	initEventListeners() {
		this._subscribers = new Map();
		this._subscribers.set(PROP_CHANGE_EVENT, []);
		this._subscribers.set(CHANGE_EVENT, []);
	}

	addPropertyChangeSubscriber(subscriber) {
		this._subscribers.get(PROP_CHANGE_EVENT).push(subscriber);
	}

	addChangedSubscriber(subscriber) {
		this._subscribers.get(CHANGE_EVENT).push(subscriber);
	}

	onFieldPropertyChange(name, property, propertyValue) {
		if (!_.has(this.fields, name)) {
			console.warn('Property change event on unknown field'); //eslint-disable-line
			return;
		}
		const changedField = _.get(this.fields, name);
		this.fields = {
			...this.fields,
			[name]: {
				...changedField,
				[property]: propertyValue
			}
		};
		this._runSubscribers(PROP_CHANGE_EVENT, [property, this.fields]);
	}

	/**
	 * Special case for value change. We just copy everything out
	 * @param {} changedFields
	 */
	onFieldsChange(changedFields) {
		this.fields = {
			...this.fields,
			...changedFields
		};
		this._runSubscribers(CHANGE_EVENT, [this.fields]);
	}

	_runSubscribers(type, args) {
		for (const subscriber of this._subscribers.get(type)) {
			subscriber(...args);
		}
	}
}
