import React from 'react';

/**
 * LabelField - Display-only text label
 * 
 * Handles label type fields that show read-only text.
 * Does not use BaseField since it's display-only with no user interaction.
 */
export function LabelField({ 
    name, 
    config, 
    fieldState, 
    renderStyle,
    variableGap
}) {
    // Labels don't have values - they just display their label text
    const labelText = config.label || '';
    
    // Check visibility
    const isVisible = fieldState?.visible !== false && config.visible !== false;
    if (!isVisible) return null;

    // Render style classes
    const fieldClass = renderStyle === 'compact' ? 'py-1' : 'py-2';

    return (
        <div className={`${fieldClass} text-sm font-normal`}>
            {labelText}
        </div>
    );
}