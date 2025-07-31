import React, { useRef } from 'react';
import { Input } from '../../../../../components/ui/input.jsx';
import { BaseField } from './BaseField.jsx';

/**
 * StringField - Basic text input field
 * 
 * Handles string type fields with proper value/displayValue handling.
 * For string fields, value and displayValue are typically the same.
 * Uses cursor position preservation to prevent jumping during typing.
 */
export function StringField({ 
    baseFieldProps,
    onValueChange 
}) {
    // Extract needed values from baseFieldProps
    const { name, config, value, error } = baseFieldProps;
    // Get current field value (handle both simple values and value/displayValue objects)
    const currentValue = typeof value === 'object' ? (value?.value || '') : (value || '');
    const displayValue = typeof value === 'object' ? (value?.displayValue || value?.value || '') : (value || '');
    
    const inputRef = useRef(null);
    
    // Handle value changes with cursor position preservation
    const handleChange = (e) => {
        const newValue = e.target.value;
        const cursorPosition = e.target.selectionStart;
        
        // Store cursor position before dispatching to parent
        requestAnimationFrame(() => {
            if (inputRef.current && cursorPosition !== null) {
                inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
            }
        });
        
        // For string fields, value and displayValue are the same
        onValueChange(name, {
            value: newValue,
            displayValue: newValue
        });
    };

    return (
        <BaseField {...baseFieldProps}>
            <Input
                ref={inputRef}
                type="text"
                value={displayValue}
                onChange={handleChange}
                placeholder={config.exampleText || ''}
                className={error ? 'border-destructive' : ''}
            />
        </BaseField>
    );
}