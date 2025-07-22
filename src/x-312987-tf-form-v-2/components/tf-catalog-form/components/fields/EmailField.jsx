import React from 'react';
import { Input } from '../../../../../components/ui/input.jsx';
import { BaseField } from './BaseField.jsx';

/**
 * EmailField - Email input with validation
 * 
 * Handles email type fields with proper value/displayValue handling.
 * Provides email format validation and appropriate input attributes.
 */
export function EmailField({ 
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
        
        // For email fields, value and displayValue are the same
        onValueChange(name, {
            value: newValue,
            displayValue: newValue
        });
    };

    return (
        <BaseField {...baseFieldProps}>
            <Input
                type="email"
                value={displayValue}
                onChange={handleChange}
                placeholder={config.exampleText || 'email@example.com'}
                className={error ? 'border-destructive' : ''}
                autoComplete="email"
            />
        </BaseField>
    );
}