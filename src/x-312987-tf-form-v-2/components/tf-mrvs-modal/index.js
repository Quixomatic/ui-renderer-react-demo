/**
 * ServiceNow MRVS Modal Component
 *
 * This is a separate ServiceNow component that handles the modal form
 * for Multi-Row Variable Set (MRVS) row editing. It provides complete
 * isolation from the main form component.
 */

import { createCustomElement, actionTypes } from "@servicenow/ui-core";
import { createGraphQLEffect } from "@servicenow/ui-effect-graphql";
import { createHttpEffect } from "@servicenow/ui-effect-http";
import snabbdom from "@servicenow/ui-renderer-snabbdom";
import view from "./view";
import { buildMRVSQuery, transformMRVSResponse } from "../../utils/mrvsGraphQLQuery.js";
import {
	createComprehensiveFields,
	updateFieldValue,
	updateFieldState,
	getMappedFieldName,
} from "../../utils/fieldUtils.js";
import { transformClientScripts, transformUIPolicies, transformValidationScripts } from "../../utils/transformUtils.js";

const { COMPONENT_BOOTSTRAPPED } = actionTypes;

// GraphQL effect for loading MRVS data
const loadMRVSData = createGraphQLEffect(buildMRVSQuery(), {
	variableList: ["variableSetId", "rowData"],
	successActionType: "MRVS_DATA_LOADED",
	errorActionType: "MRVS_LOAD_ERROR",
	batch: false,
});

createCustomElement("x-312987-tf-mrvs-modal", {
	renderer: { type: snabbdom },
	view,

	properties: {
		// Modal control
		active: {
			default: false,
		},

		// MRVS identification
		variableSetId: {
			default: "",
		},
		variableSetName: {
			default: "",
		},

		// Source context
		sourceTable: {
			default: "",
		},
		sourceId: {
			default: "",
		},

		// Row data
		rowData: {
			default: {},
		},
		rowIndex: {
			default: null,
		},
		action: {
			default: "add", // 'add' or 'edit'
		},

		// Parent fields for context
		parentFields: {
			default: {},
		},

		// Callbacks
		onSave: {
			default: () => {},
		},
		onClose: {
			default: () => {},
		},
	},

	initialState: {
		// Data loading state
		isLoading: false,
		error: null,

		// Comprehensive field objects (source of truth)
		fields: {},
		variablesLayout: [],

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
			g_scratchpad: {},
		},

		// Reference field data management
		referenceData: {},
		referenceLoading: {},
		referencePagination: {},

		// Field change batch for client script execution
		changesBatch: {},
	},

	actionHandlers: {
		[COMPONENT_BOOTSTRAPPED]: ({ dispatch, updateState, state, host, properties }) => {
			// Initialize ServiceNow globals
			const globals = {
				g_user: window.g_user || {},
				g_scratchpad: window.g_scratchpad || {},
				g_modal: window.g_modal || null,
				g_ck: window.g_ck || "",
			};

			// Update state with globals and host element
			updateState({
				globals: globals,
				hostElement: host,
			});

			// Only load data if modal is active and we have required info
			if (properties.active && properties.variableSetId) {
				// Prepare rowData as JSON string if editing
				const rowDataString =
					properties.action === "edit" && properties.rowData ? JSON.stringify(properties.rowData) : null;

				dispatch("MRVS_LOAD_DATA", {
					variableSetId: properties.variableSetId,
					rowData: rowDataString,
				});
			}
		},

		MRVS_LOAD_DATA: loadMRVSData,

		MRVS_DATA_LOADED: ({ action, updateState, state, properties }) => {
			const { payload } = action;

			try {
				// Transform GraphQL response to expected format
				const mrvsData = transformMRVSResponse(payload);

				// Create comprehensive field objects from the MRVS data
				const comprehensiveFields = createComprehensiveFields(
					mrvsData.fields,
					mrvsData.variablesLayout,
					properties.sourceTable || "sc_req_item",
					properties.sourceId || "",
					state.globals.g_user || {}
				);

				// Transform client scripts and policies
				const transformedClientScripts = transformClientScripts(mrvsData.clientScripts);
				const transformedUIPolicies = transformUIPolicies(mrvsData.uiPolicies);
				const transformedValidationScripts = transformValidationScripts(mrvsData.validationScripts || []);

				console.log("MRVS Data Loaded:", {
					isLoading: false,
					error: null,
					fields: comprehensiveFields,
					variablesLayout: mrvsData.variablesLayout,
					clientScripts: transformedClientScripts,
					uiPolicies: transformedUIPolicies,
					validationScripts: transformedValidationScripts,
				});

				// Update state with comprehensive data
				updateState({
					isLoading: false,
					error: null,
					fields: comprehensiveFields,
					variablesLayout: mrvsData.variablesLayout,
					clientScripts: transformedClientScripts,
					uiPolicies: transformedUIPolicies,
					validationScripts: transformedValidationScripts,
				});
			} catch (error) {
				dispatch("MRVS_LOAD_ERROR", {
					error: error.message || "Failed to parse MRVS data",
				});
			}
		},

		MRVS_LOAD_ERROR: ({ action, updateState }) => {
			updateState({
				isLoading: false,
				error: action.payload.error || "Failed to load MRVS data",
			});
		},

		FORM_VALUE_CHANGE: {
			effect: ({ action, updateState, state }) => {
				const { field, value } = action.payload;
				const mappedFieldName = getMappedFieldName(field);

				// Update the comprehensive field object
				if (state.fields[mappedFieldName]) {
					// Get old value from current state (previous render cycle)
					const oldValue = state.fields[mappedFieldName].value || '';
					
					const updatedField = updateFieldValue(state.fields[mappedFieldName], value);

					updateState({
						fields: {
							...state.fields,
							[mappedFieldName]: updatedField,
						},
						// Add to change batch for client script execution
						changesBatch: {
							...state.changesBatch,
							[mappedFieldName]: {
								oldValue,
								value: typeof value === 'object' ? (value.value || '') : (value || ''),
								timestamp: Date.now()
							}
						}
					});
				}
			},
			stopPropagation: true,
		},

		FORM_FIELD_STATE_CHANGE: {
			effect: ({ action, updateState, state }) => {
				const { field, property, value } = action.payload;
				const mappedFieldName = getMappedFieldName(field);

				// Update the comprehensive field object
				if (state.fields[mappedFieldName]) {
					const updatedField = updateFieldState(state.fields[mappedFieldName], property, value);

					updateState({
						fields: {
							...state.fields,
							[mappedFieldName]: updatedField,
						},
					});
				}
			},
			stopPropagation: true,
		},

		FORM_SUBMIT: {
			effect: ({ action, updateState, state, dispatch, properties }) => {
				// The bridge component will handle validation and script execution
				// This handler just processes the final submission
				const { rowData, isValid } = action.payload;

				if (isValid) {
					// Call the onSave callback to notify the main form
					properties.onSave({
						rowData,
						rowIndex: properties.rowIndex,
						action: properties.action,
					});
				} else {
					// Update form validity state
					updateState({
						formValid: false,
					});
				}
			},
			stopPropagation: true,
		},

		FORM_CANCEL: {
			effect: ({ properties }) => {
				properties.onClose();
			},
			stopPropagation: true,
		},

		// Additional action handlers to support g_form API operations
		FORM_MESSAGE_ADD: {
			effect: ({ action, updateState, state }) => {
				const { message } = action.payload;
				const newMessages = [...(state.formMessages || []), message];
				updateState({ formMessages: newMessages });
			},
			stopPropagation: true,
		},

		FORM_MESSAGES_CLEAR: {
			effect: ({ action, updateState, state }) => {
				const { type } = action.payload;
				let newMessages = state.formMessages || [];

				if (type === "all") {
					newMessages = [];
				} else {
					newMessages = newMessages.filter((msg) => msg.type !== type);
				}

				updateState({ formMessages: newMessages });
			},
			stopPropagation: true,
		},

		FORM_FIELD_MESSAGE_SHOW: {
			effect: ({ action, updateState, state }) => {
				const { field, message } = action.payload;
				const mappedFieldName = getMappedFieldName(field);

				if (state.fields[mappedFieldName]) {
					const updatedField = {
						...state.fields[mappedFieldName],
						messages: [...(state.fields[mappedFieldName].messages || []), message],
					};

					updateState({
						fields: {
							...state.fields,
							[mappedFieldName]: updatedField,
						},
					});
				}
			},
			stopPropagation: true,
		},

		FORM_FIELD_MESSAGE_HIDE: {
			effect: ({ action, updateState, state }) => {
				const { field, clearAll } = action.payload;
				const mappedFieldName = getMappedFieldName(field);

				if (state.fields[mappedFieldName]) {
					const currentMessages = state.fields[mappedFieldName].messages || [];
					const updatedField = {
						...state.fields[mappedFieldName],
						messages: clearAll ? [] : currentMessages.slice(1),
					};

					updateState({
						fields: {
							...state.fields,
							[mappedFieldName]: updatedField,
						},
					});
				}
			},
			stopPropagation: true,
		},

		FORM_FIELD_MESSAGES_HIDE_ALL: {
			effect: ({ action, updateState, state }) => {
				const { type } = action.payload;
				const updatedFields = {};

				Object.entries(state.fields).forEach(([fieldName, field]) => {
					if (field.messages && field.messages.length > 0) {
						updatedFields[fieldName] = {
							...field,
							messages: type ? field.messages.filter((msg) => msg.type !== type) : [],
						};
					}
				});

				if (Object.keys(updatedFields).length > 0) {
					updateState({
						fields: {
							...state.fields,
							...updatedFields,
						},
					});
				}
			},
			stopPropagation: true,
		},

		FORM_VALIDATION_FAILED: {
			effect: ({ action, updateState }) => {
				const { errors } = action.payload;
				updateState({
					validationErrors: errors,
					formValid: false,
				});
			},
			stopPropagation: true,
		},

		// Reference field search functionality
		REFERENCE_SEARCH: {
			effect: ({ action, updateState, state, dispatch }) => {
				const { field, referenceTable, searchTerm, qualifier, metadata = {} } = action.payload;
				const cacheKey = `${field}__${referenceTable}`;

				// Get field configuration to access tableFields and limit
				const fieldConfig = state.fields[field];
				if (!fieldConfig) {
					console.error('Field configuration not found for:', field);
					return;
				}

				// Get limit from parsedAttributes or use default of 20
				const limit = parseInt(fieldConfig.parsedAttributes?.limit) || 20;

				// Check if we already have basic data cached for this field
				if (!searchTerm && state.referenceData[cacheKey] && !state.referenceData[`${cacheKey}_searched`]) {
					return; // Already have the initial data
				}

				// If clearing search term after a search, clear the search flag and refetch
				if (!searchTerm && state.referenceData[`${cacheKey}_searched`]) {
					updateState({
						referenceData: {
							...state.referenceData,
							[`${cacheKey}_searched`]: undefined,
						},
					});
				}

				// Mark as loading
				updateState({
					referenceLoading: {
						...state.referenceLoading,
						[cacheKey]: true,
					},
				});

				// Extract field names from tableFields
				const tableFields = fieldConfig.tableFields || [];
				const fieldNames = tableFields.map((tf) => tf.element.value);

				// Always include sys_id for reference fields
				const allFields = ["sys_id", ...fieldNames];

				// Build search query using tableFields
				let query = "";

				// First, clean up the qualifier - remove any ^EQ (end query) markers
				let cleanQualifier = qualifier ? qualifier.replace(/\^EQ/gi, "") : "";

				if (searchTerm && fieldNames.length > 0) {
					// Create OR query for each searchable field
					const searchQueries = fieldNames.map((fieldName) => `${fieldName}LIKE${searchTerm}`);
					const searchClause = searchQueries.join("^OR");

					if (cleanQualifier) {
						// Check if qualifier contains ^NQ (new query) operators
						if (cleanQualifier.includes("^NQ")) {
							// Split by ^NQ and append search terms to each segment
							const segments = cleanQualifier.split("^NQ");
							const modifiedSegments = segments.map(segment => {
								// Don't add search to empty segments
								if (segment.trim()) {
									return `${segment}^${searchClause}`;
								}
								return segment;
							});
							query = modifiedSegments.join("^NQ");
						} else {
							// Simple case - just append search terms
							query = `${cleanQualifier}^${searchClause}`;
						}
					} else {
						// No qualifier, just use search terms
						query = searchClause;
					}
				} else {
					// No search term, use cleaned qualifier
					query = cleanQualifier;
				}

				// Ensure consistent ordering for pagination
				if (!query.toUpperCase().includes("ORDERBY") && !query.toUpperCase().includes("ORDERBYDESC")) {
					const primaryField = fieldNames.length > 0 ? fieldNames[0] : "sys_id";
					const orderByClause = `ORDERBY${primaryField}`;
					query = query ? `${query}^${orderByClause}` : orderByClause;
				}

				// Dispatch the fetch action with metadata
				dispatch(
					"REFERENCE_FETCH",
					{
						referenceTable,
						sysparm_query: query,
						sysparm_limit: limit,
						sysparm_fields: allFields.join(","),
					},
					{ field, referenceTable, searchTerm, qualifier, cacheKey, tableFields, ...metadata }
				);
			},
			stopPropagation: true,
		},

		REFERENCE_LOAD_MORE: {
			effect: ({ action, updateState, state, dispatch }) => {
				const { field, referenceTable } = action.payload;
				const cacheKey = `${field}__${referenceTable}`;

				// Get pagination info for this field
				const paginationInfo = state.referencePagination?.[cacheKey];
				if (!paginationInfo?.hasMore || !paginationInfo?.nextUrl) {
					return;
				}

				// Check if already loading more to prevent duplicate requests
				if (state.referenceLoading?.[`${cacheKey}_loadmore`]) {
					return;
				}

				// Mark as loading
				updateState({
					referenceLoading: {
						...state.referenceLoading,
						[`${cacheKey}_loadmore`]: true,
					},
				});

				// Extract query params from nextUrl
				const url = new URL(paginationInfo.nextUrl);
				const queryParams = Object.fromEntries(url.searchParams.entries());

				// Get field configuration for tableFields
				const fieldConfig = state.fields[field];
				const tableFields = fieldConfig?.tableFields || [];

				// Dispatch fetch with existing query parameters from nextUrl
				dispatch(
					"REFERENCE_FETCH",
					{
						referenceTable,
						...queryParams,
					},
					{ field, referenceTable, cacheKey, tableFields, isLoadMore: true }
				);
			},
			stopPropagation: true,
		},

		REFERENCE_FETCH: createHttpEffect("/api/now/table/:referenceTable", {
			method: "GET",
			pathParams: ["referenceTable"],
			queryParams: ["sysparm_query", "sysparm_limit", "sysparm_fields", "sysparm_offset"],
			batch: false,
			successActionType: "REFERENCE_SEARCH_SUCCESS",
			errorActionType: "REFERENCE_SEARCH_ERROR",
		}),

		REFERENCE_SEARCH_SUCCESS: {
			effect: ({ action, updateState, state }) => {
				// ServiceNow HTTP effects put the response in action.payload.result
				const records = action.payload?.result || [];

				// Parse pagination info from response headers
				const responseHeaders = action.payload?.headers || {};
				const linkHeader = responseHeaders.Link || responseHeaders.link || "";

				let hasMore = false;
				let nextUrl = null;

				if (linkHeader) {
					const linkParts = linkHeader.split(",");
					linkParts.forEach((part) => {
						if (part.includes('rel="next"')) {
							hasMore = true;
							const match = part.match(/<([^>]+)>/);
							if (match) {
								nextUrl = match[1];
							}
						}
					});
				}

				// Get metadata from the action
				const { cacheKey, tableFields = [], storeAsRaw, isLoadMore } = action.meta || {};

				if (cacheKey) {
					// Transform records into options format (unless storeAsRaw is true)
					let newData;
					if (storeAsRaw) {
						newData = records;
					} else {
						newData = records.map((record) => {
							let primaryLabel = "";
							let secondaryInfo = "";

							// Use tableFields to determine display if available
							if (tableFields && tableFields.length > 0) {
								const primaryField = tableFields[0].element.value;
								primaryLabel = record[primaryField] || record.sys_id;

								// Additional fields are secondary info
								if (tableFields.length > 1) {
									const secondaryFields = tableFields.slice(1);
									const secondaryValues = secondaryFields
										.map((tf) => {
											const fieldValue = record[tf.element.value];
											// Handle both ServiceNow field objects and plain values
											return fieldValue?.display_value || fieldValue || "";
										})
										.filter((val) => val && typeof val === "string" && val.trim()) // Filter out empty values
										.join(" • ");

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
								secondaryInfo: secondaryInfo,
							};

							return option;
						});
					}

					// If loading more, append to existing data
					let allData = newData;
					if (isLoadMore && state.referenceData[cacheKey]) {
						allData = [...state.referenceData[cacheKey], ...newData];
					}

					// Clear loading state
					const newReferenceLoading = { ...state.referenceLoading };
					newReferenceLoading[cacheKey] = false;
					newReferenceLoading[`${cacheKey}_loadmore`] = false;

					const paginationInfo = {
						hasMore,
						nextUrl,
						totalLoaded: allData.length,
					};

					// Get metadata to check if this was a search
					const { searchTerm } = action.meta || {};

					// Build new reference data state
					const newReferenceData = {
						...state.referenceData,
						[cacheKey]: allData,
					};

					// Mark if this was a search result
					if (searchTerm) {
						newReferenceData[`${cacheKey}_searched`] = true;
					}

					// Store metadata about how this data is structured
					if (storeAsRaw) {
						newReferenceData[`${cacheKey}_format`] = "raw";
					} else {
						newReferenceData[`${cacheKey}_format`] = "options";
					}

					updateState({
						referenceData: newReferenceData,
						referenceLoading: newReferenceLoading,
						referencePagination: {
							...state.referencePagination,
							[cacheKey]: paginationInfo,
						},
					});
				}
			},
			stopPropagation: true,
		},

		REFERENCE_SEARCH_ERROR: {
			effect: ({ action, updateState, state }) => {
				// Get metadata from the action
				const { cacheKey } = action.meta || {};

				if (cacheKey) {
					updateState({
						referenceLoading: {
							...state.referenceLoading,
							[cacheKey]: false,
						},
					});
				}
			},
			stopPropagation: true,
		},

		// Attachment handling
		ATTACHMENT_UPLOAD: {
			effect: async ({ action, updateState, state, dispatch }) => {
				const { fieldName, file, uploadContext } = action.payload;
				const { tableName, tableSysId, enableVirusScan } = uploadContext;

				try {
					// Create FormData for multipart upload
					const formData = new FormData();
					// Prefix tablename with ZZ_YY so attachments don't appear in lists
					const modifiedTableName = "ZZ_YY" + tableName;
					formData.append("table_name", modifiedTableName);
					formData.append("table_sys_id", tableSysId);
					formData.append("schedule_for_cleanup", "true");
					formData.append("file", file);

					// Upload to ServiceNow attachment API
					const response = await fetch("/api/now/attachment/upload", {
						method: "POST",
						body: formData,
						headers: {
							Accept: "application/json",
						},
					});

					if (!response.ok) {
						throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
					}

					const result = await response.json();

					// Dispatch value change
					const attachment = result.result;
					dispatch("FORM_VALUE_CHANGE", {
						field: fieldName,
						value: {
							value: attachment.sys_id,
							displayValue: attachment.file_name,
						},
					});
				} catch (error) {
					console.error("File upload failed:", error);
				}
			},
			stopPropagation: true,
		},

		ATTACHMENT_DELETE: {
			effect: async ({ action, updateState, state, dispatch }) => {
				const { fieldName, attachmentId } = action.payload;

				try {
					// Delete from ServiceNow
					const response = await fetch(`/api/now/attachment/${attachmentId}`, {
						method: "DELETE",
						headers: {
							Accept: "application/json",
						},
					});

					if (!response.ok) {
						throw new Error(`Delete failed: ${response.status} ${response.statusText}`);
					}

					// Dispatch value change to clear the field
					dispatch("FORM_VALUE_CHANGE", {
						field: fieldName,
						value: {
							value: "",
							displayValue: "",
						},
					});
				} catch (error) {
					console.error("Attachment deletion failed:", error);
				}
			},
			stopPropagation: true,
		},

		CHANGES_PROCESSED: {
			effect: ({ updateState }) => {
				// Clear the changes batch after processing
				updateState({
					changesBatch: {}
				});
			},
			stopPropagation: true,
		},
	},

	transformState(state) {
		const { properties } = state;

		// Update loading state when modal becomes active
		if (properties.active && !state.isLoading && Object.keys(state.fields).length === 0) {
			return {
				...state,
				isLoading: true,
			};
		}

		return state;
	},
});
