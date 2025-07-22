import React from 'react';
import { Textarea } from '../../../../../components/ui/textarea.jsx';
import { BaseField } from './BaseField.jsx';

/**
 * TextField - Multi-line text area field
 * 
 * Handles text and html type fields with proper value/displayValue handling.
 * For text fields, value and displayValue are typically the same.
 */
export function TextField({ 
    baseFieldProps,
    onValueChange 
}) {
    // Extract needed values from baseFieldProps
    const { name, config, value, error } = baseFieldProps;
    
    // Get current field value
    const currentValue = typeof value === 'object' ? (value?.value || '') : (value || '');
    const displayValue = typeof value === 'object' ? (value?.displayValue || value?.value || '') : (value || '');
    
    // Handle value changes
    const handleChange = (e) => {
        const newValue = e.target.value;
        
        // For text fields, value and displayValue are the same
        onValueChange(name, {
            value: newValue,
            displayValue: newValue
        });
    };

    return (
        <BaseField {...baseFieldProps}>
            <Textarea
                value={displayValue}
                onChange={handleChange}
                placeholder={config.exampleText || ''}
                rows={4}
                className={error ? 'border-destructive' : ''}
            />
        </BaseField>
    );
}