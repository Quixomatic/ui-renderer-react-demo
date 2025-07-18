import React from 'react';
import { StringField } from './fields/StringField.jsx';
import { DateField } from './fields/DateField.jsx';
import { ChoiceField } from './fields/ChoiceField.jsx';
import { BooleanField } from './fields/BooleanField.jsx';
import { TextField } from './fields/TextField.jsx';
import { ReferenceField } from './fields/ReferenceField.jsx';

/**
 * FieldRenderer - Field Type Router
 * 
 * Routes to specialized field components based on field type and subtype.
 * Each field type has its own component that handles the specific UI and behavior.
 * 
 * No ServiceNow registration needed - this is just a regular React component!
 */
export function FieldRenderer({
    name,
    config,
    value,
    error,
    readOnlyOption,
    renderStyle,
    fieldStates,
    shadowRoot,
    referenceData,
    referenceLoading,
    referencePagination,
    onValueChange,
    onValidation,
    onReferenceSearch,
    onReferenceLoadMore
}) {
    // Common props passed to all field components
    const commonProps = {
        name,
        config,
        value,
        fieldState: fieldStates?.[name] || {},
        error,
        renderStyle,
        shadowRoot,
        referenceData,
        referenceLoading,
        referencePagination,
        onValueChange: (fieldName, newValue) => {
            onValueChange(fieldName, newValue);
            // Trigger validation if needed
            if (onValidation) {
                const val = typeof newValue === 'object' ? newValue.value : newValue;
                onValidation(fieldName, val);
            }
        },
        onReferenceSearch,
        onReferenceLoadMore
    };

    // Route to appropriate field component based on type and subtype
    const { type, subType } = config;
    const fieldKey = subType ? `${type}:${subType}` : type;

    switch (fieldKey) {
        // String field variations
        case 'string':
            return <StringField {...commonProps} />;

        // Date field variations
        case 'glide_date':
        case 'glide_date_time':
            return <DateField {...commonProps} />;

        // Choice field variations
        case 'choice':
            return <ChoiceField {...commonProps} />;
        case 'choice:button_yes_no':
            // TODO: Implement YesNoButtonField component
            return <ChoiceField {...commonProps} />;

        // Boolean field variations
        case 'boolean':
            return <BooleanField {...commonProps} />;

        // Text field variations
        case 'text':
        case 'html':
            return <TextField {...commonProps} />;

        // Reference field variations
        case 'reference':
            return <ReferenceField {...commonProps} />;

        // Fallback for unsupported types
        default:
            console.warn(`Unsupported field type: ${type}${subType ? ':' + subType : ''} for field: ${name}`);
            return <StringField {...commonProps} />; // Fallback to string field
    }
}