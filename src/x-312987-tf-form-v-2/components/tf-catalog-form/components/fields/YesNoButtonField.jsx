import React from 'react';
import { Button } from '../../../../../components/ui/button.jsx';
import { BaseField } from './BaseField.jsx';
import { cn } from '../../../../../../components/lib/utils.js';

/**
 * YesNoButtonField - Yes/No button group choice field
 * 
 * Handles choice fields with subType: "button_yes_no".
 * Displays Yes/No options as a button group instead of a dropdown.
 */
export function YesNoButtonField({ 
    name, 
    config, 
    value, 
    fieldState, 
    error, 
    renderStyle,
    onValueChange 
}) {
    // Get current value
    const currentValue = typeof value === 'object' ? (value?.value || '') : (value || '');
    const displayValue = typeof value === 'object' ? (value?.displayValue || value?.value || '') : (value || '');
    
    // Get choices - default to Yes/No if not provided
    const choices = config.choices || [
        { value: 'Yes', displayValue: 'Yes' },
        { value: 'No', displayValue: 'No' }
    ];

    // Handle selection
    const handleSelect = (choiceValue, choiceDisplay) => {
        onValueChange(name, {
            value: choiceValue,
            displayValue: choiceDisplay
        });
    };

    const isReadOnly = fieldState?.readonly || config.readOnly;
    const isDisabled = fieldState?.disabled;

    return (
        <BaseField 
            name={name} 
            config={config} 
            value={value} 
            fieldState={fieldState} 
            error={error}
            renderStyle={renderStyle}
        >
            <div className="flex gap-2">
                {choices.map((choice) => {
                    const isSelected = currentValue === choice.value;
                    return (
                        <Button
                            key={choice.value}
                            type="button"
                            variant={isSelected ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleSelect(choice.value, choice.displayValue)}
                            disabled={isReadOnly || isDisabled}
                            className={cn(
                                "min-w-[60px]",
                                isSelected && "font-medium",
                                error && "border-destructive"
                            )}
                        >
                            {choice.displayValue}
                        </Button>
                    );
                })}
            </div>
        </BaseField>
    );
}