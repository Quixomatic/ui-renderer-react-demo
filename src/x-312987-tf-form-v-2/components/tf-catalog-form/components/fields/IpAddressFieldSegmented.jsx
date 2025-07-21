import React, { useState } from 'react';
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
    name, 
    config, 
    value, 
    fieldState, 
    error, 
    renderStyle,
    onValueChange 
}) {
    // Get current field value
    const currentValue = typeof value === 'object' ? (value?.value || '') : (value || '');
    const displayValue = typeof value === 'object' ? (value?.displayValue || value?.value || '') : (value || '');
    
    const [validationError, setValidationError] = useState(null);
    
    // Handle value changes from MetaSegmentedInput
    const handleChange = ({ config: configKey, value: newValue }) => {
        // For IP address fields, value and displayValue are the same
        onValueChange(name, {
            value: newValue,
            displayValue: newValue
        });
        
        // Clear validation error on change
        setValidationError(null);
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
            name={name} 
            config={config} 
            value={value} 
            fieldState={fieldState} 
            error={error || validationError}
            renderStyle={renderStyle}
        >
            <div className="space-y-3">
                
                <div>
                    <MetaSegmentedInput
                        value={displayValue}
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