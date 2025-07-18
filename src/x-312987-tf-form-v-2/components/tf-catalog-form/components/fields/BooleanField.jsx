import React from 'react';
import { Checkbox } from '../../../../../components/ui/checkbox.jsx';
import { Label } from '../../../../../components/ui/label.jsx';

/**
 * BooleanField - Checkbox field
 * 
 * Handles boolean type fields with proper value/displayValue handling.
 * - value: String representation ('true'/'false' or boolean)
 * - displayValue: Human-readable representation ('true'/'false')
 * 
 * Note: This component handles its own label since checkboxes have different layout
 */
export function BooleanField({ 
    name, 
    config, 
    value, 
    fieldState, 
    error, 
    renderStyle,
    onValueChange 
}) {
    // Get field state
    const state = fieldState || {};
    const isVisible = state.visible !== undefined ? state.visible : (config.visible !== false);
    const isReadOnly = state.readonly || config.readOnly || false;
    const isMandatory = state.mandatory !== undefined ? state.mandatory : config.mandatory;
    const isDisabled = state.disabled || false;
    const label = state.label || config.label || name;

    // Don't render if not visible
    if (!isVisible) {
        return null;
    }

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

    // Calculate field width based on render style
    const fieldWidth = renderStyle === 'compact' ? 'w-1/2' : 'w-full';

    return (
        <div className={`field-container ${fieldWidth}`}>
            <div className="flex items-center space-x-2">
                <Checkbox
                    id={name}
                    checked={isChecked}
                    onCheckedChange={handleChange}
                    disabled={isReadOnly || isDisabled}
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={error ? `${name}-error` : undefined}
                    className={error ? 'border-destructive' : ''}
                />
                <Label htmlFor={name} className="text-sm font-medium">
                    {label}
                    {isMandatory && <span className="text-destructive ml-1">*</span>}
                </Label>
            </div>

            {/* Error message */}
            {error && (
                <p id={`${name}-error`} className="text-sm text-destructive mt-1">
                    {error}
                </p>
            )}

            {/* Help text */}
            {config.helpText && (
                <p className="text-xs text-muted-foreground mt-1">
                    {config.helpText}
                </p>
            )}

            {/* Instructions */}
            {config.instructions && (
                <p className="text-xs text-muted-foreground mt-1 italic">
                    {config.instructions}
                </p>
            )}
        </div>
    );
}