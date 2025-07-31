import { createCustomElement, actionTypes } from "@servicenow/ui-core";
import react from "@servicenow/ui-renderer-react";
import view from "./view";
import styles from "./styles.scss";

const { COMPONENT_CONNECTED } = actionTypes;

/**
 * TurboForge Catalog Form - React Bridge Component
 *
 * This component acts as the bridge between ServiceNow's Snabbdom world and React.
 * It receives all props from the parent Snabbdom component and renders the catalog form
 * using React and shadcn/ui components.
 *
 * Everything below this component can use standard React patterns without needing
 * ServiceNow component registration.
 */
createCustomElement("tf-catalog-form", {
	renderer: { type: react },
	view,
	initialState: {
		hostElement: null,
	},
	properties: {
		/**
		 * Form data object containing catalog form data
		 */
		formData: {
			default: {},
		},
		/**
		 * Map of field definitions
		 */
		fields: {
			default: {},
		},
		/**
		 * Layout configuration for variables
		 */
		variablesLayout: {
			default: [],
		},
		/**
		 * Current form values
		 */
		formValues: {
			default: {},
		},
		/**
		 * Validation errors
		 */
		validationErrors: {
			default: {},
		},
		/**
		 * Field states (visibility, readonly, mandatory, etc.)
		 */
		fieldStates: {
			default: {},
		},
		/**
		 * Field-level messages
		 */
		fieldMessages: {
			default: {},
		},
		/**
		 * Form-level messages
		 */
		formMessages: {
			default: [],
		},
		/**
		 * Overall form validity
		 */
		formValid: {
			default: true,
		},
		/**
		 * Read-only option
		 */
		readOnlyOption: {
			default: "default",
		},
		/**
		 * Render style
		 */
		renderStyle: {
			default: "default",
		},
		/**
		 * Variable gap setting
		 */
		variableGap: {
			default: "md",
		},
		/**
		 * No gutter setting
		 */
		noGutter: {
			default: false,
		},
		/**
		 * Source table
		 */
		sourceTable: {
			default: "",
		},
		/**
		 * Source ID
		 */
		sourceId: {
			default: "",
		},
		/**
		 * Host element reference for shadow DOM access
		 */
		hostElement: {
			default: null,
		},
		/**
		 * ServiceNow global variables
		 */
		globals: {
			default: {},
		},
		/**
		 * Client scripts for form behavior
		 */
		clientScripts: {
			default: {},
		},
		/**
		 * UI policies for field behavior
		 */
		uiPolicies: {
			default: [],
		},
		/**
		 * Reference data for fields
		 * This is a map of field names to their reference data
		 */
		referenceData: {
			default: {},
		},
		/**
		 * Whether reference data is still loading
		 */
		referenceLoading: {
			default: {},
		},
		/**
		 * Reference field pagination info
		 */
		referencePagination: {
			default: {},
		},
		/**
		 * Field change batch for client script execution
		 */
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
		VALUE_CHANGE: ({ action, dispatch }) => {
			// Forward to parent Snabbdom component
			dispatch("FORM_VALUE_CHANGE", action.payload);
		},

		/**
		 * Handle form submission
		 */
		SUBMIT_FORM: ({ action, dispatch }) => {
			// Forward to parent Snabbdom component
			dispatch("FORM_SUBMIT", action.payload);
		},

		/**
		 * Handle form reset
		 */
		RESET_FORM: ({ action, dispatch }) => {
			// Forward to parent Snabbdom component
			dispatch("FORM_RESET", action.payload);
		},

		/**
		 * Handle validation requests
		 */
		VALIDATE_FIELD: ({ action, dispatch }) => {
			// Forward to parent Snabbdom component
			dispatch("FORM_VALIDATE", action.payload);
		},

	},
	styles,
});
