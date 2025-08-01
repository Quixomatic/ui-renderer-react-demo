import React, { useState, useEffect, useMemo } from 'react';
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
    
    // Local state for input control
    const [localValue, setLocalValue] = useState(displayValue);
    
    // Detect external changes (g_form.setValue, etc.) and sync local state
    useEffect(() => {
        if (displayValue !== localValue) {
            setLocalValue(displayValue);
        }
    }, [displayValue]);
    
    // Debounced updates to parent (optional real-time updates)
    const debouncedUpdate = useMemo(() => {
        let timeoutId;
        return (value) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                onValueChange(name, {
                    value: value,
                    displayValue: value
                });
            }, 300); // 300ms debounce
        };
    }, [name, onValueChange]);
    
    // Handle local value changes
    const handleChange = (e) => {
        const newValue = e.target.value;
        setLocalValue(newValue);
        debouncedUpdate(newValue);
    };
    
    // Handle blur - ensure final sync
    const handleBlur = () => {
        // Only dispatch if value actually changed from what parent knows
        if (localValue !== displayValue) {
            onValueChange(name, {
                value: localValue,
                displayValue: localValue
            });
        }
    };

    return (
        <BaseField {...baseFieldProps}>
            <Input
                type="email"
                value={localValue}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={config.exampleText || 'email@example.com'}
                className={error ? 'border-destructive' : ''}
                autoComplete="email"
            />
        </BaseField>
    );
}