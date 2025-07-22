import React from 'react';
import { Checkbox } from '../../../../../components/ui/checkbox.jsx';
import { Label } from '../../../../../components/ui/label.jsx';
import { BaseField } from './BaseField.jsx';

/**
 * BooleanField - Checkbox field
 * 
 * Handles boolean type fields with proper value/displayValue handling.
 * - value: String representation ('true'/'false' or boolean)
 * - displayValue: Human-readable representation ('true'/'false')
 * 
 * Uses BaseField wrapper but with custom internal layout for checkboxes
 */
export function BooleanField({ 
    name, 
    config, 
    value, 
    fieldState, 
    error, 
    fieldMessages,
    renderStyle,
    onValueChange 
}) {
    // Get current field value
    const currentValue = typeof value === 'object' ? (value?.value || '') : (value || '');
    const isChecked = currentValue === 'true' || currentValue === true;
    
    // Handle value changes
    const handleChange = (checked) => {
        const newValue = checked.toString();
        
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
            fieldMessages={fieldMessages}
            renderStyle={renderStyle}
        >
            {(fieldProps) => (
                /* Custom checkbox layout with label beside it */
                <div className="flex items-center space-x-2 min-h-[20px] mb-2">
                    <Checkbox
                        {...fieldProps}
                        id={name}
                        checked={isChecked}
                        onCheckedChange={handleChange}
                        className={error ? 'border-destructive' : ''}
                    />
                    <Label htmlFor={name} className="text-sm font-medium leading-none">
                        {fieldState?.label || config.label || name}
                        {(fieldState?.mandatory !== undefined ? fieldState.mandatory : config.mandatory) && 
                            <span className="text-destructive ml-1">*</span>}
                    </Label>
                </div>
            )}
        </BaseField>
    );
}