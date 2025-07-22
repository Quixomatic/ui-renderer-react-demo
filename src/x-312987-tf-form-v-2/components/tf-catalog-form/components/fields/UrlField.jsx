import React from 'react';
import { Input } from '../../../../../components/ui/input.jsx';
import { BaseField } from './BaseField.jsx';

/**
 * UrlField - URL input with validation
 * 
 * Handles URL type fields with proper value/displayValue handling.
 * Provides URL format validation and appropriate input attributes.
 */
export function UrlField({ 
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
        
        // For URL fields, value and displayValue are the same
        onValueChange(name, {
            value: newValue,
            displayValue: newValue
        });
    };

    return (
        <BaseField {...baseFieldProps}>
            <Input
                type="url"
                value={displayValue}
                onChange={handleChange}
                placeholder={config.exampleText || 'https://example.com'}
                className={error ? 'border-destructive' : ''}
                autoComplete="url"
            />
        </BaseField>
    );
}