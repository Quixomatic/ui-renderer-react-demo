import React, { useState, useEffect, useMemo } from 'react';
import { Input } from '../../../../../components/ui/input.jsx';
import { Button } from '../../../../../components/ui/button.jsx';
import { Eye, EyeOff } from 'lucide-react';
import { BaseField } from './BaseField.jsx';

/**
 * MaskedField - Masked input for sensitive data
 * 
 * Handles masked type fields with proper value/displayValue handling.
 * Provides masking for sensitive data like SSNs, credit cards, etc.
 * Includes a toggle to show/hide the masked value.
 */
export function MaskedField({ 
    baseFieldProps,
    onValueChange 
}) {
    // Extract needed values from baseFieldProps
    const { name, config, value, fieldState, error } = baseFieldProps;
    
    // State for showing/hiding masked value
    const [showValue, setShowValue] = useState(false);
    
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

    // Toggle show/hide
    const toggleShow = () => {
        setShowValue(!showValue);
    };

    // Create masked display value
    const getMaskedValue = (val) => {
        if (!val || showValue) return val;
        
        // Mask all but last 4 characters
        const visibleChars = 4;
        if (val.length <= visibleChars) {
            return '*'.repeat(val.length);
        }
        
        const maskedLength = val.length - visibleChars;
        return '*'.repeat(maskedLength) + val.slice(-visibleChars);
    };

    const isReadOnly = fieldState?.readonly || config.readOnly;

    return (
        <BaseField {...baseFieldProps}>
            <div className="relative">
                <Input
                    type={showValue ? 'text' : 'password'}
                    value={localValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={config.exampleText || ''}
                    className={`pr-10 ${error ? 'border-destructive' : ''}`}
                    readOnly={isReadOnly}
                    disabled={fieldState?.disabled}
                />
                {!isReadOnly && localValue && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={toggleShow}
                        tabIndex={-1}
                    >
                        {showValue ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                    </Button>
                )}
            </div>
        </BaseField>
    );
}