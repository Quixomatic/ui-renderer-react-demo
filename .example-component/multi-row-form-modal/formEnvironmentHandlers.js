import { actionTypes } from "@servicenow/ui-core";
import {
	PLATFORM_RESOURCES_LOADED,
	ENVIRONMENT_INITIALIZED,
	ENVIRONMENT_INITIALIZATION_FAILED,
	FIELDS,
	G_FORM,
	VARIABLES_LAYOUT,
	IS_LOADING,
	FORM_DATA
} from "./constants";

import { createInitializeCatalogFormEnvironmentEffect } from "../library-catalog-form/effects/initializeEnvironment";

import {
	CATALOG_FORM_CHANGED,
	CATALOG_FORM_FIELD_PROP_CHANGED,
	CATALOG_FORM_SUBMITTED
} from "../library-catalog-form/actions";

import { UPDATE_MULTI_ROW_DATA } from "../multi-row-variable/constants";

const { COMPONENT_BOOTSTRAPPED } = actionTypes;

const overLoadGFormAPI = (gForm, variableSetId) => {
	// overriding serialize method to inject multi_row_id for reference field processing
	gForm._serialize = gForm.serialize;
	gForm.serialize = function() {
		let fields = gForm._serialize();
		fields.push({
			name: "$private_multi_row_id",
			value: variableSetId
		});
		return fields;
	};
};

const processGFormSubmit = ({ properties, dispatch, state }) => {
	const { gForm } = state;
	const { rowId, onModalCloseActionType } = properties;
	const data = gForm.serialize();
	const formDirty = gForm.isUserModified();
	dispatch(UPDATE_MULTI_ROW_DATA, { rowId, data, formDirty });
	dispatch(onModalCloseActionType);
};

export const formEnvironmentHandlers = {
	[COMPONENT_BOOTSTRAPPED]: ({ dispatch, properties }) => {
		const {
			variableSetId,
			catalogItemId,
			sourceTable,
			sourceId,
			action,
			rowData,
			parentFields
		} = properties;
		if (typeof window["glideFormFactory"] !== "undefined") {
			return dispatch(PLATFORM_RESOURCES_LOADED, {
				data: {
					variableSetId,
					catalogItemId,
					sourceId,
					sourceTable,
					action,
					rowData,
					parentFields
				}
			});
		}
		let script = document.createElement("script");
		script.src = "/scripts/sn/common/clientScript/js_includes_clientScript.js";

		script.onload = () =>
			dispatch(PLATFORM_RESOURCES_LOADED, {
				data: {
					variableSetId,
					catalogItemId,
					sourceId,
					sourceTable
				}
			});
		document.getElementsByTagName("head")[0].appendChild(script);
	},
	[PLATFORM_RESOURCES_LOADED]: createInitializeCatalogFormEnvironmentEffect({
		successActionType: ENVIRONMENT_INITIALIZED,
		errorActionType: ENVIRONMENT_INITIALIZATION_FAILED,
		dataParam: "data",
		isMultiRowVariable: true
	}),
	[ENVIRONMENT_INITIALIZATION_FAILED]: ({ dispatch, action, state }) => {
		console.error(action.payload.error); /* eslint-disable-line */
		let {
			properties: { onModalCloseActionType }
		} = state;
		dispatch(onModalCloseActionType);
	},
	[ENVIRONMENT_INITIALIZED]: ({
		updateState,
		action: { payload },
		properties,
		state: { formData = {} }
	}) => {
		const { gForm } = payload;
		const { sourceTable, sourceId } = properties;
		//Special for multi-row active-row
		overLoadGFormAPI(gForm, properties.variableSetId);
		updateState({
			[FIELDS]: payload[FIELDS],
			[G_FORM]: gForm,
			[VARIABLES_LAYOUT]: payload[VARIABLES_LAYOUT],
			[IS_LOADING]: false,
			[FORM_DATA]: {
				...formData,
				tableName: sourceTable,
				sysId: sourceId,
				encodedRecord: gForm.getEncodedRecord(),
				serializedChanges: JSON.stringify(gForm.serialize())
			}
		});
	},
	[CATALOG_FORM_CHANGED]: ({
		updateState,
		action: { payload },
		state: { gForm, formData = {} }
	}) =>
		updateState({
			[FIELDS]: payload[FIELDS],
			formData: {
				...formData,
				encodedRecord: gForm.getEncodedRecord(),
				serializedChanges: JSON.stringify(gForm.serialize())
			}
		}),
	[CATALOG_FORM_FIELD_PROP_CHANGED]: ({ updateState, action: { payload } }) =>
		updateState({
			[FIELDS]: payload[FIELDS]
		}),
	[CATALOG_FORM_SUBMITTED]: {
		effect: processGFormSubmit
	}
};
