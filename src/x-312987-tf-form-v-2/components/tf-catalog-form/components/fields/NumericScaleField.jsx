import React from 'react';
import { Slider } from '../../../../../components/ui/slider.jsx';
import { Label } from '../../../../../components/ui/label.jsx';
import { BaseField } from './BaseField.jsx';
import { cn } from '../../../../../../components/lib/utils.js';

/**
 * NumericScaleField - Rating scale field (1-5 stars, etc.)
 * 
 * Handles numeric_scale type fields with proper value/displayValue handling.
 * Displays a row of clickable numbers for rating selection.
 */
export function NumericScaleField({ 
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
    
    // Determine scale range (default 1-5)
    const min = parseInt(config.min) || 1;
    const max = parseInt(config.max) || 5;
    const skipInterval = 1; // Show all numbers by default
    const ticks = [...Array(max - min + 1)].map((_, i) => min + i);

    // Handle selection
    const handleChange = (values) => {
        const scaleValue = values[0];
        const valueStr = String(scaleValue);
        onValueChange(name, {
            value: valueStr,
            displayValue: valueStr
        });
    };

    const isReadOnly = fieldState?.readonly || config.readOnly;
    const isDisabled = fieldState?.disabled;
    const selectedValue = currentValue ? parseInt(currentValue) : min;

    return (
        <BaseField 
            name={name} 
            config={config} 
            value={value} 
            fieldState={fieldState} 
            error={error}
            renderStyle={renderStyle}
        >
            <div className="flex flex-col gap-4">
                <div>
                    <Slider 
                        value={[selectedValue]}
                        onValueChange={handleChange}
                        min={min}
                        max={max}
                        step={1}
                        disabled={isReadOnly || isDisabled}
                        className={error ? 'data-[slider-track]:bg-destructive/20' : ''}
                        aria-label={`Numeric scale from ${min} to ${max}`}
                    />
                    <span
                        className="text-muted-foreground mt-3 flex w-full items-center justify-between gap-1 px-2.5 text-xs font-medium"
                        aria-hidden="true"
                    >
                        {ticks.map((tickValue, i) => (
                            <span
                                key={tickValue}
                                className="flex w-0 flex-col items-center justify-center gap-2"
                            >
                                <span
                                    className={cn(
                                        "bg-muted-foreground/70 h-1 w-px",
                                        i % skipInterval !== 0 && "h-0.5"
                                    )}
                                />
                                <span className={cn(
                                    i % skipInterval !== 0 && "opacity-0",
                                    selectedValue === tickValue && "font-bold text-foreground"
                                )}>
                                    {tickValue}
                                </span>
                            </span>
                        ))}
                    </span>
                </div>
                
                {/* Optional scale labels */}
                {(config.lowLabel || config.highLabel) && (
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                        <span>{config.lowLabel || ''}</span>
                        <span>{config.highLabel || ''}</span>
                    </div>
                )}
            </div>
        </BaseField>
    );
}