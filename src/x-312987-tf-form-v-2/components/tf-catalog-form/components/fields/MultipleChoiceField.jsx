import React from 'react';
import { RadioGroup, RadioGroupItem } from '../../../../../components/ui/radio-group.jsx';
import { Label } from '../../../../../components/ui/label.jsx';
import { BaseField } from './BaseField.jsx';

/**
 * MultipleChoiceField - Radio button group for single selection
 * 
 * Handles multiple_choice type fields with proper value/displayValue handling.
 * Displays options as radio buttons for single selection.
 */
export function MultipleChoiceField({ 
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
    
    // Get choices from config
    const choices = config.choices || [];
    
    // Handle for backward compatibility with valuesList/display_value_list
    const choiceList = choices.length > 0 ? choices : 
        (config.valuesList || []).map((val, idx) => ({
            value: val,
            displayValue: config.display_value_list?.[idx] || val
        }));

    // Handle selection
    const handleChange = (selectedValue) => {
        // Find the display value for the selected value
        const selectedChoice = choiceList.find(choice => choice.value === selectedValue);
        const displayVal = selectedChoice ? selectedChoice.displayValue : selectedValue;
        
        onValueChange(name, {
            value: selectedValue,
            displayValue: displayVal
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
            <RadioGroup
                value={currentValue}
                onValueChange={handleChange}
                disabled={isReadOnly || isDisabled}
                className="flex flex-col gap-2"
            >
                {choiceList.map((choice) => (
                    <div key={choice.value} className="flex items-center space-x-2">
                        <RadioGroupItem 
                            value={choice.value} 
                            id={`${name}-${choice.value}`}
                            className={error ? 'border-destructive' : ''}
                        />
                        <Label 
                            htmlFor={`${name}-${choice.value}`}
                            className="font-normal cursor-pointer"
                        >
                            {choice.displayValue}
                        </Label>
                    </div>
                ))}
            </RadioGroup>
        </BaseField>
    );
}