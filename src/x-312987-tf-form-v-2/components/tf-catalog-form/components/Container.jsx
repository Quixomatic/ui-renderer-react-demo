import React from 'react';
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
    onReferenceLoadMore
}) {
    const { name, caption, captionDisplay, layout, columns } = config;

    // Calculate gap classes based on variableGap setting
    const gapClass = {
        'sm': 'gap-2',
        'md': 'gap-4',
        'lg': 'gap-6',
        'xl': 'gap-8'
    }[variableGap] || 'gap-4';

    // Render fields within a column
    const renderColumnFields = (columnFields) => {
        return columnFields.map((field, fieldIndex) => {
            if (field.type !== 'field') {
                console.warn(`Unexpected field type in container: ${field.type}`);
                return null;
            }

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
                    readOnlyOption={readOnlyOption}
                    renderStyle={renderStyle}
                    shadowRoot={shadowRoot}
                    referenceData={referenceData}
                    referenceLoading={referenceLoading}
                    referencePagination={referencePagination}
                    onValueChange={onValueChange}
                    onValidation={onValidation}
                    onReferenceSearch={onReferenceSearch}
                    onReferenceLoadMore={onReferenceLoadMore}
                />
            );
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

        // Multiple columns - render as grid
        const gridCols = {
            2: 'grid-cols-2',
            3: 'grid-cols-3',
            4: 'grid-cols-4'
        }[columns.length] || 'grid-cols-2';

        return (
            <div className={`grid ${gridCols} ${gapClass}`}>
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