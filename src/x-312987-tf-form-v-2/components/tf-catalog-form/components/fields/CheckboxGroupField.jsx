import React, { useState } from 'react';
import { Checkbox } from '../../../../../components/ui/checkbox.jsx';
import { Label } from '../../../../../components/ui/label.jsx';
import { BaseField } from './BaseField.jsx';
import { cn } from '../../../../../../components/lib/utils.js';

/**
 * CheckboxGroupField - Mandatory checkbox group field
 * 
 * Handles ServiceNow's rare checkbox group pattern where:
 * - A container with mandatory=true contains multiple checkboxes
 * - All child checkboxes have hideMandatory=true
 * - Group validation requires at least one checkbox to be selected
 * - Updates individual checkbox field values independently
 */
export function CheckboxGroupField({ 
    baseFieldProps,
    onValueChange,
    checkboxGroupInfo,
    childFields
}) {
    // Extract needed values from baseFieldProps
    const { name, config, value, fieldState, error, showValidationErrors } = baseFieldProps;
    
    if (!checkboxGroupInfo || !checkboxGroupInfo.childFieldNames) {
        console.error('CheckboxGroupField: Missing checkboxGroupInfo');
        return null;
    }
    
    // Create checkbox options from child field objects
    const checkboxOptions = checkboxGroupInfo.childFieldNames.map(fieldName => {
        const childField = childFields[fieldName];
        return {
            fieldName: fieldName,
            label: childField?.label || fieldName.split('.').pop(),
            mandatory: childField?.mandatory || false,
            visible: childField?.visible !== false,
            readonly: childField?.readonly || false
        };
    });
    
    // Track current checkbox states - start with all false
    const [checkboxStates, setCheckboxStates] = useState(() => {
        const initialState = {};
        checkboxOptions.forEach(option => {
            initialState[option.fieldName] = false;
        });
        return initialState;
    });
    
    // Track if user has interacted with this checkbox group
    const [hasInteracted, setHasInteracted] = useState(false);
    
    // Count selected checkboxes for validation
    const selectedCount = Object.values(checkboxStates).filter(Boolean).length;
    const isGroupValid = !config.mandatory || selectedCount > 0;
    // Show validation error if user has interacted with this group OR if global validation is showing
    const groupError = (!isGroupValid && (hasInteracted || showValidationErrors)) ? 'At least one option must be selected' : null;
    
    // Handle checkbox selection changes
    const handleCheckboxChange = (fieldName, checked) => {
        // Mark as interacted when user changes any checkbox
        setHasInteracted(true);
        
        // Update local state
        const newStates = {
            ...checkboxStates,
            [fieldName]: checked
        };
        setCheckboxStates(newStates);
        
        // Update the specific checkbox field value
        onValueChange(fieldName, {
            value: checked ? 'true' : 'false',
            displayValue: checked ? 'true' : 'false'
        });
    };
    
    const isReadOnly = fieldState?.readonly || config.readOnly;
    const isDisabled = fieldState?.disabled;
    
    return (
        <BaseField {...baseFieldProps} error={null}>
            <div className="checkbox-group-field">
                <div className="space-y-3">
                    {checkboxOptions
                        .filter(option => option.visible) // Only show visible checkboxes
                        .map((option) => {
                            const isChecked = checkboxStates[option.fieldName] || false;
                            const checkboxId = `${name}_${option.fieldName}`;
                            const isOptionDisabled = isReadOnly || isDisabled || option.readonly;
                            
                            return (
                                <div key={option.fieldName} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={checkboxId}
                                        checked={isChecked}
                                        onCheckedChange={(checked) => 
                                            handleCheckboxChange(option.fieldName, checked)
                                        }
                                        disabled={isOptionDisabled}
                                        className={cn(
                                            groupError && "border-destructive data-[state=checked]:border-destructive"
                                        )}
                                    />
                                    <Label
                                        htmlFor={checkboxId}
                                        className={cn(
                                            "text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                                            isOptionDisabled && "opacity-70 cursor-not-allowed",
                                            groupError && "text-destructive"
                                        )}
                                    >
                                        {option.label}
                                    </Label>
                                </div>
                            );
                        })
                    }
                </div>
                
                {/* Group validation error message */}
                {groupError && (
                    <div className="text-sm text-destructive mt-2">
                        {groupError}
                    </div>
                )}
            </div>
        </BaseField>
    );
}