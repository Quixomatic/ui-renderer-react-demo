import React, { useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { ChevronDownIcon } from 'lucide-react';
import { Button } from '../../../../../components/ui/button.jsx';
import { Calendar } from '../../../../../components/ui/calendar.jsx';
import { Popover, PopoverContent, PopoverTrigger } from '../../../../../components/ui/popover.jsx';
import { Input } from '../../../../../components/ui/input.jsx';
import { BaseField } from './BaseField.jsx';

/**
 * DateField - Date picker field
 * 
 * Handles glide_date and glide_date_time type fields with proper value/displayValue handling.
 * Uses shadcn/ui Calendar and Popover components for a proper date picker experience.
 * For date fields, value and displayValue are typically the same formatted date string.
 */
export function DateField({ 
    name, 
    config, 
    value, 
    fieldState, 
    error, 
    renderStyle,
    shadowRoot,
    onValueChange 
}) {
    const [open, setOpen] = React.useState(false);

    // Get current field value
    const currentValue = typeof value === 'object' ? (value?.value || '') : (value || '');
    const displayValue = typeof value === 'object' ? (value?.displayValue || value?.value || '') : (value || '');
    
    // Parse current date value
    const currentDate = currentValue ? new Date(currentValue) : undefined;
    
    // Handle date selection from calendar
    const handleDateSelect = (date) => {
        if (date) {
            const formattedDate = format(date, 'yyyy-MM-dd');
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
        setOpen(false);
    };

    // Handle time input change
    const handleTimeChange = (e) => {
        const timeValue = e.target.value;
        if (currentDate && timeValue) {
            // Combine date and time
            const [hours, minutes, seconds = '00'] = timeValue.split(':');
            const dateTime = new Date(currentDate);
            dateTime.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds));
            const isoString = dateTime.toISOString();
            onValueChange(name, {
                value: isoString,
                displayValue: isoString
            });
        }
    };

    // Extract time from current datetime value
    const getCurrentTime = () => {
        if (currentDate) {
            return currentDate.toTimeString().slice(0, 8); // HH:mm:ss format
        }
        return '';
    };

    // Check if field is readonly or disabled
    const isReadOnly = fieldState?.readonly || config.readOnly;
    const isDisabled = fieldState?.disabled;

    // For datetime fields, use separate date and time inputs
    if (config.type === 'glide_date_time') {
        return (
            <BaseField 
                name={name} 
                config={config} 
                value={value} 
                fieldState={fieldState} 
                error={error}
                renderStyle={renderStyle}
            >
                <div className="flex gap-4">
                    <div className="flex flex-col gap-3">
                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={`w-32 justify-between font-normal ${error ? 'border-destructive' : ''} ${!currentDate ? 'text-muted-foreground' : ''}`}
                                    disabled={isReadOnly || isDisabled}
                                >
                                    {currentDate ? currentDate.toLocaleDateString() : "Select date"}
                                    <ChevronDownIcon />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent 
                                className="w-auto overflow-hidden p-0" 
                                align="start"
                                container={shadowRoot}
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
                    <div className="flex flex-col gap-3">
                        <Input
                            type="time"
                            step="1"
                            value={getCurrentTime()}
                            onChange={handleTimeChange}
                            placeholder="Select time"
                            className={`bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none ${error ? 'border-destructive' : ''}`}
                            readOnly={isReadOnly}
                            disabled={isDisabled}
                        />
                    </div>
                </div>
            </BaseField>
        );
    }

    // For date fields, use calendar picker with shadow DOM container
    return (
        <BaseField 
            name={name} 
            config={config} 
            value={value} 
            fieldState={fieldState} 
            error={error}
            renderStyle={renderStyle}
        >
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className={`w-full justify-between font-normal ${error ? 'border-destructive' : ''} ${!currentDate ? 'text-muted-foreground' : ''}`}
                        disabled={isReadOnly || isDisabled}
                    >
                        {currentDate ? currentDate.toLocaleDateString() : "Select date"}
                        <ChevronDownIcon />
                    </Button>
                </PopoverTrigger>
                <PopoverContent 
                    className="w-auto overflow-hidden p-0" 
                    align="start"
                    container={shadowRoot}
                >
                    <Calendar
                        mode="single"
                        selected={currentDate}
                        captionLayout="dropdown"
                        onSelect={handleDateSelect}
                    />
                </PopoverContent>
            </Popover>
        </BaseField>
    );
}