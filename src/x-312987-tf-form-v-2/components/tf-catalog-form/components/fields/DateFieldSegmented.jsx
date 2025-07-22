import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '../../../../../components/ui/button.jsx';
import { Calendar } from '../../../../../components/ui/calendar.jsx';
import { Popover, PopoverContent, PopoverTrigger } from '../../../../../components/ui/popover.jsx';
import { MetaSegmentedInput } from '../../../../../components/ui/meta-segmented-input.jsx';
import { BaseField } from './BaseField.jsx';
import { datePresets } from '../../../../../../components/lib/segmented-input-presets.js';
import { resolveSegmentedPreset } from '../../../../../../components/lib/resolve-segmented-preset.js';

/**
 * DateFieldSegmented - Date input with both typing and calendar selection
 * 
 * Combines MetaSegmentedInput for direct date typing (YYYY-MM-DD format)
 * with a calendar popover for visual date selection.
 * Handles glide_date type fields with proper value/displayValue handling.
 */
export function DateFieldSegmented({ 
    baseFieldProps,
    onValueChange 
}) {
    // Extract needed values from baseFieldProps
    const { name, config, value, fieldState, error, showValidationErrors, shadowRoot } = baseFieldProps;
    
    const [open, setOpen] = useState(false);
    const [validationError, setValidationError] = useState(null);
    
    // Get current field value
    const currentValue = typeof value === 'object' ? (value?.value || '') : (value || '');
    const displayValue = typeof value === 'object' ? (value?.displayValue || value?.value || '') : (value || '');
    
    // Parse current date value
    const currentDate = currentValue ? new Date(currentValue) : undefined;
    
    // Handle value changes from MetaSegmentedInput
    const handleSegmentedChange = ({ config: configKey, value: newValue }) => {
        // MetaSegmentedInput will give us the full date string when all segments are filled
        if (newValue && newValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // Validate the date is real (not something like 2024-13-32)
            const date = new Date(newValue);
            if (!isNaN(date.getTime())) {
                onValueChange(name, {
                    value: newValue,
                    displayValue: newValue
                });
                setValidationError(null);
            } else {
                setValidationError('Invalid date');
            }
        } else if (newValue === '') {
            // Clear the value
            onValueChange(name, {
                value: '',
                displayValue: ''
            });
            setValidationError(null);
        }
    };
    
    // Handle date selection from calendar
    const handleDateSelect = (date) => {
        if (date) {
            const formattedDate = format(date, 'yyyy-MM-dd');
            onValueChange(name, {
                value: formattedDate,
                displayValue: formattedDate
            });
            setValidationError(null);
        } else {
            onValueChange(name, {
                value: '',
                displayValue: ''
            });
        }
        setOpen(false);
    };
    
    // Handle validation errors from MetaSegmentedInput
    const handleError = ({ config: configKey, errors }) => {
        if (errors && errors.length > 0) {
            setValidationError(errors[0].reason);
        } else {
            setValidationError(null);
        }
    };
    
    // Check if field is readonly or disabled
    const isReadOnly = fieldState?.readonly || config.readOnly;
    const isDisabled = fieldState?.disabled;
    
    // Configure the date preset
    const dateConfig = {
        default: 'dateYMD',
        options: {
            dateYMD: resolveSegmentedPreset(datePresets.dateYMD)
        }
    };

    return (
        <BaseField 
            {...baseFieldProps}
            error={error || (showValidationErrors && validationError)}
        >
            <div className="flex gap-2">
                <div className="flex-1">
                    <MetaSegmentedInput
                        value={displayValue}
                        onChange={handleSegmentedChange}
                        onError={handleError}
                        use="dateYMD"
                        configOptions={dateConfig}
                        disabled={isDisabled || isReadOnly}
                        variant="unified"
                        className=""
                    />
                </div>
                
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            className={`flex-shrink-0 ${error || validationError ? 'border-destructive' : ''}`}
                            disabled={isReadOnly || isDisabled}
                            type="button"
                        >
                            <CalendarIcon className="h-4 w-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent 
                        className="w-auto overflow-hidden p-0" 
                        align="end"
                        container={shadowRoot || document.body}
                    >
                        <Calendar
                            mode="single"
                            selected={currentDate}
                            captionLayout="dropdown"
                            onSelect={handleDateSelect}
                        />
                    </PopoverContent>
                </Popover>
            </div>
        </BaseField>
    );
}