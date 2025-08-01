import React, { useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card.jsx";
import { FormLayout } from "./components/FormLayout.jsx";
import { GFormAPI } from "../../lib/GFormAPI.js";
import { UIPolicyEngine } from "../../lib/UIPolicyEngine.js";
import { ClientScriptEngine } from "../../lib/ClientScriptEngine.js";
import { normalizeVariablesLayout, debugLayoutTransformation } from "./utils/layoutNormalizer.js";
import debug from "../../lib/debug.js";

/**
 * Main TurboForge Catalog Form View
 *
 * This is the React bridge component that receives all props from the Snabbdom parent.
 * From this point on, all child components are regular React components that don't need
 * ServiceNow registration.
 *
 * This component also initializes the g_form API to make it globally available.
 */
export default function TfCatalogForm(state) {
    const { dispatch, properties, state: internalState } = state;
	const { hostElement } = internalState;
    const {
        formData,
        fields,
        variablesLayout,
        formMessages,
        formValid,
        showValidationErrors,
        readOnlyOption,
        renderStyle,
        variableGap,
        noGutter,
        sourceTable,
        sourceId,
        globals,
        clientScripts,
        uiPolicies,
        referenceData,
        referenceLoading,
        referencePagination,
        changesBatch
    } = properties;

    // Get shadow root for portal rendering
    const shadowRoot = hostElement?.shadowRoot;

    // Debug component lifecycle
    useEffect(() => {
        debug.log('componentMount', '🟢 TfCatalogForm MOUNTED');
        return () => {
            debug.log('componentMount', '🔴 TfCatalogForm UNMOUNTING');
        };
    }, []);

    // Create derived objects using useMemo for optimal performance
    const formValues = useMemo(() => {
        const values = {};
        Object.entries(fields || {}).forEach(([fieldName, field]) => {
            values[fieldName] = {
                value: field.value,
                displayValue: field.displayValue
            };
        });
        return values;
    }, [fields]);

    const fieldStates = useMemo(() => {
        const states = {};
        Object.entries(fields || {}).forEach(([fieldName, field]) => {
            states[fieldName] = {
                visible: field.visible,
                readonly: field.readonly,
                mandatory: field.mandatory,
                disabled: field.disabled,
                label: field.label
            };
        });
        return states;
    }, [fields]);

    const validationErrors = useMemo(() => {
        const errors = {};
        Object.entries(fields || {}).forEach(([fieldName, field]) => {
            if (field.validationError) {
                errors[fieldName] = field.validationError;
            }
        });
        return errors;
    }, [fields]);

    const fieldMessages = useMemo(() => {
        const messages = {};
        Object.entries(fields || {}).forEach(([fieldName, field]) => {
            if (field.messages && field.messages.length > 0) {
                messages[fieldName] = field.messages;
            }
        });
        return messages;
    }, [fields]);

    // Memoize the fields object to prevent unnecessary re-renders downstream
    // This is crucial to prevent component unmounting/remounting on every field change
    const memoizedFields = useMemo(() => {
        return fields;
    }, [
        // Only recalculate if the number of fields changes or field structure changes
        Object.keys(fields || {}).length,
        // Create a shallow hash of field names and types to detect structural changes
        Object.keys(fields || {}).map(key => `${key}:${fields[key]?.type}`).join('|')
    ]);

    // Normalize the variables layout to handle ServiceNow's weird checkbox_container patterns
    const normalizedVariablesLayout = useMemo(() => {
        const normalized = normalizeVariablesLayout(variablesLayout);
        debugLayoutTransformation(variablesLayout, normalized);
        return normalized;
    }, [variablesLayout]);

    const gFormRef = useRef(null);
    const uiPolicyEngineRef = useRef(null);
    const clientScriptEngineRef = useRef(null);
    const isLoadingRef = useRef(true);
    const hasInteractedRef = useRef(false);

    // Initialize g_form API and engines
    useEffect(() => {
        // Create g_form API instance
        gFormRef.current = new GFormAPI(
            fields || {},
            formValues || {},
            validationErrors || {},
            dispatch
        );

        // Create UI Policy Engine
        uiPolicyEngineRef.current = new UIPolicyEngine(
            uiPolicies || [],
            fields || {},
            dispatch
        );

        // Create Client Script Engine
        clientScriptEngineRef.current = new ClientScriptEngine(
            clientScripts || {},
            fields || {},
            dispatch
        );


        // Connect engines to g_form
        uiPolicyEngineRef.current.setGForm(gFormRef.current);
        clientScriptEngineRef.current.setGForm(gFormRef.current);
        clientScriptEngineRef.current.setGlobals(globals);

        // Make g_form globally available like ServiceNow does
        if (typeof window !== 'undefined') {
            window.g_form = gFormRef.current;
        }

        // Execute onLoad scripts and evaluate UI policies on load
        setTimeout(() => {
            isLoadingRef.current = false;
            clientScriptEngineRef.current.executeOnLoad(formValues);
            uiPolicyEngineRef.current.evaluateAll(formValues, true);

            // Run initial validation on all fields after everything is set up
            dispatch('FORM_INITIAL_VALIDATION', {});
        }, 0);

        return () => {
            // Clean up global reference
            if (typeof window !== 'undefined' && window.g_form === gFormRef.current) {
                window.g_form = null;
            }
        };
    }, []);

    // Update g_form when state changes
    useEffect(() => {
        if (gFormRef.current) {
            gFormRef.current.updateState(fields, formValues, validationErrors);
        }
    }, [fields]); // Only depend on fields - formValues and validationErrors are derived from fields

    // Update engines when scripts/policies change
    useEffect(() => {
        if (uiPolicyEngineRef.current) {
            uiPolicyEngineRef.current.updatePolicies(uiPolicies);
            // Re-evaluate policies when they change
            uiPolicyEngineRef.current.evaluateAll(formValues, false);
        }
    }, [uiPolicies]); // Only depend on uiPolicies - formValues is derived from fields

    useEffect(() => {
        if (clientScriptEngineRef.current) {
            clientScriptEngineRef.current.updateScripts(clientScripts);
        }
    }, [clientScripts]);

    // Process changes batch for client script execution
    useEffect(() => {
        if (changesBatch && Object.keys(changesBatch).length > 0 && !isLoadingRef.current) {
            // Process all batched changes with fresh g_form state
            Object.entries(changesBatch).forEach(([field, changeData]) => {
                const { oldValue, value } = changeData;

                // Execute onChange scripts with updated g_form state
                if (clientScriptEngineRef.current) {
                    clientScriptEngineRef.current.executeOnChange(
                        field,
                        oldValue,
                        value,
                        isLoadingRef.current
                    );
                }

                // Re-evaluate UI policies with updated form values
                if (uiPolicyEngineRef.current) {
                    uiPolicyEngineRef.current.onFieldChange(field, formValues);
                }
            });

            // Clear the batch after processing
            dispatch('CHANGES_PROCESSED');
        }
    }, [changesBatch]); // Runs when changesBatch updates from main component

    // Handle value changes from child components
    const handleValueChange = (field, value) => {
        // Track first interaction
        if (!hasInteractedRef.current) {
            hasInteractedRef.current = true;
            dispatch('FORM_FIRST_INTERACTION', {});
        }

        // Dispatch the change - client scripts will be handled via changesBatch useEffect
        dispatch('VALUE_CHANGE', { field, value });
    };

    // Handle form submission
    const handleSubmit = () => {
        // Execute onSubmit scripts
        if (clientScriptEngineRef.current) {
            const shouldContinue = clientScriptEngineRef.current.executeOnSubmit();

            // If any onSubmit script returns false, don't submit
            if (!shouldContinue) {
                return;
            }
        }

        dispatch('SUBMIT_FORM', { formValues });
    };

    // Handle form reset
    const handleReset = () => {
        dispatch('RESET_FORM');
    };

    // Handle field validation
    const handleValidation = (field, value) => {
        dispatch('VALIDATE_FIELD', { field, value });
    };

    // Handle reference field searches
    const handleReferenceSearch = (field, referenceTable, searchTerm, qualifier, metadata) => {
        dispatch('REFERENCE_SEARCH', {
            field,
            referenceTable,
            searchTerm: searchTerm || '',
            qualifier,
            metadata
        });
    };

    // Handle reference field load more
    const handleReferenceLoadMore = (field, referenceTable) => {
        dispatch('REFERENCE_LOAD_MORE', {
            field,
            referenceTable
        });
    };

    // Handle attachment upload
    const handleAttachmentUpload = (fieldName, file, uploadContext) => {
        dispatch('ATTACHMENT_UPLOAD', {
            fieldName,
            file,
            uploadContext
        });
    };

    // Handle attachment delete
    const handleAttachmentDelete = (fieldName, attachmentId) => {
        dispatch('ATTACHMENT_DELETE', {
            fieldName,
            attachmentId
        });
    };

    return (
        <div className="tf-catalog-form">
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>TurboForge Catalog Form</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        React-powered catalog form with shadcn/ui components
                    </p>
                </CardHeader>
                <CardContent>
                    <FormLayout
                        fields={memoizedFields}
                        variablesLayout={normalizedVariablesLayout}
                        formValues={formValues}
                        validationErrors={validationErrors}
                        fieldStates={fieldStates}
                        showValidationErrors={showValidationErrors}
                        readOnlyOption={readOnlyOption}
                        renderStyle={renderStyle}
                        variableGap={variableGap}
                        noGutter={noGutter}
                        shadowRoot={shadowRoot}
                        referenceData={referenceData}
                        referenceLoading={referenceLoading}
                        referencePagination={referencePagination}
                        onValueChange={handleValueChange}
                        onValidation={handleValidation}
                        onReferenceSearch={handleReferenceSearch}
                        onReferenceLoadMore={handleReferenceLoadMore}
                        onAttachmentUpload={handleAttachmentUpload}
                        onAttachmentDelete={handleAttachmentDelete}
                        onSubmit={handleSubmit}
                        onReset={handleReset}
                    />

                    {/* Debug info - remove in production */}
                    <div className="mt-6 pt-4 border-t">
                        <details className="text-xs">
                            <summary className="cursor-pointer text-muted-foreground">Debug Info</summary>
                            <div className="mt-2 space-y-2">
                                <div>
                                    <strong>Source:</strong> {sourceTable} ({sourceId})
                                </div>
                                <div>
                                    <strong>Fields:</strong> {Object.keys(fields).length} fields
                                </div>
                                <div>
                                    <strong>Layout Items:</strong> {variablesLayout.length} items
                                </div>
                                <div>
                                    <strong>Form Values:</strong>
                                    <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-32">
                                        {JSON.stringify(formValues, null, 2)}
                                    </pre>
                                </div>
								<div>
									<strong>Field States:</strong>
									<pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-32">
										{JSON.stringify(fieldStates, null, 2)}
									</pre>
								</div>
                                {uiPolicies && uiPolicies.length > 0 && (
                                    <div>
                                        <strong>UI Policies:</strong>
                                        <pre className="text-xs bg-blue-50 p-2 rounded mt-1 overflow-auto max-h-32">
                                            {JSON.stringify(uiPolicies, null, 2)}
                                        </pre>
                                    </div>
                                )}
                                {clientScripts && Object.keys(clientScripts).length > 0 && (
                                    <div>
                                        <strong>Client Scripts:</strong>
                                        <pre className="text-xs bg-green-50 p-2 rounded mt-1 overflow-auto max-h-32">
                                            {JSON.stringify(clientScripts, null, 2)}
                                        </pre>
                                    </div>
                                )}
                                {Object.keys(validationErrors).length > 0 && (
                                    <div>
                                        <strong>Validation Errors:</strong>
                                        <pre className="text-xs bg-destructive/10 p-2 rounded mt-1">
                                            {JSON.stringify(validationErrors, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </details>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
