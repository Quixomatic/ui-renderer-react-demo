import { createCustomElement, actionTypes } from "@servicenow/ui-core";
import react from "@servicenow/ui-renderer-react";
import view from "./view.js";
import styles from "./styles.scss";

const { COMPONENT_CONNECTED } = actionTypes;

/**
 * MRVS Modal Form React Bridge Component
 *
 * This is the React bridge component that receives all props from the ServiceNow container.
 * It handles g_form API initialization, client script execution, and UI rendering.
 */
createCustomElement("x-312987-tf-mrvs-modal-form", {
	renderer: { type: react },
	view,
	initialState: {
		hostElement: null,
	},
	properties: {
		// Modal control properties
		active: {
			default: false,
		},
		variableSetName: {
			default: "",
		},
		action: {
			default: "add",
		},
		onClose: {
			default: () => {},
		},
		rowIndex: {
			default: null,
		},
		sourceTable: {
			default: "",
		},
		sourceId: {
			default: "",
		},

		// State properties from container
		fields: {
			default: {},
		},
		variablesLayout: {
			default: [],
		},
		isLoading: {
			default: false,
		},
		error: {
			default: null,
		},
		formMessages: {
			default: [],
		},
		formValid: {
			default: true,
		},
		clientScripts: {
			default: {},
		},
		uiPolicies: {
			default: [],
		},
		globals: {
			default: {},
		},
		
		// Reference field data
		referenceData: {
			default: {},
		},
		referenceLoading: {
			default: {},
		},
		referencePagination: {
			default: {},
		},

		// Field change batch for client script execution
		changesBatch: {
			default: {},
		},
	},
	actionHandlers: {
		[COMPONENT_CONNECTED]: ({ action, updateState, state, host }) => {
			updateState({
				hostElement: host,
			});
		},
		/**
		 * Handle value changes from child React components
		 */
		VALUE_CHANGE: {
			effect: ({ action, dispatch }) => {
				// Forward to parent Snabbdom component
				dispatch("FORM_VALUE_CHANGE", action.payload);
			},
			stopPropagation: true,
		},

		/**
		 * Handle form submission
		 */
		SUBMIT_FORM: {
			effect: ({ action, dispatch }) => {
				// Forward to parent Snabbdom component
				dispatch("FORM_SUBMIT", action.payload);
			},
			stopPropagation: true,
		},

		/**
		 * Handle form reset
		 */
		RESET_FORM: {
			effect: ({ action, dispatch }) => {
				// Forward to parent Snabbdom component
				dispatch("FORM_RESET", action.payload);
			},
			stopPropagation: true,
		},

		/**
		 * Handle validation requests
		 */
		VALIDATE_FIELD: {
			effect: ({ action, dispatch }) => {
				// Forward to parent Snabbdom component
				dispatch("FORM_VALIDATE", action.payload);
			},
			stopPropagation: true,
		},
	},
	styles,
});
