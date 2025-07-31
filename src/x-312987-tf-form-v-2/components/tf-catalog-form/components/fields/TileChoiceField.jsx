import React from 'react';
import { Square } from 'lucide-react';
import { BaseField } from './BaseField.jsx';
import { cn } from '../../../../../../components/lib/utils.js';

/**
 * TileChoiceField - Visual tile interface for choice selection
 * 
 * Handles multiple_choice:tile_choice subtype fields.
 * Displays choice options as clickable tiles with icons and labels.
 * Single selection (like radio group) but with visual tile interface.
 */
export function TileChoiceField({ 
    baseFieldProps,
    onValueChange 
}) {
    // Extract needed values from baseFieldProps
    const { name, config, value, error, fieldState } = baseFieldProps;
    
    // Get current field value
    const currentValue = typeof value === 'object' ? (value?.value || '') : (value || '');
    
    // Check if field is readonly or disabled
    const isReadOnly = fieldState?.readonly || config.readOnly;
    const isDisabled = fieldState?.disabled;
    
    // Get choice options
    const choices = config.choices || [];
    
    // Handle choice selection
    const handleSelect = (choiceValue, choiceDisplayValue) => {
        if (isReadOnly || isDisabled) return;
        
        // If clicking the same option, deselect it
        const newValue = currentValue === choiceValue ? '' : choiceValue;
        const newDisplayValue = currentValue === choiceValue ? '' : choiceDisplayValue;
        
        onValueChange(name, {
            value: newValue,
            displayValue: newDisplayValue
        });
    };
    
    if (choices.length === 0) {
        return (
            <BaseField {...baseFieldProps}>
                <div className="text-sm text-muted-foreground italic py-1.5">
                    No choices configured
                </div>
            </BaseField>
        );
    }
    
    return (
        <BaseField {...baseFieldProps}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {choices.map((choice) => {
                    const isSelected = currentValue === choice.value;
                    
                    return (
                        <button
                            key={choice.value}
                            type="button"
                            disabled={isReadOnly || isDisabled}
                            onClick={() => handleSelect(choice.value, choice.displayValue)}
                            className={cn(
                                "relative flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-200",
                                "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                                "min-h-[100px] text-center",
                                isSelected 
                                    ? "border-primary bg-primary/5 shadow-sm" 
                                    : "border-border bg-background hover:border-primary/50",
                                (isReadOnly || isDisabled) && "opacity-50 cursor-not-allowed hover:border-border hover:shadow-none",
                                error && !isSelected && "border-destructive/50"
                            )}
                        >
                            {/* Placeholder Icon */}
                            <div className={cn(
                                "mb-2 p-2 rounded-full transition-colors",
                                isSelected 
                                    ? "bg-primary/10 text-primary" 
                                    : "bg-muted text-muted-foreground"
                            )}>
                                <Square className="h-6 w-6" />
                            </div>
                            
                            {/* Choice Label */}
                            <span className={cn(
                                "text-sm font-medium text-center leading-tight",
                                isSelected ? "text-primary" : "text-foreground"
                            )}>
                                {choice.displayValue}
                            </span>
                            
                            {/* Selected indicator */}
                            {isSelected && (
                                <div className="absolute top-2 right-2 w-3 h-3 bg-primary rounded-full border-2 border-background shadow-sm" />
                            )}
                        </button>
                    );
                })}
            </div>
        </BaseField>
    );
}