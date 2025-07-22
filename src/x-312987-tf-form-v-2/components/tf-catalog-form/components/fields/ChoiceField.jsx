import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../components/ui/select.jsx';
import { BaseField } from './BaseField.jsx';

/**
 * ChoiceField - Select dropdown field
 * 
 * Handles choice type fields with proper value/displayValue handling.
 * - value: The internal choice value (e.g., "economy_airfare")
 * - displayValue: The human-readable label (e.g., "Economy Airfare")
 * 
 * Special handling for ServiceNow's "includeNone" option which uses empty string values.
 * These are transformed to "__NONE__" internally to work with shadcn Select component.
 */

// Constants for empty value transformation
const NONE_PLACEHOLDER = '__NONE__';

/**
 * Transform empty string values to placeholder for shadcn Select compatibility
 * @param {Array} choices - Array of choice objects
 * @returns {Array} - Transformed choices array
 */
function transformChoicesForSelect(choices) {
    return choices.map(choice => ({
        ...choice,
        value: choice.value === '' ? NONE_PLACEHOLDER : choice.value
    }));
}

/**
 * Transform placeholder back to empty string for ServiceNow compatibility
 * @param {string} value - Selected value from Select
 * @returns {string} - Actual value for ServiceNow
 */
function transformValueFromSelect(value) {
    return value === NONE_PLACEHOLDER ? '' : value;
}
export function ChoiceField({ 
    baseFieldProps,
    onValueChange 
}) {
    // Extract needed values from baseFieldProps
    const { name, config, value, error, shadowRoot } = baseFieldProps;
    // Get current field value and transform for Select component
    const actualValue = typeof value === 'object' ? (value?.value || '') : (value || '');
    const currentValue = actualValue === '' ? NONE_PLACEHOLDER : actualValue;
    const displayValue = typeof value === 'object' ? (value?.displayValue || value?.value || '') : (value || '');
    
    // Handle value changes
    const handleChange = (selectedValue) => {
        // Transform back to actual ServiceNow value
        const actualSelectedValue = transformValueFromSelect(selectedValue);
        
        // Find the corresponding display value using the actual value
        let selectedDisplayValue = actualSelectedValue;
        
        if (config.choices) {
            const choice = config.choices.find(c => c.value === actualSelectedValue);
            selectedDisplayValue = choice ? choice.displayValue : actualSelectedValue;
        } else if (config.valuesList && config.display_value_list) {
            const index = config.valuesList.indexOf(actualSelectedValue);
            selectedDisplayValue = index >= 0 ? config.display_value_list[index] : actualSelectedValue;
        }
        
        onValueChange(name, {
            value: actualSelectedValue,
            displayValue: selectedDisplayValue
        });
    };

    // Get available choices and transform them for Select component
    const choices = config.choices || [];
    const legacyChoices = config.valuesList?.map((value, index) => ({
        value: value,
        displayValue: config.display_value_list?.[index] || value
    })) || [];
    
    const rawChoices = choices.length > 0 ? choices : legacyChoices;
    const transformedChoices = transformChoicesForSelect(rawChoices);

    return (
        <BaseField {...baseFieldProps}>
            <Select value={currentValue} onValueChange={handleChange}>
                <SelectTrigger className={`w-full ${error ? 'border-destructive' : ''}`}>
                    <SelectValue placeholder="-- Choose an option --" />
                </SelectTrigger>
                <SelectContent container={shadowRoot || document.body}>
                    {transformedChoices.map((choice) => (
                        <SelectItem key={choice.value} value={choice.value}>
                            {choice.displayValue}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </BaseField>
    );
}