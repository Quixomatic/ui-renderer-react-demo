import React, { useState, useEffect, useMemo } from 'react';
import { FieldRenderer } from './FieldRenderer.jsx';

/**
 * Container - Regular React Component
 * 
 * This component renders container layouts with columns and grouped fields.
 * Containers can have captions and organize fields into column layouts.
 * 
 * No ServiceNow registration needed - this is just a regular React component!
 */
export function Container({
    config,
    fields,
    formValues,
    validationErrors,
    fieldStates,
    showValidationErrors,
    readOnlyOption,
    renderStyle,
    variableGap,
    shadowRoot,
    referenceData,
    referenceLoading,
    referencePagination,
    onValueChange,
    onValidation,
    onReferenceSearch,
    onReferenceLoadMore,
    onAttachmentUpload,
    onAttachmentDelete
}) {
    const { name, caption, captionDisplay, layout, columns } = config;

    // Memoize container field names to avoid recalculating on every render
    const containerFieldNames = useMemo(() => 
        columns?.flatMap(col => (col.fields || []).map(field => field.name)) || []
    , [columns]);

    // Track container visibility based on field states
    const [isContainerVisible, setIsContainerVisible] = useState(true);

    // Update container visibility when fieldStates change
    useEffect(() => {
        if (containerFieldNames.length === 0) {
            setIsContainerVisible(true);
            return;
        }

        // Check if ANY field in this container is visible
        const hasVisibleField = containerFieldNames.some(fieldName => {
            const fieldState = fieldStates?.[fieldName];
            // Default to visible if not explicitly set to false
            return fieldState?.visible !== false;
        });

        setIsContainerVisible(hasVisibleField);
    }, [fieldStates, containerFieldNames]);

    // Hide container if all fields are hidden
    if (!isContainerVisible) {
        return null;
    }

    // Calculate gap classes based on variableGap setting
    const gapClass = {
        'sm': 'gap-4',
        'md': 'gap-8',
        'lg': 'gap-10',
        'xl': 'gap-12'
    }[variableGap] || 'gap-8';

    // Render fields within a column
    const renderColumnFields = (columnFields) => {
        return columnFields.map((field, fieldIndex) => {
            if (field.type === 'field') {
                const fieldConfig = fields[field.name];
                if (!fieldConfig) {
                    console.warn(`Field configuration not found for: ${field.name}`);
                    return null;
                }

                return (
                    <FieldRenderer
                        key={field.name}
                        name={field.name}
                        config={fieldConfig}
                        value={formValues[field.name]}
                        error={validationErrors[field.name]}
                        fieldStates={fieldStates}
                        showValidationErrors={showValidationErrors}
                        readOnlyOption={readOnlyOption}
                        renderStyle={renderStyle}
                        variableGap={variableGap}
                        layoutItem={field}
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
            } else {
                console.warn(`Unexpected field type in container: ${field.type}`);
                return null;
            }
        });
    };

    // Render columns
    const renderColumns = () => {
        if (!columns || columns.length === 0) {
            return null;
        }

        // Single column - render as single column
        if (columns.length === 1) {
            return (
                <div className="space-y-4">
                    {renderColumnFields(columns[0].fields || [])}
                </div>
            );
        }

        // Multiple columns - render as responsive grid
        const gridCols = {
            2: 'md:grid-cols-2',
            3: 'md:grid-cols-3',
            4: 'md:grid-cols-4'
        }[columns.length] || 'md:grid-cols-2';

        return (
            <div className={`grid grid-cols-1 ${gridCols} ${gapClass}`}>
                {columns.map((column, columnIndex) => (
                    <div key={columnIndex} className="space-y-4">
                        {renderColumnFields(column.fields || [])}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="container-layout">
            {/* Container Caption */}
            {caption && (
                <div className="container-caption mb-4">
                    <h3 className="text-lg font-semibold text-foreground">
                        {caption}
                    </h3>
                    {captionDisplay && (
                        <p className="text-sm text-muted-foreground mt-1">
                            {captionDisplay}
                        </p>
                    )}
                </div>
            )}

            {/* Container Content */}
            <div className="container-content">
                {renderColumns()}
            </div>
        </div>
    );
}