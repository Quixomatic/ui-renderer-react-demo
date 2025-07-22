import React from 'react';
import { CalendarIcon } from 'lucide-react';
import {
    Button,
    DatePicker,
    Dialog,
    Group,
    Popover,
} from 'react-aria-components';
import { Calendar } from '../../../../../components/ui/calendar-rac.jsx';
import { DateInput } from '../../../../../components/ui/datefield-rac.jsx';
import { BaseField } from './BaseField.jsx';
import { parseDate } from '@internationalized/date';

/**
 * DateFieldRAC - Date field using React Aria Components
 * 
 * Uses React Aria's DatePicker with segmented date input and calendar popover.
 * Much cleaner than MetaSegmentedInput approach - handles all date logic internally.
 * For glide_date type fields with proper value/displayValue handling.
 */
export function DateFieldRAC({ 
    name, 
    config, 
    value, 
    fieldState, 
    error, 
    showValidationErrors,
    renderStyle,
    shadowRoot,
    onValueChange 
}) {
    // Get current field value
    const currentValue = typeof value === 'object' ? (value?.value || '') : (value || '');
    const displayValue = typeof value === 'object' ? (value?.displayValue || value?.value || '') : (value || '');
    
    // Parse the date value for React Aria
    let dateValue = null;
    if (currentValue && currentValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
        try {
            dateValue = parseDate(currentValue);
        } catch (e) {
            console.warn('Invalid date value:', currentValue);
        }
    }
    
    // Handle date changes
    const handleDateChange = (newDate) => {
        if (newDate) {
            // Format as YYYY-MM-DD
            const year = newDate.year.toString().padStart(4, '0');
            const month = newDate.month.toString().padStart(2, '0');
            const day = newDate.day.toString().padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;
            
            onValueChange(name, {
                value: formattedDate,
                displayValue: formattedDate
            });
        } else {
            onValueChange(name, {
                value: '',
                displayValue: ''
            });
        }
    };
    
    // Check if field is readonly or disabled
    const isReadOnly = fieldState?.readonly || config.readOnly;
    const isDisabled = fieldState?.disabled;

    return (
        <BaseField 
            name={name} 
            config={config} 
            value={value} 
            fieldState={fieldState} 
            error={error}
            showValidationErrors={showValidationErrors}
            renderStyle={renderStyle}
        >
            <DatePicker
                value={dateValue}
                onChange={handleDateChange}
                isDisabled={isDisabled || isReadOnly}
                className="w-full"
            >
                <div className="flex">
                    <Group className="w-full">
                        <DateInput />
                    </Group>
                    <Button
                        className="text-muted-foreground/80 hover:text-foreground z-10 -ms-9 -me-px flex w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none data-focus-visible:border-ring data-focus-visible:ring-ring/50 data-focus-visible:ring-[3px]"
                    >
                        <CalendarIcon size={16} />
                    </Button>
                </div>
                <Popover
                    className="bg-background text-popover-foreground z-50 rounded-lg border shadow-lg outline-hidden data-entering:animate-in data-exiting:animate-out data-[entering]:fade-in-0 data-[exiting]:fade-out-0 data-[entering]:zoom-in-95 data-[exiting]:zoom-out-95"
                    offset={4}
                    containerPadding={8}
                >
                    <Dialog className="max-h-[inherit] overflow-auto p-2">
                        <Calendar />
                    </Dialog>
                </Popover>
            </DatePicker>
        </BaseField>
    );
}