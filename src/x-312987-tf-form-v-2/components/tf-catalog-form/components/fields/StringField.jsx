import React, { useRef, useEffect, useState, useMemo } from 'react';
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
    
    // Debug component lifecycle
    useEffect(() => {
        console.log(`🔄 StringField [${name}] MOUNTED`);
        
        return () => {
            console.log(`❌ StringField [${name}] UNMOUNTING`);
        };
    }, []);
    // Get current field value (handle both simple values and value/displayValue objects)
    const currentValue = typeof value === 'object' ? (value?.value || '') : (value || '');
    const displayValue = typeof value === 'object' ? (value?.displayValue || value?.value || '') : (value || '');
    
    const inputRef = useRef(null);
    
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
                ref={inputRef}
                type="text"
                value={localValue}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={config.exampleText || ''}
                className={error ? 'border-destructive' : ''}
            />
        </BaseField>
    );
}