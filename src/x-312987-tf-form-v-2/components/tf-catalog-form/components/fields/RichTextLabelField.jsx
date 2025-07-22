import React from 'react';

/**
 * RichTextLabelField - Display-only HTML/rich text label
 * 
 * Handles rich_text_label type fields that show read-only HTML content.
 * Does not use BaseField since it's display-only with no user interaction.
 */
export function RichTextLabelField({ 
    name, 
    config, 
    fieldState, 
    renderStyle,
    variableGap
}) {
    // Rich text labels display their label as HTML
    const htmlContent = config.label || '';
    
    // Check visibility
    const isVisible = fieldState?.visible !== false && config.visible !== false;
    if (!isVisible) return null;

    // Render style classes
    const fieldClass = renderStyle === 'compact' ? 'py-1' : 'py-2';

    return (
        <div 
            className={`${fieldClass} prose prose-sm max-w-none`}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
    );
}