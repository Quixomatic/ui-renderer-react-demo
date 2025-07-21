import React from 'react';
import { StringField } from './fields/StringField.jsx';
import { DateField } from './fields/DateField.jsx';
import { ChoiceField } from './fields/ChoiceField.jsx';
import { BooleanField } from './fields/BooleanField.jsx';
import { TextField } from './fields/TextField.jsx';
import { ReferenceField } from './fields/ReferenceField.jsx';
import { EmailField } from './fields/EmailField.jsx';
import { UrlField } from './fields/UrlField.jsx';
import { MaskedField } from './fields/MaskedField.jsx';
import { DurationField } from './fields/DurationField.jsx';
import { YesNoButtonField } from './fields/YesNoButtonField.jsx';
import { NumericScaleField } from './fields/NumericScaleField.jsx';
import { MultipleChoiceField } from './fields/MultipleChoiceField.jsx';
import { IpAddressField } from './fields/IpAddressField.jsx';
import { IpAddressFieldSegmented } from './fields/IpAddressFieldSegmented.jsx';
import { LabelField } from './fields/LabelField.jsx';
import { RichTextLabelField } from './fields/RichTextLabelField.jsx';
import { ListCollectorField } from './fields/ListCollectorField.jsx';
import { HtmlField } from './fields/HtmlField.jsx';

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
            return <YesNoButtonField {...commonProps} />;

        // Boolean field variations
        case 'boolean':
            return <BooleanField {...commonProps} />;

        // Text field variations
        case 'text':
        case 'multi_two_lines':
            return <TextField {...commonProps} />;
            
        // HTML field
        case 'html':
            return <HtmlField {...commonProps} />;

        // Reference field variations
        case 'reference':
        case 'requested_for':
            return <ReferenceField {...commonProps} />;

        // Email field
        case 'email':
            return <EmailField {...commonProps} />;

        // URL field
        case 'url':
            return <UrlField {...commonProps} />;

        // Masked field
        case 'masked':
            return <MaskedField {...commonProps} />;

        // Duration field
        case 'glide_duration':
            return <DurationField {...commonProps} />;

        // Numeric scale field
        case 'numeric_scale':
            return <NumericScaleField {...commonProps} />;

        // Multiple choice field (radio buttons)
        case 'multiple_choice':
            return <MultipleChoiceField {...commonProps} />;

        // IP Address field
        case 'ip_address':
            return (
                <>
                    <IpAddressField {...commonProps} />
                    <div className="mt-2">
                        <IpAddressFieldSegmented {...commonProps} />
                    </div>
                </>
            );

        // Label field (display only)
        case 'label':
            return <LabelField {...commonProps} />;

        // Rich text label field (display only)
        case 'rich_text_label':
            return <RichTextLabelField {...commonProps} />;

        // List collector field (multi-select reference)
        case 'glide_list':
            return <ListCollectorField {...commonProps} />;

        // Fallback for unsupported types
        default:
            console.warn(`Unsupported field type: ${type}${subType ? ':' + subType : ''} for field: ${name}`);
            return <StringField {...commonProps} />; // Fallback to string field
    }
}