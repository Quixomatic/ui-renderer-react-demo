import React from 'react';
import { Label } from '../../../../../components/ui/label.jsx';

/**
 * BaseField - Common wrapper for all field types
 * 
 * Provides consistent behavior for all field types:
 * - Visibility handling
 * - Label rendering with mandatory indicators
 * - Error message display
 * - Help text display
 * - Instructions display
 * - Common styling and layout
 */
export function BaseField({ 
    name, 
    config, 
    value, 
    fieldState, 
    error, 
    onChange,
    renderStyle,
    children // The actual input component
}) {
    // Get field state (might be modified by g_form API)
    const state = fieldState || {};
    
    // Determine field properties (fieldState overrides config)
    const isVisible = state.visible !== undefined ? state.visible : (config.visible !== false);
    const isReadOnly = state.readonly || config.readOnly || false;
    const isMandatory = state.mandatory !== undefined ? state.mandatory : config.mandatory;
    const isDisabled = state.disabled || false;
    const label = state.label || config.label || name;

    // Don't render if not visible
    if (!isVisible) {
        return null;
    }

    // Calculate field width based on render style
    const fieldWidth = renderStyle === 'compact' ? 'w-1/2' : 'w-full';

    return (
        <div className={`field-container ${fieldWidth}`}>
            {/* Label (for non-boolean fields) */}
            {config.type !== 'boolean' && (
                <Label htmlFor={name} className="block text-sm font-medium mb-2">
                    {label}
                    {isMandatory && <span className="text-destructive ml-1">*</span>}
                </Label>
            )}

            {/* Input component */}
            {React.cloneElement(children, {
                id: name,
                name: name,
                disabled: isReadOnly || isDisabled,
                'aria-invalid': error ? 'true' : 'false',
                'aria-describedby': error ? `${name}-error` : undefined
            })}

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