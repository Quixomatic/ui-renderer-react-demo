import React, { useState, useEffect } from 'react';
import { Input } from '../../../../../components/ui/input.jsx';
import { BaseField } from './BaseField.jsx';

/**
 * DurationField - Duration input for time spans
 * 
 * Handles glide_duration type fields with proper value/displayValue handling.
 * ServiceNow stores durations in a format like "1 00:00:00" (days HH:MM:SS).
 * Provides inputs for days, hours, and minutes.
 */
export function DurationField({ 
    baseFieldProps,
    onValueChange 
}) {
    // Extract needed values from baseFieldProps
    const { name, config, value, fieldState, error } = baseFieldProps;
    
    // Parse duration value into components
    const parseDuration = (durationValue) => {
        if (!durationValue || typeof durationValue !== 'string') {
            return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }

        // ServiceNow format: "1 00:00:00" or "00:00:00"
        const parts = durationValue.split(' ');
        let days = 0;
        let timePart = '';

        if (parts.length === 2) {
            days = parseInt(parts[0]) || 0;
            timePart = parts[1];
        } else {
            timePart = parts[0];
        }

        const timeParts = timePart.split(':');
        const hours = parseInt(timeParts[0]) || 0;
        const minutes = parseInt(timeParts[1]) || 0;
        const seconds = parseInt(timeParts[2]) || 0;

        return { days, hours, minutes, seconds };
    };

    // Format duration components into ServiceNow format
    const formatDuration = (days, hours, minutes, seconds) => {
        const d = parseInt(days) || 0;
        const h = parseInt(hours) || 0;
        const m = parseInt(minutes) || 0;
        const s = parseInt(seconds) || 0;
        
        // Normalize values
        const totalSeconds = d * 24 * 60 * 60 + h * 60 * 60 + m * 60 + s;
        const normalizedDays = Math.floor(totalSeconds / (24 * 60 * 60));
        const remainingSeconds = totalSeconds % (24 * 60 * 60);
        const normalizedHours = Math.floor(remainingSeconds / (60 * 60));
        const remainingAfterHours = remainingSeconds % (60 * 60);
        const normalizedMinutes = Math.floor(remainingAfterHours / 60);
        const normalizedSeconds = remainingAfterHours % 60;

        // Format as ServiceNow duration
        const timeStr = `${String(normalizedHours).padStart(2, '0')}:${String(normalizedMinutes).padStart(2, '0')}:${String(normalizedSeconds).padStart(2, '0')}`;
        
        if (normalizedDays > 0) {
            return `${normalizedDays} ${timeStr}`;
        }
        return timeStr;
    };

    // Get current value
    const currentValue = typeof value === 'object' ? (value?.value || '') : (value || '');
    const displayValue = typeof value === 'object' ? (value?.displayValue || value?.value || '') : (value || '');

    // Parse current duration
    const duration = parseDuration(currentValue);
    const [days, setDays] = useState(duration.days);
    const [hours, setHours] = useState(duration.hours);
    const [minutes, setMinutes] = useState(duration.minutes);
    const [seconds, setSeconds] = useState(duration.seconds);

    // Update local state when value prop changes
    useEffect(() => {
        const newDuration = parseDuration(currentValue);
        setDays(newDuration.days);
        setHours(newDuration.hours);
        setMinutes(newDuration.minutes);
        setSeconds(newDuration.seconds);
    }, [currentValue]);

    // Handle component changes
    const handleChange = (component, newValue) => {
        let newDays = days;
        let newHours = hours;
        let newMinutes = minutes;
        let newSeconds = seconds;

        switch (component) {
            case 'days':
                newDays = parseInt(newValue) || 0;
                setDays(newDays);
                break;
            case 'hours':
                newHours = parseInt(newValue) || 0;
                setHours(newHours);
                break;
            case 'minutes':
                newMinutes = parseInt(newValue) || 0;
                setMinutes(newMinutes);
                break;
            case 'seconds':
                newSeconds = parseInt(newValue) || 0;
                setSeconds(newSeconds);
                break;
        }

        const formattedValue = formatDuration(newDays, newHours, newMinutes, newSeconds);
        
        // Create display value
        const parts = [];
        if (newDays > 0) parts.push(`${newDays} day${newDays !== 1 ? 's' : ''}`);
        if (newHours > 0) parts.push(`${newHours} hour${newHours !== 1 ? 's' : ''}`);
        if (newMinutes > 0) parts.push(`${newMinutes} minute${newMinutes !== 1 ? 's' : ''}`);
        if (newSeconds > 0) parts.push(`${newSeconds} second${newSeconds !== 1 ? 's' : ''}`);
        const displayVal = parts.length > 0 ? parts.join(', ') : '0 seconds';

        onValueChange(name, {
            value: formattedValue,
            displayValue: displayVal
        });
    };

    const isReadOnly = fieldState?.readonly || config.readOnly;
    const isDisabled = fieldState?.disabled;

    return (
        <BaseField {...baseFieldProps}>
            <div className="flex gap-2 items-center">
                <div className="flex items-center gap-1">
                    <Input
                        type="number"
                        value={days}
                        onChange={(e) => handleChange('days', e.target.value)}
                        placeholder="0"
                        className={`w-16 ${error ? 'border-destructive' : ''}`}
                        min="0"
                        readOnly={isReadOnly}
                        disabled={isDisabled}
                    />
                    <span className="text-sm text-muted-foreground">days</span>
                </div>
                <div className="flex items-center gap-1">
                    <Input
                        type="number"
                        value={hours}
                        onChange={(e) => handleChange('hours', e.target.value)}
                        placeholder="0"
                        className={`w-16 ${error ? 'border-destructive' : ''}`}
                        min="0"
                        max="23"
                        readOnly={isReadOnly}
                        disabled={isDisabled}
                    />
                    <span className="text-sm text-muted-foreground">hours</span>
                </div>
                <div className="flex items-center gap-1">
                    <Input
                        type="number"
                        value={minutes}
                        onChange={(e) => handleChange('minutes', e.target.value)}
                        placeholder="0"
                        className={`w-16 ${error ? 'border-destructive' : ''}`}
                        min="0"
                        max="59"
                        readOnly={isReadOnly}
                        disabled={isDisabled}
                    />
                    <span className="text-sm text-muted-foreground">mins</span>
                </div>
                <div className="flex items-center gap-1">
                    <Input
                        type="number"
                        value={seconds}
                        onChange={(e) => handleChange('seconds', e.target.value)}
                        placeholder="0"
                        className={`w-16 ${error ? 'border-destructive' : ''}`}
                        min="0"
                        max="59"
                        readOnly={isReadOnly}
                        disabled={isDisabled}
                    />
                    <span className="text-sm text-muted-foreground">secs</span>
                </div>
            </div>
        </BaseField>
    );
}