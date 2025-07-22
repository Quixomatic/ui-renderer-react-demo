import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '../../../../../components/ui/input.jsx';
import { Combobox } from '../../../../../components/ui/combobox.jsx';
import { BaseField } from './BaseField.jsx';

/**
 * ReferenceField - Reference lookup field
 * 
 * Handles reference type fields with proper value/displayValue handling.
 * - value: The sys_id of the referenced record
 * - displayValue: The human-readable name of the referenced record
 * 
 * This is a basic implementation - in a full implementation this would include:
 * - Autocomplete dropdown with search
 * - Lookup dialog
 * - Clear button
 * - Avatar/icon for user references
 */
export function ReferenceField({ 
    baseFieldProps,
    onValueChange,
    onReferenceSearch,
    onReferenceLoadMore,
    referenceData,
    referenceLoading,
    referencePagination
}) {
    // Extract needed values from baseFieldProps
    const { name, config, value, fieldState, error, shadowRoot } = baseFieldProps;
    // Get current field value
    const currentValue = typeof value === 'object' ? (value?.value || '') : (value || '');      // sys_id
    const displayValue = typeof value === 'object' ? (value?.displayValue || '') : (value || ''); // display name
    
    const [searchTerm, setSearchTerm] = useState('');
    const referenceTable = config.reference || 'sys_user';
    const qualifier = config.referenceQual || config.qualifier;
    
    // Get cache key for this field's data (simplified - field and table only)
    const cacheKey = `${name}__${referenceTable}`;
    
    // Get reference options from cache (with safe fallbacks)
    const baseReferenceOptions = (referenceData && referenceData[cacheKey]) || [];
    const isLoading = (referenceLoading && referenceLoading[cacheKey]) || false;
    const isLoadingMore = (referenceLoading && referenceLoading[`${cacheKey}_loadmore`]) || false;
    
    // Ensure selected value is always in options, even if not in current search results
    let referenceOptions = [...baseReferenceOptions];
    if (currentValue && displayValue) {
        const selectedOption = {
            value: currentValue,
            label: displayValue,
            secondaryInfo: '' // We don't have secondary info for the selected value
        };
        
        // Check if selected option is already in the list
        const existingIndex = referenceOptions.findIndex(opt => opt.value === currentValue);
        if (existingIndex === -1) {
            // Add selected option at the beginning if not found
            referenceOptions = [selectedOption, ...referenceOptions];
        }
    }
    
    // Get pagination info
    const paginationInfo = (referencePagination && referencePagination[cacheKey]) || {};
    const hasMore = paginationInfo.hasMore || false;
    
    // Debug logging
    /*useEffect(() => {
        console.log('ReferenceField debug:', {
            name,
            cacheKey,
            referenceData,
            baseOptions: baseReferenceOptions.length,
            finalOptions: referenceOptions.length,
            currentValue,
            displayValue,
            isLoading,
            isLoadingMore,
            hasMore,
            paginationInfo,
            hasOptions: referenceOptions.length > 0
        });
    }, [referenceData, referenceLoading, referencePagination, cacheKey, baseReferenceOptions.length, referenceOptions.length, currentValue, displayValue]);*/
    
    // Trigger initial load of reference data
    useEffect(() => {
        if (onReferenceSearch && !baseReferenceOptions.length && !isLoading) {
            onReferenceSearch(name, referenceTable, '', qualifier);
        }
    }, [name, referenceTable, qualifier]); // Removed onReferenceSearch dependency
    
    // Handle search term changes
    useEffect(() => {
        if (onReferenceSearch) {
            // Debounce the search
            const timeoutId = setTimeout(() => {
                onReferenceSearch(name, referenceTable, searchTerm, qualifier);
            }, 300);
            
            return () => clearTimeout(timeoutId);
        }
    }, [searchTerm, name, referenceTable, qualifier]); // Removed onReferenceSearch dependency
    
    // Handle value changes from combobox
    const handleValueChange = (selectedValue) => {
        if (selectedValue) {
            const selectedOption = referenceOptions.find(opt => opt.value === selectedValue);
            onValueChange(name, {
                value: selectedValue,
                displayValue: selectedOption?.label || selectedValue
            });
        } else {
            onValueChange(name, {
                value: '',
                displayValue: ''
            });
        }
    };

    // Handle clear button click
    const handleClear = (event) => {
        event.preventDefault();
        event.stopPropagation();
        onValueChange(name, {
            value: '',
            displayValue: ''
        });
    };

    // Handle load more (memoized to prevent recreation on every render)
    const handleLoadMore = useCallback(() => {
        if (onReferenceLoadMore && hasMore && !isLoadingMore) {
            onReferenceLoadMore(name, referenceTable);
        }
    }, [hasMore, isLoadingMore, name, referenceTable]);

    return (
        <BaseField {...baseFieldProps}>
            <div className="reference-field">
                <Combobox
                    options={referenceOptions}
                    value={currentValue}
                    onValueChange={handleValueChange}
                    onSearchChange={setSearchTerm}
                    onClear={handleClear}
                    placeholder={config.exampleText || 'Select reference...'}
                    searchPlaceholder="Search..."
                    emptyMessage={isLoading ? 'Loading...' : 'No items found.'}
                    className={error ? 'border-destructive' : ''}
                    disabled={fieldState?.readonly || isLoading}
                    container={shadowRoot}
                    hasMore={hasMore}
                    isLoadingMore={isLoadingMore}
                    onLoadMore={handleLoadMore}
                />
                {/* Show sys_id for debugging/verification */}
                {currentValue && (
                    <div className="text-xs text-muted-foreground mt-1">
                        ID: {currentValue}
                    </div>
                )}
            </div>
        </BaseField>
    );
}