import React, { useEffect, useMemo } from 'react';
import { Square, Loader2 } from 'lucide-react';
import { BaseField } from './BaseField.jsx';
import { cn } from '../../../../../../components/lib/utils.js';

/**
 * ReferenceTileChoiceField - Visual tile interface for reference selection
 * 
 * Handles reference:tile_choice subtype fields.
 * Uses reference search to get options and displays them as clickable tiles.
 * Single selection (like reference field) but with visual tile interface.
 */
export function ReferenceTileChoiceField({ 
    baseFieldProps,
    referenceData,
    referenceLoading,
    onReferenceSearch,
    onValueChange 
}) {
    // Extract needed values from baseFieldProps
    const { name, config, value, error, fieldState } = baseFieldProps;
    
    // Extract configuration
    const referenceTable = config.reference || 'incident';
    const qualifier = config.qualifier || '';
    const limit = config.parsedAttributes?.limit || 12; // Fewer for tile display
    
    // Get current field value
    const currentValue = typeof value === 'object' ? (value?.value || '') : (value || '');
    const currentDisplayValue = typeof value === 'object' ? (value?.displayValue || '') : '';
    
    // Check if field is readonly or disabled
    const isReadOnly = fieldState?.readonly || config.readOnly;
    const isDisabled = fieldState?.disabled;
    
    // Create cache key for this field
    const cacheKey = `${name}__${referenceTable}`;
    
    // Get data from existing reference infrastructure
    const options = referenceData?.[cacheKey] || [];
    const isLoading = referenceLoading?.[cacheKey] || false;
    
    // Trigger initial search on mount (no search term, just initial query)
    useEffect(() => {
        if (onReferenceSearch) {
            onReferenceSearch(name, referenceTable, '', qualifier);
        }
    }, [name, referenceTable, qualifier, onReferenceSearch]);
    
    // Limit options for tile display
    const limitedOptions = useMemo(() => {
        return options.slice(0, limit);
    }, [options, limit]);
    
    // Handle tile selection
    const handleSelect = (optionValue, optionLabel) => {
        if (isReadOnly || isDisabled) return;
        
        // If clicking the same option, deselect it
        const newValue = currentValue === optionValue ? '' : optionValue;
        const newDisplayValue = currentValue === optionValue ? '' : optionLabel;
        
        onValueChange(name, {
            value: newValue,
            displayValue: newDisplayValue
        });
    };
    
    // Show current selection even if not in loaded options (for when record not in current results)
    const allOptionsWithCurrent = useMemo(() => {
        if (!currentValue || !currentDisplayValue) return limitedOptions;
        
        // Check if current selection is already in the options
        const currentInOptions = limitedOptions.some(opt => opt.value === currentValue);
        
        if (currentInOptions) {
            return limitedOptions;
        }
        
        // Add current selection to the beginning of the list
        return [
            { value: currentValue, label: currentDisplayValue },
            ...limitedOptions
        ];
    }, [limitedOptions, currentValue, currentDisplayValue]);
    
    return (
        <BaseField {...baseFieldProps}>
            <div className="space-y-3">
                {/* Loading state */}
                {isLoading && limitedOptions.length === 0 && (
                    <div className="flex items-center justify-center p-8 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Loading options...
                    </div>
                )}
                
                {/* No options state */}
                {!isLoading && allOptionsWithCurrent.length === 0 && (
                    <div className="text-sm text-muted-foreground italic py-1.5 text-center">
                        No options found
                    </div>
                )}
                
                {/* Tiles grid */}
                {allOptionsWithCurrent.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {allOptionsWithCurrent.map((option) => {
                            const isSelected = currentValue === option.value;
                            
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    disabled={isReadOnly || isDisabled}
                                    onClick={() => handleSelect(option.value, option.label)}
                                    className={cn(
                                        "relative flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-200",
                                        "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                                        "min-h-[100px] text-center",
                                        isSelected 
                                            ? "border-primary bg-primary/5 shadow-sm" 
                                            : "border-border bg-background hover:border-primary/50",
                                        (isReadOnly || isDisabled) && "opacity-50 cursor-not-allowed hover:border-border hover:shadow-none",
                                        error && !isSelected && "border-destructive/50"
                                    )}
                                >
                                    {/* Placeholder Icon */}
                                    <div className={cn(
                                        "mb-2 p-2 rounded-full transition-colors",
                                        isSelected 
                                            ? "bg-primary/10 text-primary" 
                                            : "bg-muted text-muted-foreground"
                                    )}>
                                        <Square className="h-6 w-6" />
                                    </div>
                                    
                                    {/* Option Label */}
                                    <span className={cn(
                                        "text-sm font-medium text-center leading-tight",
                                        isSelected ? "text-primary" : "text-foreground"
                                    )}>
                                        {option.label}
                                    </span>
                                    
                                    {/* Secondary info if available */}
                                    {option.secondaryInfo && (
                                        <span className="text-xs text-muted-foreground mt-1 leading-tight">
                                            {option.secondaryInfo}
                                        </span>
                                    )}
                                    
                                    {/* Selected indicator */}
                                    {isSelected && (
                                        <div className="absolute top-2 right-2 w-3 h-3 bg-primary rounded-full border-2 border-background shadow-sm" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
                
                {/* Show loading indicator when loading more options */}
                {isLoading && limitedOptions.length > 0 && (
                    <div className="flex items-center justify-center p-4 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Loading...
                    </div>
                )}
            </div>
        </BaseField>
    );
}