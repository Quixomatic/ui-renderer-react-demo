import React from 'react';
import { Input } from '../../../../../components/ui/input.jsx';
import { BaseField } from './BaseField.jsx';

/**
 * StringField - Basic text input field
 * 
 * Handles string type fields with proper value/displayValue handling.
 * For string fields, value and displayValue are typically the same.
 */
export function StringField({ 
    name, 
    config, 
    value, 
    fieldState, 
    error, 
    renderStyle,
    onValueChange 
}) {
    // Get current field value (handle both simple values and value/displayValue objects)
    const currentValue = typeof value === 'object' ? (value?.value || '') : (value || '');
    const displayValue = typeof value === 'object' ? (value?.displayValue || value?.value || '') : (value || '');
    
    // Handle value changes
    const handleChange = (e) => {
        const newValue = e.target.value;
        
        // For string fields, value and displayValue are the same
        onValueChange(name, {
            value: newValue,
            displayValue: newValue
        });
    };

    return (
        <BaseField 
            name={name} 
            config={config} 
            value={value} 
            fieldState={fieldState} 
            error={error}
            renderStyle={renderStyle}
        >
            <Input
                type="text"
                value={displayValue}
                onChange={handleChange}
                placeholder={config.exampleText || ''}
                className={error ? 'border-destructive' : ''}
            />
        </BaseField>
    );
}