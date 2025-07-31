import React, { useEffect, useRef, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../../../components/ui/dialog.jsx";
import { Button } from "../../../../../components/ui/button.jsx";
import { Loader2 } from 'lucide-react';
import { FormLayout } from "../../../tf-catalog-form/components/FormLayout.jsx";
import { GFormAPI } from "../../../../lib/GFormAPI.js";
import { UIPolicyEngine } from "../../../../lib/UIPolicyEngine.js";
import { ClientScriptEngine } from "../../../../lib/ClientScriptEngine.js";
import { normalizeVariablesLayout, debugLayoutTransformation } from "../../../tf-catalog-form/utils/layoutNormalizer.js";

/**
 * MRVS Modal Form React Bridge View
 *
 * This is the React component that handles the UI rendering and engine management
 * for the MRVS modal form. It follows the same pattern as tf-catalog-form.
 */
export default function TfMRVSModalForm(state) {
    const { dispatch, properties, state: internalState } = state;

    // Extract all properties passed from container
    const {
        active,
        variableSetName,
        action,
        onClose,
        rowIndex,
        sourceTable,
        sourceId,
        fields,
        variablesLayout,
        isLoading,
        error,
        formMessages,
        formValid,
        clientScripts,
        uiPolicies,
        globals,
        referenceData,
        referenceLoading,
        referencePagination,
        changesBatch
    } = properties;

    // Get hostElement from bridge component's own state (like tf-catalog-form)
    const { hostElement } = internalState;

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

    // Normalize the variables layout
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

    // dispatch is available from the state parameter

    // Initialize g_form API and engines when data is loaded
    useEffect(() => {
        if (isLoading || !fields || Object.keys(fields).length === 0) {
            return;
        }

        // Extract variable set internal name from field names
        // Field names are like "variables.developer_test_set.field_name"
        let variableSetInternalName = null;
        const firstFieldName = Object.keys(fields)[0];
        if (firstFieldName && firstFieldName.startsWith('variables.')) {
            const parts = firstFieldName.split('.');
            if (parts.length >= 3) {
                variableSetInternalName = parts[1]; // Get the variable set name part
            }
        }

        // Create g_form API instance with variable set name for proper field normalization
        gFormRef.current = new GFormAPI(
            fields || {},
            formValues || {},
            validationErrors || {},
            dispatch,
            variableSetInternalName
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

        // Make g_form globally available (temporarily for this modal)
        const previousGForm = window.g_form;
        window.g_form = gFormRef.current;

        // Execute onLoad scripts and evaluate UI policies on load
        setTimeout(() => {
            isLoadingRef.current = false;
            if (clientScriptEngineRef.current) {
                clientScriptEngineRef.current.executeOnLoad(formValues);
            }
            if (uiPolicyEngineRef.current) {
                uiPolicyEngineRef.current.evaluateAll(formValues, true);
            }

            // Run initial validation on all fields after everything is set up
            dispatch('FORM_INITIAL_VALIDATION', {});
        }, 0);

        return () => {
            // Restore previous g_form
            if (typeof window !== 'undefined' && window.g_form === gFormRef.current) {
                window.g_form = previousGForm;
            }
        };
    }, [fields, isLoading]);

    // Update g_form when state changes
    useEffect(() => {
        if (gFormRef.current) {
            gFormRef.current.updateState(fields, formValues, validationErrors);
        }
    }, [fields]);

    // Update engines when scripts/policies change
    useEffect(() => {
        if (uiPolicyEngineRef.current) {
            uiPolicyEngineRef.current.updatePolicies(uiPolicies);
            // Re-evaluate policies when they change
            uiPolicyEngineRef.current.evaluateAll(formValues, false);
        }
    }, [uiPolicies]);

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
        dispatch('FORM_VALUE_CHANGE', { field, value });
    };

    // Handle form submission
    const handleSubmit = () => {
        // Run form validation
        let isValid = true;
        if (gFormRef.current) {
            isValid = gFormRef.current.validate();
        }

        // Execute onSubmit client scripts
        if (clientScriptEngineRef.current) {
            const shouldContinue = clientScriptEngineRef.current.executeOnSubmit();

            // If any onSubmit script returns false, don't submit
            if (!shouldContinue) {
                isValid = false;
            }
        }

        // Prepare row data for the container
        if (isValid) {
            const rowData = {};
            Object.keys(formValues).forEach(fieldName => {
                const fieldValue = formValues[fieldName];
                // Remove the full field name prefix to get just the variable name
                const variableName = fieldName.split('.').pop();
                rowData[variableName] = fieldValue;
            });

            // Dispatch to container component
            dispatch('FORM_SUBMIT', {
                rowData,
                isValid: true
            });
        } else {
            dispatch('FORM_SUBMIT', {
                rowData: null,
                isValid: false
            });
        }
    };

    // Handle form cancellation
    const handleCancel = () => {
        dispatch('FORM_CANCEL');
    };

    // Handle field validation
    const handleValidation = (field, value) => {
        dispatch('FORM_VALIDATE', { field, value });
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

    // Don't render if not active
    if (!active) return null;

    const modalTitle = action === 'add'
        ? `Add Row - ${variableSetName}`
        : `Edit Row - ${variableSetName}`;

    return (
        <Dialog open={active} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
                container={shadowRoot}
            >
                <DialogHeader>
                    <DialogTitle>{modalTitle}</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {isLoading && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-muted-foreground">Loading form...</span>
                        </div>
                    )}

                    {error && (
                        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
                            {error}
                        </div>
                    )}

                    {!isLoading && !error && Object.keys(fields).length > 0 && (
                        <FormLayout
                            fields={fields}
                            variablesLayout={normalizedVariablesLayout}
                            formValues={formValues}
                            validationErrors={validationErrors}
                            fieldStates={fieldStates}
                            showValidationErrors={true}
                            readOnlyOption="default"
                            renderStyle="default"
                            variableGap="md"
                            noGutter={false}
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
                            onReset={() => {}}
                        />
                    )}
                </div>

                <div className="flex justify-end gap-2 px-6 py-4 border-t">
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading || !formValid}
                    >
                        {action === 'add' ? 'Add Row' : 'Update Row'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
