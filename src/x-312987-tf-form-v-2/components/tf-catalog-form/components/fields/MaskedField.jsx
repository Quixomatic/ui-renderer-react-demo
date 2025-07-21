import React, { useState } from 'react';
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
    name, 
    config, 
    value, 
    fieldState, 
    error, 
    renderStyle,
    onValueChange 
}) {
    // State for showing/hiding masked value
    const [showValue, setShowValue] = useState(false);
    
    // Get current field value
    const currentValue = typeof value === 'object' ? (value?.value || '') : (value || '');
    const displayValue = typeof value === 'object' ? (value?.displayValue || value?.value || '') : (value || '');
    
    // Handle value changes
    const handleChange = (e) => {
        const newValue = e.target.value;
        
        // For masked fields, value and displayValue are the same
        onValueChange(name, {
            value: newValue,
            displayValue: newValue
        });
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
        <BaseField 
            name={name} 
            config={config} 
            value={value} 
            fieldState={fieldState} 
            error={error}
            renderStyle={renderStyle}
        >
            <div className="relative">
                <Input
                    type={showValue ? 'text' : 'password'}
                    value={displayValue}
                    onChange={handleChange}
                    placeholder={config.exampleText || ''}
                    className={`pr-10 ${error ? 'border-destructive' : ''}`}
                    readOnly={isReadOnly}
                    disabled={fieldState?.disabled}
                />
                {!isReadOnly && displayValue && (
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