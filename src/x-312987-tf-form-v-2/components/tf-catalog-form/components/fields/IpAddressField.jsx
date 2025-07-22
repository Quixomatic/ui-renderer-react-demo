import React from 'react';
import { Input } from '../../../../../components/ui/input.jsx';
import { BaseField } from './BaseField.jsx';

/**
 * IpAddressField - IP address input with validation
 * 
 * Handles ip_address type fields with proper value/displayValue handling.
 * Provides IP address format validation and appropriate input attributes.
 */
export function IpAddressField({ 
    baseFieldProps,
    onValueChange 
}) {
    // Extract needed values from baseFieldProps
    const { name, config, value, fieldState, error } = baseFieldProps;
    
    // Get current field value
    const currentValue = typeof value === 'object' ? (value?.value || '') : (value || '');
    const displayValue = typeof value === 'object' ? (value?.displayValue || value?.value || '') : (value || '');
    
    // Handle value changes
    const handleChange = (e) => {
        const newValue = e.target.value;
        
        // Basic IP address format validation (allows partial input while typing)
        // Full validation should be done on blur or submit
        const ipPattern = /^[\d.]*$/;
        if (!ipPattern.test(newValue)) {
            return; // Don't update if invalid characters
        }
        
        // For IP address fields, value and displayValue are the same
        onValueChange(name, {
            value: newValue,
            displayValue: newValue
        });
    };

    // Validate IP address format on blur
    const handleBlur = (e) => {
        const val = e.target.value;
        if (val && !isValidIpAddress(val)) {
            // You might want to trigger a validation error here
            // For now, we'll let the parent handle validation
        }
    };

    // IP address validation helper
    const isValidIpAddress = (ip) => {
        const parts = ip.split('.');
        if (parts.length !== 4) return false;
        
        return parts.every(part => {
            const num = parseInt(part, 10);
            return !isNaN(num) && num >= 0 && num <= 255 && part === num.toString();
        });
    };

    const isReadOnly = fieldState?.readonly || config.readOnly;
    const isDisabled = fieldState?.disabled;

    return (
        <BaseField {...baseFieldProps}>
            <Input
                type="text"
                value={displayValue}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={config.exampleText || '192.168.1.1'}
                className={error ? 'border-destructive' : ''}
                readOnly={isReadOnly}
                disabled={isDisabled}
                pattern="^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
                title="Please enter a valid IP address (e.g., 192.168.1.1)"
            />
        </BaseField>
    );
}