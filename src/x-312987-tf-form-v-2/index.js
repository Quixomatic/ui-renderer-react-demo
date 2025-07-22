import { createCustomElement, actionTypes } from '@servicenow/ui-core';
import { createHttpEffect } from '@servicenow/ui-effect-http';
import snabbdom from '@servicenow/ui-renderer-snabbdom';
import styles from './styles.scss';
import view from './view.js';

// Import the React components so they register themselves
import './components/shadcn-example';
import './components/tf-catalog-form';

// Import utilities
import {
    createComprehensiveFields,
    updateFieldValue,
    updateFieldState,
    getMappedFieldName
} from './utils/fieldUtils';
import {
    transformClientScripts,
    transformUIPolicies,
    transformValidationScripts
} from './utils/transformUtils';
import debug from './lib/debug.js';

const { COMPONENT_CONNECTED, COMPONENT_RENDERED } = actionTypes;

/**
 * Compare two state objects and return differences
 * @param {Object} previousState - Previous render state
 * @param {Object} currentState - Current state
 * @returns {Object} - Object containing differences
 */
function getStateDifferences(previousState, currentState) {
	const differences = {};
	
	// Helper function to deep compare objects
	function deepEqual(obj1, obj2) {
		if (obj1 === obj2) return true;
		if (!obj1 || !obj2) return false;
		if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;
		
		const keys1 = Object.keys(obj1);
		const keys2 = Object.keys(obj2);
		
		if (keys1.length !== keys2.length) return false;
		
		for (let key of keys1) {
			if (!keys2.includes(key)) return false;
			if (!deepEqual(obj1[key], obj2[key])) return false;
		}
		
		return true;
	}
	
	// Compare top-level properties
	const allKeys = new Set([
		...Object.keys(previousState || {}),
		...Object.keys(currentState || {})
	]);
	
	for (const key of allKeys) {
		const prevValue = previousState?.[key];
		const currValue = currentState?.[key];
		
		if (!deepEqual(prevValue, currValue)) {
			differences[key] = {
				previous: prevValue,
				current: currValue,
				changed: true
			};
		}
	}
	
	return differences;
}

/**
 * Validates a field value based on field configuration
 * @param {Object} field - Field configuration object
 * @param {*} value - Value to validate
 * @returns {string|null} - Validation error message or null if valid
 */
function validateFieldValue(field, value) {
	// Get the actual value (handle object values for references/choices)
	const actualValue = typeof value === 'object' && value !== null ? value.value : value;
	const isEmpty = !actualValue || (typeof actualValue === 'string' && actualValue.trim() === '');

	// 1. Mandatory field validation (runs first)
	if (isEmpty && field.mandatory) {
		return 'This field is required';
	}

	// 2. Field type specific validation (only if value exists)
	if (!isEmpty) {
		const fieldType = field.type;

		switch (fieldType) {
			case 'email':
				const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
				if (!emailRegex.test(actualValue)) {
					return 'Please enter a valid email address';
				}
				break;

			case 'url':
				try {
					new URL(actualValue);
				} catch {
					return 'Please enter a valid URL';
				}
				break;

			case 'ip_address':
				const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
				if (!ipRegex.test(actualValue)) {
					return 'Please enter a valid IP address';
				}
				break;

			case 'string':
			case 'text':
			case 'multi_two_lines':
			case 'html':
			case 'masked':
				// Check max length if specified
				if (field.maxLength && actualValue.length > field.maxLength) {
					return `Maximum ${field.maxLength} characters allowed`;
				}
				// Check regex pattern if specified (ServiceNow format)
				if (field.regExp) {
					try {
						const regex = new RegExp(field.regExp);
						if (!regex.test(actualValue)) {
							// Use ServiceNow's validation message if available
							const validationMessage = field.validation?.validation_message?.value;
							return validationMessage || 'Invalid format';
						}
					} catch (e) {
						debug.warn('validation', `Invalid regex pattern for field ${field.name}:`, e);
					}
				}
				break;

			case 'glide_date':
			case 'glide_date_time':
				// Basic date validation - should be in YYYY-MM-DD format
				const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
				if (fieldType === 'glide_date' && !dateRegex.test(actualValue)) {
					return 'Please enter a valid date (YYYY-MM-DD)';
				}
				// Additional validation could check if it's a real date
				const dateObj = new Date(actualValue);
				if (isNaN(dateObj.getTime())) {
					return 'Please enter a valid date';
				}
				break;

			case 'numeric_scale':
				const numValue = parseFloat(actualValue);
				if (isNaN(numValue)) {
					return 'Please enter a valid number';
				}
				// Check min/max values if specified
				if (field.min !== undefined && numValue < field.min) {
					return `Value must be at least ${field.min}`;
				}
				if (field.max !== undefined && numValue > field.max) {
					return `Value must be at most ${field.max}`;
				}
				break;

			default:
				// For choice, reference, boolean, and other types - no format validation needed
				break;
		}
	}

	return null; // Valid
}

createCustomElement('x-312987-tf-form-v-2', {
	renderer: { type: snabbdom },
	view,
	styles,
	properties: {
		/**
		 * Form data object containing catalog form data.
		 * @type {object}
		 */
		formData: {
			default: {}
		},
		/**
		 * Source table where the variables are being displayed.
		 * @type {string}
		 */
		sourceTable: {
			default: ''
		},
		/**
		 * SysId of the source record.
		 * @type {string}
		 */
		sourceId: {
			default: ''
		},
		/**
		 * Contains information about the variables within the catalog item.
		 * It is a map with the 'variables.<variable_name>' key and 'variable properties object' value.
		 * @type {{variables.variable1: {object}, variables.variable2: {object}}}
		 */
		fields: {
			default: {}
		},
		/**
		 * Determines the order in which the variables will be displayed in the form.
		 * It is an array of objects where each object holds information related to the field such as name, type, parent.
		 * When the type of the variable is container, additional information such as columns, caption, layout will be available.
		 * @type {Array.<{name:string, type:string, parent:string, caption:string, captionDisplay:string, layout: string, columns: Array.<{fields: Array<{name:string, type:string}>}>}>}
		 */
		variablesLayout: {
			default: []
		},
		/**
		 * When set to true, the left and right margins would be removed for the variables.
		 * @type {boolean}
		 */
		noGutter: {
			default: false
		},
		/**
		 * When set to printable, the read-only variables become non editable.
		 * @type {('default'|'printable')}
		 */
		readOnlyOption: {
			default: 'default',
			schema: {
				type: 'string',
				enum: ['default', 'printable']
			}
		},
		/**
		 * This property is used to alter the width of variables other than HTML, Custom, etc.
		 * 'renderStyle:default', the variable is displayed with 100% width
		 * 'renderStyle:compact', the variable is displayed with 50% width
		 * @type {('default'|'compact')}
		 */
		renderStyle: {
			default: 'default',
			schema: {
				type: 'string',
				enum: ['default', 'compact']
			}
		},
		/**
		 * This property is used to define the gap between variables.
		 * @type {('sm'|'md'|'lg'|'xl')}
		 */
		variableGap: {
			default: 'md',
			schema: {
				type: 'string',
				enum: ['sm', 'md', 'lg', 'xl']
			}
		},
		/**
		 * Form dispatch configuration for form actions.
		 * @type {object}
		 */
		formDispatch: {
			default: {}
		},
		/**
		 * Current form values keyed by field name.
		 * @type {object}
		 */
		formValues: {
			default: {}
		},
		/**
		 * Validation errors keyed by field name.
		 * @type {object}
		 */
		validationErrors: {
			default: {}
		},
		/**
		 * Field states (visibility, readonly, mandatory, etc.) keyed by field name.
		 * @type {object}
		 */
		fieldStates: {
			default: {}
		},
		/**
		 * Field-level messages keyed by field name.
		 * @type {object}
		 */
		fieldMessages: {
			default: {}
		},
		/**
		 * Form-level messages array.
		 * @type {Array}
		 */
		formMessages: {
			default: []
		},
		/**
		 * Overall form validity state.
		 * @type {boolean}
		 */
		formValid: {
			default: true
		},
		/**
		 * Whether to show validation errors to the user.
		 * False on initial load, true after first interaction.
		 * @type {boolean}
		 */
		showValidationErrors: {
			default: false
		},
		/**
		 * Client scripts for form behavior.
		 * @type {object}
		 */
		clientScripts: {
			default: {}
		},
		/**
		 * UI policies for field visibility and behavior.
		 * @type {array}
		 */
		uiPolicies: {
			default: []
		},
		/**
		 * Validation scripts for form validation.
		 * @type {array}
		 */
		validationScripts: {
			default: []
		}
	},
	actionHandlers: {
		[COMPONENT_CONNECTED]: ({ action, updateState, state, properties }) => {
			// Create comprehensive field objects from properties
			const comprehensiveFields = createComprehensiveFields(
				properties.fields,
				properties.variablesLayout,
				properties.sourceTable,
				properties.sourceId
			);

			// Transform client scripts and policies
			const transformedClientScripts = transformClientScripts(properties.clientScripts);
			const transformedUIPolicies = transformUIPolicies(properties.uiPolicies);
			const transformedValidationScripts = transformValidationScripts(properties.validationScripts);

			// Initialize ServiceNow globals
			const globals = {
				g_user: window.g_user || {},
				g_scratchpad: window.g_scratchpad || {},
				g_modal: window.g_modal || null,
				g_ck: window.g_ck || ''
			};

			// Update state with comprehensive data
			updateState({
				fields: comprehensiveFields,
				clientScripts: transformedClientScripts,
				uiPolicies: transformedUIPolicies,
				validationScripts: transformedValidationScripts,
				globals: globals
			});
		},
		[COMPONENT_RENDERED ]: ({ action, updateState, state, properties }) => {
			// Compare previous and current state to identify what changed
			const previousRenderState = action.payload?.previousRenderState;
			
			if (previousRenderState) {
				const differences = getStateDifferences(previousRenderState, state);
				const changedKeys = Object.keys(differences);
				
				if (changedKeys.length > 0) {
					debug.group('componentInit', 'Component Re-render Triggered', () => {
						debug.log('componentInit', `${changedKeys.length} state properties changed:`, changedKeys);
						
						// Log each changed property with before/after values
						changedKeys.forEach(key => {
							const diff = differences[key];
							debug.log('componentInit', `State change - ${key}:`, {
								previous: diff.previous,
								current: diff.current
							});
						});
					});
				} else {
					debug.log('componentInit', 'Component re-rendered but no state differences detected');
				}
			} else {
				debug.log('componentInit', 'Component initial render (no previous state)');
			}
		},
		'FORM_VALUE_CHANGE': ({ action, updateState, state }) => {
			const { field, value } = action.payload;
			const mappedFieldName = getMappedFieldName(field);

			debug.log('fieldValues', 'FORM_VALUE_CHANGE triggered:', { field, value, mappedFieldName });

			// Update the comprehensive field object
			if (state.fields[mappedFieldName]) {
				const currentField = state.fields[mappedFieldName];

				// Extract current value and displayValue
				const currentValue = currentField.value || '';
				const currentDisplayValue = currentField.displayValue || '';

				// Extract new value and displayValue
				const newValue = typeof value === 'object' ? (value.value || '') : (value || '');
				const newDisplayValue = typeof value === 'object' ? (value.displayValue || value.value || '') : (value || '');

				// Only update if values have actually changed
				if (currentValue !== newValue || currentDisplayValue !== newDisplayValue) {
					const updatedField = updateFieldValue(currentField, value);

					updateState({
						fields: {
							...state.fields,
							[mappedFieldName]: updatedField
						}
					});
				} else {
					debug.log('fieldValues', 'Value unchanged, skipping update:', { currentValue, newValue, currentDisplayValue, newDisplayValue });
					action.stopPropagation();
				}
			}
		},
		'FORM_FIELD_STATE_CHANGE': ({ action, updateState, state }) => {
			const { field, property, value } = action.payload;
			const mappedFieldName = getMappedFieldName(field);

			// Update the comprehensive field object
			if (state.fields[mappedFieldName]) {
				const updatedField = updateFieldState(state.fields[mappedFieldName], property, value);

				updateState({
					fields: {
						...state.fields,
						[mappedFieldName]: updatedField
					}
				});
			}
		},
		'FORM_MESSAGE_ADD': ({ action, updateState, state }) => {
			const { message } = action.payload;
			const newMessages = [...(state.formMessages || []), message];
			updateState({ formMessages: newMessages });
		},
		'FORM_MESSAGES_CLEAR': ({ action, updateState, state }) => {
			const { type } = action.payload;
			let newMessages = state.formMessages || [];

			if (type === 'all') {
				newMessages = [];
			} else {
				newMessages = newMessages.filter(msg => msg.type !== type);
			}

			updateState({ formMessages: newMessages });
		},
		'FORM_FIELD_MESSAGE_SHOW': ({ action, updateState, state }) => {
			const { field, message } = action.payload;
			const mappedFieldName = getMappedFieldName(field);

			if (state.fields[mappedFieldName]) {
				const updatedField = {
					...state.fields[mappedFieldName],
					messages: [...(state.fields[mappedFieldName].messages || []), message]
				};

				updateState({
					fields: {
						...state.fields,
						[mappedFieldName]: updatedField
					}
				});
			}
		},
		'FORM_FIELD_MESSAGE_HIDE': ({ action, updateState, state }) => {
			const { field, clearAll } = action.payload;
			const mappedFieldName = getMappedFieldName(field);

			if (state.fields[mappedFieldName]) {
				const currentMessages = state.fields[mappedFieldName].messages || [];
				const updatedField = {
					...state.fields[mappedFieldName],
					messages: clearAll ? [] : currentMessages.slice(1)
				};

				updateState({
					fields: {
						...state.fields,
						[mappedFieldName]: updatedField
					}
				});
			}
		},
		'FORM_FIELD_MESSAGES_HIDE_ALL': ({ action, updateState, state }) => {
			const { type } = action.payload;
			const updatedFields = {};

			Object.entries(state.fields).forEach(([fieldName, field]) => {
				if (field.messages && field.messages.length > 0) {
					updatedFields[fieldName] = {
						...field,
						messages: type
							? field.messages.filter(msg => msg.type !== type)
							: []
					};
				}
			});

			if (Object.keys(updatedFields).length > 0) {
				updateState({
					fields: {
						...state.fields,
						...updatedFields
					}
				});
			}
		},
		'FORM_CHOICE_ADD_OPTION': ({ action, updateState, state }) => {
			const { field, option, index } = action.payload;
			// This would update the field choices in a real implementation
			debug.log('fieldState', 'Add choice option:', { field, option, index });
		},
		'FORM_CHOICE_REMOVE_OPTION': ({ action, updateState, state }) => {
			const { field, value } = action.payload;
			debug.log('fieldState', 'Remove choice option:', { field, value });
		},
		'FORM_CHOICE_CLEAR_OPTIONS': ({ action, updateState, state }) => {
			const { field } = action.payload;
			debug.log('fieldState', 'Clear choice options:', { field });
		},
		'FORM_SUBMIT': ({ action, updateState, state, dispatch }) => {
			const { verb } = action.payload;
			debug.log('formSubmit', 'Form submitted:', { verb, values: state.formValues });

			// Dispatch to parent components
			dispatch('CATALOG_FORM_SUBMITTED', {
				formValues: state.formValues,
				sourceTable: state.properties.sourceTable,
				sourceId: state.properties.sourceId,
				verb
			});
		},
		'FORM_SAVE': ({ action, updateState, state, dispatch }) => {
			debug.log('formSubmit', 'Form saved:', state.formValues);

			// Dispatch to parent components
			dispatch('CATALOG_FORM_SAVED', {
				formValues: state.formValues,
				sourceTable: state.properties.sourceTable,
				sourceId: state.properties.sourceId
			});
		},
		'FORM_RESET': ({ action, updateState, state, properties }) => {
			// Re-create comprehensive field objects with original values
			const resetFields = createComprehensiveFields(
				properties.fields,
				properties.variablesLayout,
				properties.sourceTable,
				properties.sourceId
			);

			updateState({
				fields: resetFields,
				formMessages: [],
				formValid: true
			});
		},
		'FORM_INITIAL_VALIDATION': ({ action, updateState, state }) => {
			// Run silent validation on ALL fields (including empty mandatory ones)
			// Only set isInvalid flags, don't store error messages yet
			const validatedFields = { ...state.fields };
			let hasInvalidFields = false;
			
			Object.entries(state.fields).forEach(([fieldName, field]) => {
				const validationError = validateFieldValue(field, field.value);
				
				// Only set the isInvalid flag, don't store the error message
				validatedFields[fieldName] = {
					...field,
					isInvalid: validationError !== null
				};
				
				if (validationError !== null) {
					hasInvalidFields = true;
				}
			});
			
			updateState({
				fields: validatedFields,
				formValid: !hasInvalidFields
			});
		},
		'FORM_FIRST_INTERACTION': ({ action, updateState, state }) => {
			// Enable showing validation errors to the user
			updateState({
				showValidationErrors: true
			});
		},
		'FORM_VALIDATE': ({ action, updateState, state }) => {
			const { field, value } = action.payload;
			const mappedFieldName = getMappedFieldName(field);

			if (state.fields[mappedFieldName]) {
				const fieldObj = state.fields[mappedFieldName];
				const validationError = validateFieldValue(fieldObj, value);

				const updatedField = {
					...fieldObj,
					validationError: validationError,
					isInvalid: !!validationError
				};

				updateState({
					fields: {
						...state.fields,
						[mappedFieldName]: updatedField
					}
				});
			}
		},
		'REFERENCE_SEARCH': ({ action, updateState, state, dispatch }) => {
			const { field, referenceTable, searchTerm, qualifier } = action.payload;
			// Simple cache key based on field and table only
			const cacheKey = `${field}__${referenceTable}`;

			debug.log('referenceSearch', 'REFERENCE_SEARCH triggered:', { field, referenceTable, searchTerm, qualifier, cacheKey });

			// Get field configuration to access tableFields
			const fieldConfig = state.fields[field];
			if (!fieldConfig) {
				debug.error('referenceField', 'Field configuration not found for:', field);
				return;
			}

			// Check if we already have basic data cached for this field
			// Only cache the initial load (when searchTerm is empty), always fetch for searches
			// But if searchTerm becomes empty after a search, we need to refresh the cache
			if (!searchTerm && state.referenceData[cacheKey] && !state.referenceData[`${cacheKey}_searched`]) {
				debug.log('referenceCache', 'Initial data already cached for field:', cacheKey);
				return; // Already have the initial data
			}

			// If clearing search term after a search, clear the search flag and refetch
			if (!searchTerm && state.referenceData[`${cacheKey}_searched`]) {
				debug.log('referenceSearch', 'Clearing search results and fetching initial data for:', cacheKey);
				// Clear the searched flag to allow fresh fetch of initial data
				updateState({
					referenceData: {
						...state.referenceData,
						[`${cacheKey}_searched`]: undefined
					}
				});
			}

			// Mark as loading
			updateState({
				referenceLoading: {
					...state.referenceLoading,
					[cacheKey]: true
				}
			});

			// Extract field names from tableFields
			const tableFields = fieldConfig.tableFields || [];
			const fieldNames = tableFields.map(tf => tf.element.value);

			// Always include sys_id for reference fields
			const allFields = ['sys_id', ...fieldNames];

			// Build search query using tableFields
			let query = '';
			if (searchTerm && fieldNames.length > 0) {
				// Create OR query for each searchable field
				const searchQueries = fieldNames.map(fieldName => `${fieldName}LIKE${searchTerm}`);
				query = searchQueries.join('^OR');
			}
			if (qualifier) {
				query = qualifier + (query ? `^${query}` : '');
			}

			// Ensure consistent ordering for pagination if no ORDER BY is present
			if (!query.toUpperCase().includes('ORDERBY') && !query.toUpperCase().includes('ORDERBYDESC')) {
				// Use the first field as the primary ordering field, fallback to sys_id
				const primaryField = fieldNames.length > 0 ? fieldNames[0] : 'sys_id';
				const orderByClause = `ORDERBY${primaryField}`;
				query = query ? `${query}^${orderByClause}` : orderByClause;
			}

			debug.log('referenceSearch', 'Built query:', query);
			debug.log('referenceSearch', 'Fields to retrieve:', allFields);

			// Dispatch the fetch action with metadata
			dispatch('REFERENCE_FETCH',
				{
					referenceTable,
					sysparm_query: query,
					sysparm_limit: 20,
					sysparm_fields: allFields.join(',')
				},
				// Pass metadata as third parameter
				{ field, referenceTable, searchTerm, qualifier, cacheKey, tableFields }
			);
		},
		'REFERENCE_LOAD_MORE': ({ action, updateState, state, dispatch }) => {
			const { field, referenceTable } = action.payload;
			const cacheKey = `${field}__${referenceTable}`;

			// Get pagination info for this field
			const paginationInfo = state.referencePagination?.[cacheKey];
			if (!paginationInfo?.hasMore || !paginationInfo?.nextUrl) {
				debug.log('referenceSearch', 'No more data to load for:', cacheKey);
				return;
			}

			// Check if already loading more to prevent duplicate requests
			if (state.referenceLoading?.[`${cacheKey}_loadmore`]) {
				debug.log('referenceSearch', 'Already loading more data for:', cacheKey);
				return;
			}

			// Mark as loading
			updateState({
				referenceLoading: {
					...state.referenceLoading,
					[`${cacheKey}_loadmore`]: true
				}
			});

			// Extract query params from nextUrl
			const url = new URL(paginationInfo.nextUrl);
			const queryParams = Object.fromEntries(url.searchParams.entries());

			// Get field configuration for tableFields
			const fieldConfig = state.fields[field];
			const tableFields = fieldConfig?.tableFields || [];

			debug.log('referenceSearch', 'Loading more data:', { cacheKey, nextUrl: paginationInfo.nextUrl, queryParams });

			// Dispatch fetch with existing query parameters from nextUrl
			dispatch('REFERENCE_FETCH',
				{
					referenceTable,
					...queryParams
				},
				// Pass metadata with isLoadMore flag
				{ field, referenceTable, cacheKey, tableFields, isLoadMore: true }
			);
		},
		'REFERENCE_FETCH': createHttpEffect('/api/now/table/:referenceTable', {
			method: 'GET',
			pathParams: ['referenceTable'],
			queryParams: ['sysparm_query', 'sysparm_limit', 'sysparm_fields', 'sysparm_offset'],
			batch: false,
			successActionType: 'REFERENCE_SEARCH_SUCCESS',
			errorActionType: 'REFERENCE_SEARCH_ERROR'
		}),
		'REFERENCE_SEARCH_SUCCESS': ({ action, updateState, state }) => {
			debug.log('referenceSearch', 'REFERENCE_SEARCH_SUCCESS received - full action:', action);

			// ServiceNow HTTP effects put the response in action.payload.result
			const records = action.payload?.result || [];

			// Parse pagination info from response headers
			const responseHeaders = action.meta?.responseHeaders || {};
			const linkHeader = responseHeaders.link || '';

			debug.log('httpRequests', 'Response headers:', responseHeaders);
			debug.log('httpRequests', 'Link header raw:', linkHeader);

			// Parse the Link header for pagination URLs
			const hasMore = linkHeader.includes('rel="next"');
			let nextUrl = null;
			if (hasMore) {
				const nextMatch = linkHeader.match(/<([^>]+)>;rel="next"/);
				nextUrl = nextMatch ? nextMatch[1] : null;
			}

			debug.log('referenceSearch', 'Pagination parsing:', {
				linkHeader,
				hasMore,
				nextUrl,
				linkHeaderLength: linkHeader.length,
				includesNext: linkHeader.includes('rel="next"')
			});

			// Get metadata from the action
			const { cacheKey, field, referenceTable, tableFields, isLoadMore } = action.meta || {};

			// Transform ServiceNow response to our format
			const options = (Array.isArray(records) ? records : []).map(record => {
				// Build label using tableFields configuration
				let primaryLabel = record.sys_id; // Fallback to sys_id
				let secondaryInfo = '';

				if (tableFields && tableFields.length > 0) {
					// First field is primary display field
					const primaryField = tableFields[0].element.value;
					primaryLabel = record[primaryField] || record.sys_id;

					// Additional fields are secondary info
					if (tableFields.length > 1) {
						const secondaryFields = tableFields.slice(1);
						const secondaryValues = secondaryFields
							.map(tf => record[tf.element.value])
							.filter(val => val && val.trim()) // Filter out empty values
							.join(' • ');

						secondaryInfo = secondaryValues;
					}
				} else {
					// Fallback to hardcoded logic for backwards compatibility
					if (record.first_name && record.last_name) {
						primaryLabel = `${record.first_name} ${record.last_name}`;
					} else if (record.name) {
						primaryLabel = record.name;
					} else if (record.user_name) {
						primaryLabel = record.user_name;
					}
				}

				const option = {
					value: record.sys_id,
					label: primaryLabel || record.sys_id,
					secondaryInfo: secondaryInfo
				};

				return option;
			});

			debug.log('referenceSearch', 'Final options array:', options);
			debug.log('referenceSearch', 'Updating state with options:', { cacheKey, optionsCount: options.length });

			// Only update if we have a valid cacheKey
			if (cacheKey) {
				// If this is a "load more" request, append to existing options
				const existingOptions = isLoadMore ? (state.referenceData[cacheKey] || []) : [];
				const allOptions = isLoadMore ? [...existingOptions, ...options] : options;

				// Clear both regular and load more loading states
				const newReferenceLoading = { ...state.referenceLoading };
				newReferenceLoading[cacheKey] = false;
				newReferenceLoading[`${cacheKey}_loadmore`] = false;

				const paginationInfo = {
					hasMore,
					nextUrl,
					totalLoaded: allOptions.length
				};

				debug.log('referenceSearch', 'Storing pagination info:', { cacheKey, paginationInfo });

				// Get metadata to check if this was a search
				const { searchTerm } = action.meta || {};

				// Build new reference data state
				const newReferenceData = {
					...state.referenceData,
					[cacheKey]: allOptions
				};

				// Mark if this was a search result (to track when user clears search)
				if (searchTerm) {
					newReferenceData[`${cacheKey}_searched`] = true;
				}

				updateState({
					referenceData: newReferenceData,
					referenceLoading: newReferenceLoading,
					// Store pagination info
					referencePagination: {
						...state.referencePagination,
						[cacheKey]: paginationInfo
					}
				});
			} else {
				debug.error('referenceField', 'No cacheKey found for reference response');
			}
		},
		'REFERENCE_SEARCH_ERROR': ({ action, updateState, state }) => {
			debug.error('httpRequests', 'REFERENCE_SEARCH_ERROR received - full action:', action);
			debug.error('httpRequests', 'Action metadata:', action.meta);

			// Get metadata from the action
			const { cacheKey, referenceTable } = action.meta || {};

			debug.error('referenceField', 'Reference search failed for:', { cacheKey, referenceTable });

			if (cacheKey) {
				updateState({
					referenceLoading: {
						...state.referenceLoading,
						[cacheKey]: false
					}
				});
			}
		}
	},
	initialState: {
		// Comprehensive field objects (source of truth)
		fields: {},

		// Reference field data cache
		referenceData: {},
		referenceLoading: {},
		referencePagination: {},

		// Transformed scripts and policies
		clientScripts: {},
		uiPolicies: [],
		validationScripts: [],

		// Form-level state
		formMessages: [],
		formValid: true,

		// ServiceNow globals
		globals: {
			g_user: null,
			g_scratchpad: {}
		}
	}
});
