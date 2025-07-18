import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../components/ui/select.jsx';
import { BaseField } from './BaseField.jsx';

/**
 * ChoiceField - Select dropdown field
 * 
 * Handles choice type fields with proper value/displayValue handling.
 * - value: The internal choice value (e.g., "economy_airfare")
 * - displayValue: The human-readable label (e.g., "Economy Airfare")
 */
export function ChoiceField({ 
    name, 
    config, 
    value, 
    fieldState, 
    error, 
    renderStyle,
    shadowRoot,
    onValueChange 
}) {
    // Get current field value
    const currentValue = typeof value === 'object' ? (value?.value || '') : (value || '');
    const displayValue = typeof value === 'object' ? (value?.displayValue || value?.value || '') : (value || '');
    
    // Handle value changes
    const handleChange = (selectedValue) => {
        // Find the corresponding display value
        let selectedDisplayValue = selectedValue;
        
        if (config.choices) {
            const choice = config.choices.find(c => c.value === selectedValue);
            selectedDisplayValue = choice ? choice.displayValue : selectedValue;
        } else if (config.valuesList && config.display_value_list) {
            const index = config.valuesList.indexOf(selectedValue);
            selectedDisplayValue = index >= 0 ? config.display_value_list[index] : selectedValue;
        }
        
        onValueChange(name, {
            value: selectedValue,
            displayValue: selectedDisplayValue
        });
    };

    // Get available choices
    const choices = config.choices || [];
    const legacyChoices = config.valuesList?.map((value, index) => ({
        value: value,
        displayValue: config.display_value_list?.[index] || value
    })) || [];
    
    const allChoices = choices.length > 0 ? choices : legacyChoices;

    return (
        <BaseField 
            name={name} 
            config={config} 
            value={value} 
            fieldState={fieldState} 
            error={error}
            renderStyle={renderStyle}
        >
            <Select value={currentValue} onValueChange={handleChange}>
                <SelectTrigger className={`w-full ${error ? 'border-destructive' : ''}`}>
                    <SelectValue placeholder="-- Choose an option --" />
                </SelectTrigger>
                <SelectContent container={shadowRoot}>
                    {allChoices.map((choice) => (
                        <SelectItem key={choice.value} value={choice.value}>
                            {choice.displayValue}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </BaseField>
    );
}