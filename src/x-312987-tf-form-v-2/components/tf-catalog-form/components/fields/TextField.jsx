import React, { useState, useEffect, useMemo } from 'react';
import { Textarea } from '../../../../../components/ui/textarea.jsx';
import { BaseField } from './BaseField.jsx';

/**
 * TextField - Multi-line text area field
 * 
 * Handles text and multi_two_lines type fields with proper value/displayValue handling.
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
            <Textarea
                value={localValue}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={config.exampleText || ''}
                rows={4}
                className={error ? 'border-destructive' : ''}
            />
        </BaseField>
    );
}