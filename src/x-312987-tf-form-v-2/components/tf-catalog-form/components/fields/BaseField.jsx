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
            {typeof children === 'function' ? (
                // If children is a function, call it with the field props
                children({
                    id: config.type !== 'boolean' ? name : undefined,
                    name: name,
                    disabled: isReadOnly || isDisabled,
                    'aria-invalid': error ? 'true' : 'false',
                    'aria-describedby': error ? `${name}-error` : undefined
                })
            ) : (
                // Otherwise, clone the element and add props
                React.cloneElement(children, {
                    // Don't add id to boolean fields - they handle their own id on the checkbox
                    ...(config.type !== 'boolean' && { id: name }),
                    name: name,
                    disabled: isReadOnly || isDisabled,
                    'aria-invalid': error ? 'true' : 'false',
                    'aria-describedby': error ? `${name}-error` : undefined
                })
            )}

            {/* For boolean fields, wrap messages in a min-height container */}
            {config.type === 'boolean' ? (
                <div className="min-h-[36px] flex flex-col justify-start">
                    {/* Error message */}
                    {error && (
                        <p id={`${name}-error`} className="text-sm text-destructive">
                            {error}
                        </p>
                    )}

                    {/* Help text - indented for checkboxes */}
                    {config.helpText && (
                        <p className="text-xs text-muted-foreground ml-6">
                            {config.helpText}
                        </p>
                    )}

                    {/* Instructions - indented for checkboxes */}
                    {config.instructions && (
                        <p className="text-xs text-muted-foreground italic ml-6">
                            {config.instructions}
                        </p>
                    )}
                </div>
            ) : (
                <>
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
                </>
            )}
        </div>
    );
}