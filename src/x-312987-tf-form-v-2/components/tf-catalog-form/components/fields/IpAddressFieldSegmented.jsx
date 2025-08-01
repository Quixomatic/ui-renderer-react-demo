import React, { useState, useEffect, useMemo } from 'react';
import { MetaSegmentedInput } from '../../../../../components/ui/meta-segmented-input.jsx';
import { BaseField } from './BaseField.jsx';
import { networkPresets } from '../../../../../../components/lib/segmented-input-presets.js';
import { resolveSegmentedPreset } from '../../../../../../components/lib/resolve-segmented-preset.js';

/**
 * IpAddressFieldSegmented - IP address input with segmented validation
 * 
 * EXPERIMENTAL: Testing MetaSegmentedInput for structured IP address entry.
 * This is an alternative to the standard IpAddressField.
 */
export function IpAddressFieldSegmented({ 
    baseFieldProps,
    onValueChange 
}) {
    // Extract needed values from baseFieldProps
    const { name, config, value, fieldState, error } = baseFieldProps;
    
    // Get current field value
    const currentValue = typeof value === 'object' ? (value?.value || '') : (value || '');
    const displayValue = typeof value === 'object' ? (value?.displayValue || value?.value || '') : (value || '');
    
    const [validationError, setValidationError] = useState(null);
    
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
    
    // Handle value changes from MetaSegmentedInput
    const handleChange = ({ config: configKey, value: newValue }) => {
        setLocalValue(newValue);
        debouncedUpdate(newValue);
        
        // Clear validation error on change
        setValidationError(null);
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
    
    // Handle validation errors from MetaSegmentedInput
    const handleError = ({ config: configKey, errors }) => {
        if (errors && errors.length > 0) {
            setValidationError(errors[0].reason);
        } else {
            setValidationError(null);
        }
    };
    
    const isReadOnly = fieldState?.readonly || config.readOnly;
    const isDisabled = fieldState?.disabled;
    
    // Configure the IP address preset
    const ipv4Config = {
        default: 'ipv4',
        options: {
            ipv4: resolveSegmentedPreset(networkPresets.ipv4)
        }
    };

    return (
        <BaseField 
            {...baseFieldProps}
            error={error || validationError}
        >
            <div className="space-y-3">
                
                <div>
                    <MetaSegmentedInput
                        value={localValue}
                        onChange={handleChange}
                        onError={handleError}
                        use="ipv4"
                        configOptions={ipv4Config}
                        disabled={isDisabled || isReadOnly}
                        variant="unified"
                        className=""
                    />
                </div>
            </div>
        </BaseField>
    );
}