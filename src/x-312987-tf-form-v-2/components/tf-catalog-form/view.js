import React, { useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card.jsx";
import { FormLayout } from "./components/FormLayout.jsx";
import { GFormAPI } from "../../lib/GFormAPI.js";
import { UIPolicyEngine } from "../../lib/UIPolicyEngine.js";
import { ClientScriptEngine } from "../../lib/ClientScriptEngine.js";

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
        referencePagination
    } = properties;

    // Get shadow root for portal rendering
    const shadowRoot = hostElement?.shadowRoot;

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

    const gFormRef = useRef(null);
    const uiPolicyEngineRef = useRef(null);
    const clientScriptEngineRef = useRef(null);
    const isLoadingRef = useRef(true);

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

    // Handle value changes from child components
    const handleValueChange = (field, value) => {
        // Get old value before change
        const oldValue = formValues[field];

        // Dispatch the change
        dispatch('VALUE_CHANGE', { field, value });

        // Execute onChange scripts and re-evaluate UI policies
        setTimeout(() => {
            if (clientScriptEngineRef.current) {
                clientScriptEngineRef.current.executeOnChange(
                    field,
                    oldValue,
                    value,
                    isLoadingRef.current
                );
            }

            if (uiPolicyEngineRef.current) {
                // Need to get updated formValues after dispatch
                const updatedFormValues = { ...formValues, [field]: value };
                uiPolicyEngineRef.current.onFieldChange(field, updatedFormValues);
            }
        }, 0);
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
    const handleReferenceSearch = (field, referenceTable, searchTerm, qualifier) => {
        dispatch('REFERENCE_SEARCH', {
            field,
            referenceTable,
            searchTerm: searchTerm || '',
            qualifier
        });
    };

    // Handle reference field load more
    const handleReferenceLoadMore = (field, referenceTable) => {
        dispatch('REFERENCE_LOAD_MORE', {
            field,
            referenceTable
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
                        fields={fields}
                        variablesLayout={variablesLayout}
                        formValues={formValues}
                        validationErrors={validationErrors}
                        fieldStates={fieldStates}
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
