import React, { useMemo } from 'react';
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
import { CheckboxGroupField } from './fields/CheckboxGroupField.jsx';
import { AttachmentField } from './fields/AttachmentField.jsx';
import { ExistingValueTextField } from './fields/ExistingValueTextField.jsx';
import { ExistingValueRecordListField } from './fields/ExistingValueRecordListField.jsx';
import { ExistingValueTableListField } from './fields/ExistingValueTableListField.jsx';
import { TableListField } from './fields/TableListField.jsx';
import { TileChoiceField } from './fields/TileChoiceField.jsx';
import { ReferenceTileChoiceField } from './fields/ReferenceTileChoiceField.jsx';
import { MultiRowVariableSetField } from './fields/MultiRowVariableSetField.jsx';

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
    variableGap,
    fieldStates,
    showValidationErrors,
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
    layoutItem, // Layout item from normalizer (may contain checkboxGroupInfo)
    allFields // All fields object for checkbox group child field access
}) {
    // Props that should always be passed to BaseField components
    const baseFieldProps = {
        name,
        config,
        value,
        fieldState: fieldStates?.[name] || {},
        error,
        renderStyle,
        variableGap,
        shadowRoot,
        showValidationErrors
    };

    // Common props passed to all field components (includes baseFieldProps + field-specific props)
    const commonProps = {
        ...baseFieldProps,
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
        onReferenceLoadMore,
        onAttachmentUpload,
        onAttachmentDelete,
        // Separate baseFieldProps for easy BaseField passing
        baseFieldProps
    };

    // Check if this is a checkbox group field (from layout normalizer)
    if (layoutItem?.checkboxGroupInfo) {
        // Memoize child field extraction to avoid unnecessary re-renders
        const childFields = useMemo(() => {
            const extracted = {};
            layoutItem.checkboxGroupInfo.childFieldNames.forEach(fieldName => {
                if (allFields && allFields[fieldName]) {
                    extracted[fieldName] = allFields[fieldName];
                }
            });
            return extracted;
        }, [
            layoutItem.checkboxGroupInfo.childFieldNames,
            // Only watch the specific child fields we care about
            ...layoutItem.checkboxGroupInfo.childFieldNames.map(fieldName => allFields?.[fieldName])
        ]);

        return (
            <CheckboxGroupField 
                {...commonProps}
                checkboxGroupInfo={layoutItem.checkboxGroupInfo}
                childFields={childFields}
            />
        );
    }

    // Check if this is a Multi-Row Variable Set field (from layout normalizer)
    if (layoutItem?.mrvsInfo || config.containerType === 'one_to_many') {
        return (
            <MultiRowVariableSetField 
                {...commonProps}
                mrvsInfo={layoutItem?.mrvsInfo}
            />
        );
    }

    // Route to appropriate field component based on type and subtype
    const { type, subType } = config;
    const fieldKey = subType ? `${type}:${subType}` : type;

    switch (fieldKey) {
        // String field variations
        case 'string':
            return <StringField {...commonProps} />;
        case 'string:existing_value_text':
            return <ExistingValueTextField {...commonProps} />;

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
        case 'reference:existing_value_record_list':
            return <ExistingValueRecordListField {...commonProps} />;
        case 'reference:existing_value_table_list':
            return <ExistingValueTableListField {...commonProps} />;
        case 'reference:table_list':
            return <TableListField {...commonProps} />;
        case 'reference:tile_choice':
            return <ReferenceTileChoiceField {...commonProps} />;

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
        case 'multiple_choice:tile_choice':
            return <TileChoiceField {...commonProps} />;

        // IP Address field
        case 'ip_address':
            return <IpAddressFieldSegmented {...commonProps} />;

        // Label field (display only)
        case 'label':
            return <LabelField {...commonProps} />;

        // Rich text label field (display only)
        case 'rich_text_label':
            return <RichTextLabelField {...commonProps} />;

        // List collector field (multi-select reference)
        case 'glide_list':
            return <ListCollectorField {...commonProps} />;

        // File attachment field
        case 'file_attachment':
        case 'attachment':
            return <AttachmentField {...commonProps} />;

        // Fallback for unsupported types
        default:
            console.warn(`Unsupported field type: ${type}${subType ? ':' + subType : ''} for field: ${name}`);
            return <StringField {...commonProps} />; // Fallback to string field
    }
}