import React from 'react';
import { Textarea } from '../../../../../components/ui/textarea.jsx';
import { BaseField } from './BaseField.jsx';

/**
 * HtmlField - HTML/Rich text editor field
 * 
 * Handles html type fields with proper value/displayValue handling.
 * Currently uses a simple textarea - can be upgraded to a rich text editor later.
 */
export function HtmlField({ 
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
    
    // Handle value changes
    const handleChange = (e) => {
        const newValue = e.target.value;
        
        // For HTML fields, value and displayValue are the same
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
            renderStyle={renderStyle}
        >
            <Textarea
                value={displayValue}
                onChange={handleChange}
                placeholder={config.exampleText || 'Enter HTML content...'}
                rows={6}
                className={error ? 'border-destructive' : ''}
                style={{ fontFamily: 'monospace' }}
            />
        </BaseField>
    );
}