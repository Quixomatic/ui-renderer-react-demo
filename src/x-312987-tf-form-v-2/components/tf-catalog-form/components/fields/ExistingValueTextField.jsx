import React from 'react';
import { BaseField } from './BaseField.jsx';

/**
 * ExistingValueTextField - Presentation-only text display field
 * 
 * Handles string:existing_value_text subtype fields.
 * Displays the field's value as plain text with no user interaction.
 * Still supports standard field states (visibility, etc.) through BaseField.
 */
export function ExistingValueTextField({ baseFieldProps }) {
    // Extract needed values from baseFieldProps
    const { value } = baseFieldProps;
    
    // Get display value to show
    const displayValue = typeof value === 'object' ? (value?.displayValue || value?.value || '') : (value || '');
    
    return (
        <BaseField {...baseFieldProps}>
            <div className="text-sm text-foreground py-1.5">
                {displayValue || <span className="text-muted-foreground italic">No value</span>}
            </div>
        </BaseField>
    );
}