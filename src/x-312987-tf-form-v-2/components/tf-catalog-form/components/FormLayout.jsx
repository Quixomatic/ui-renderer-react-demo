import React from 'react';
import { Button } from '../../../../components/ui/button.jsx';
import { FieldRenderer } from './FieldRenderer.jsx';
import { Container } from './Container.jsx';

/**
 * FormLayout - Regular React Component
 * 
 * This component handles the overall layout of the catalog form based on the
 * variablesLayout configuration. It renders containers and fields in the correct order.
 * 
 * No ServiceNow registration needed - this is just a regular React component!
 */
export function FormLayout({
    fields,
    variablesLayout,
    formValues,
    validationErrors,
    fieldStates,
    showValidationErrors,
    readOnlyOption,
    renderStyle,
    variableGap,
    noGutter,
    shadowRoot,
    referenceData,
    referenceLoading,
    referencePagination,
    onValueChange,
    onValidation,
    onReferenceSearch,
    onReferenceLoadMore,
    onAttachmentUpload,
    onAttachmentDelete,
    onSubmit,
    onReset
}) {
    // Helper function to render a layout item
    const renderLayoutItem = (item, index) => {
        if (item.type === 'container') {
            return (
                <Container
                    key={item.name || index}
                    config={item}
                    fields={fields}
                    formValues={formValues}
                    validationErrors={validationErrors}
                    fieldStates={fieldStates}
                    showValidationErrors={showValidationErrors}
                    readOnlyOption={readOnlyOption}
                    renderStyle={renderStyle}
                    variableGap={variableGap}
                    shadowRoot={shadowRoot}
                    referenceData={referenceData}
                    referenceLoading={referenceLoading}
                    referencePagination={referencePagination}
                    onValueChange={onValueChange}
                    onValidation={onValidation}
                    onReferenceSearch={onReferenceSearch}
                    onReferenceLoadMore={onReferenceLoadMore}
                    onAttachmentUpload={onAttachmentUpload}
                    onAttachmentDelete={onAttachmentDelete}
                />
            );
        } else if (item.type === 'field') {
            const fieldConfig = fields[item.name];
            if (!fieldConfig) {
                console.warn(`Field configuration not found for: ${item.name}`);
                return null;
            }

            return (
                <FieldRenderer
                    key={item.name}
                    name={item.name}
                    config={fieldConfig}
                    value={formValues[item.name]}
                    error={validationErrors[item.name]}
                    fieldStates={fieldStates}
                    showValidationErrors={showValidationErrors}
                    readOnlyOption={readOnlyOption}
                    renderStyle={renderStyle}
                    variableGap={variableGap}
                    layoutItem={item}
                    shadowRoot={shadowRoot}
                    referenceData={referenceData}
                    referenceLoading={referenceLoading}
                    referencePagination={referencePagination}
                    allFields={fields}
                    onValueChange={onValueChange}
                    onValidation={onValidation}
                    onReferenceSearch={onReferenceSearch}
                    onReferenceLoadMore={onReferenceLoadMore}
                    onAttachmentUpload={onAttachmentUpload}
                    onAttachmentDelete={onAttachmentDelete}
                />
            );
        }

        return null;
    };

    // Calculate gap classes based on variableGap setting
    const gapClass = {
        'sm': 'space-y-2',
        'md': 'space-y-4',
        'lg': 'space-y-6',
        'xl': 'space-y-8'
    }[variableGap] || 'space-y-4';

    return (
        <div className={`form-layout ${noGutter ? 'no-gutter' : ''}`}>
            {/* Form Fields */}
            <div className={gapClass}>
                {variablesLayout.length > 0 ? (
                    variablesLayout.map(renderLayoutItem)
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>No form layout configured</p>
                        <p className="text-xs mt-2">Configure variablesLayout to display fields</p>
                    </div>
                )}
            </div>

            {/* Form Actions */}
            {variablesLayout.length > 0 && (
                <div className="form-actions mt-6 pt-4 border-t flex gap-2">
                    <Button 
                        onClick={onSubmit}
                        disabled={readOnlyOption === 'printable'}
                    >
                        Submit
                    </Button>
                    <Button 
                        variant="outline" 
                        onClick={onReset}
                        disabled={readOnlyOption === 'printable'}
                    >
                        Reset
                    </Button>
                </div>
            )}
        </div>
    );
}