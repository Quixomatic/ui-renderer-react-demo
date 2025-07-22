import React from 'react';
import { Label } from '../../../../../components/ui/label.jsx';
import { CircleAlert, Info, TriangleAlert } from 'lucide-react';

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
    showValidationErrors = true, // Whether to show validation errors (false during initial silent validation)
    children // The actual input component
}) {
    // Get field state (might be modified by g_form API)
    const state = fieldState || {};
    
    // Get field messages from config object
    const fieldMessages = config.messages || [];
    
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

    // Helper function to render field messages
    const renderFieldMessages = (indentForBoolean = false) => {
        if (!fieldMessages || fieldMessages.length === 0) return null;

        return fieldMessages.map((message, index) => {
            // Extract the message text and type from various possible formats
            let messageText = '';
            let messageType = 'info';
            
            if (typeof message === 'string') {
                // Simple string message
                messageText = message;
            } else if (message && typeof message === 'object') {
                // ServiceNow message object format: {id, message, type, scrollForm}
                messageText = message.message || message.text || '';
                messageType = message.type || 'info';
            }
            
            // Skip empty messages
            if (!messageText) return null;
            
            // Determine message styling and icon based on type
            let containerClass = 'rounded-md border px-3 py-1.5 mt-2';
            let textClass = 'text-sm';
            let Icon = Info;
            
            switch (messageType) {
                case 'error':
                    containerClass += ' border-red-500/50 text-red-600';
                    Icon = CircleAlert;
                    break;
                case 'warning':
                    containerClass += ' border-amber-500/50 text-amber-600';
                    Icon = TriangleAlert;
                    break;
                case 'info':
                case 'informational':
                    containerClass += ' border-blue-500/50 text-blue-600';
                    Icon = Info;
                    break;
                default:
                    containerClass += ' border-muted-foreground/50 text-muted-foreground';
                    Icon = Info;
                    break;
            }

            // Add indentation for boolean fields (checkboxes)
            if (indentForBoolean) {
                containerClass += ' ml-6';
            }

            return (
                <div key={`${name}-message-${index}`} className={containerClass}>
                    <p className={textClass}>
                        <Icon
                            className="me-3 -mt-0.5 inline-flex opacity-60"
                            size={16}
                            aria-hidden="true"
                        />
                        {messageText}
                    </p>
                </div>
            );
        });
    };

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
                    {error && showValidationErrors && (
                        <p id={`${name}-error`} className="text-sm text-destructive">
                            {error}
                        </p>
                    )}

                    {/* Field messages - indented for checkboxes */}
                    {renderFieldMessages(true)}

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
                    {error && showValidationErrors && (
                        <p id={`${name}-error`} className="text-sm text-destructive mt-1">
                            {error}
                        </p>
                    )}

                    {/* Field messages */}
                    {renderFieldMessages(false)}

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