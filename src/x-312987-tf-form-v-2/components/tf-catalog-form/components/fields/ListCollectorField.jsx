import React, { useState, useEffect, useRef } from 'react';
import { Input } from '../../../../../components/ui/input.jsx';
import { Button } from '../../../../../components/ui/button.jsx';
import { Badge } from '../../../../../components/ui/badge.jsx';
import { BaseField } from './BaseField.jsx';
import { Search, X, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '../../../../../../components/lib/utils.js';

/**
 * ListCollectorField - Multi-select reference field
 * 
 * Handles glide_list type fields that allow selecting multiple records.
 * Similar to ReferenceField but supports multiple selections displayed as removable pills.
 */
export function ListCollectorField({ 
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
    const [isOpen, setIsOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const dropdownRef = useRef(null);
    
    // Parse the current values - glide_list stores comma-separated sys_ids
    const parseValues = () => {
        if (!value) return [];
        
        const currentValue = typeof value === 'object' ? (value?.value || '') : (value || '');
        const displayValue = typeof value === 'object' ? (value?.displayValue || '') : '';
        
        if (!currentValue) return [];
        
        const valueArray = currentValue.split(',').filter(v => v);
        const displayArray = displayValue.split(',').filter(v => v);
        
        return valueArray.map((val, idx) => ({
            value: val,
            displayValue: displayArray[idx] || val
        }));
    };
    
    const selectedItems = parseValues();
    const selectedValues = selectedItems.map(item => item.value);
    
    // Get reference configuration
    const referenceTable = config.reference || config.lookupTable || 'sys_user';
    const displayField = config.displayField || 'name';
    const qualifier = config.referenceQual || config.qualifier;
    
    // Get cache key for this field's data (match ReferenceField format)
    const cacheKey = `${name}__${referenceTable}`;
    
    // Get reference options from cache (with safe fallbacks) - match ReferenceField
    const searchResults = (referenceData && referenceData[cacheKey]) || [];
    const isLoading = (referenceLoading && referenceLoading[cacheKey]) || false;
    const isLoadingMore = (referenceLoading && referenceLoading[`${cacheKey}_loadmore`]) || false;
    
    // Get pagination info
    const paginationInfo = (referencePagination && referencePagination[cacheKey]) || {};
    const hasMore = paginationInfo.hasMore || false;
    
    // Trigger initial load of reference data
    useEffect(() => {
        if (onReferenceSearch && !searchResults.length && !isLoading) {
            onReferenceSearch(name, referenceTable, '', qualifier);
        }
    }, [name, referenceTable, qualifier]); // Removed onReferenceSearch dependency
    
    // Handle search term changes with debouncing (match ReferenceField)
    useEffect(() => {
        if (onReferenceSearch) {
            // Debounce the search
            const timeoutId = setTimeout(() => {
                onReferenceSearch(name, referenceTable, searchValue, qualifier);
            }, 300);
            
            return () => clearTimeout(timeoutId);
        }
    }, [searchValue, name, referenceTable, qualifier]); // Removed onReferenceSearch dependency
    
    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            const target = shadowRoot ? event.composedPath()[0] : event.target;
            if (dropdownRef.current && !dropdownRef.current.contains(target)) {
                setIsOpen(false);
            }
        };
        
        const root = shadowRoot || document;
        root.addEventListener('mousedown', handleClickOutside);
        return () => root.removeEventListener('mousedown', handleClickOutside);
    }, [shadowRoot]);
    
    // Handle search input
    const handleSearch = (value) => {
        setSearchValue(value);
        if (!isOpen) {
            setIsOpen(true);
        }
    };
    
    // Handle item selection
    const handleSelect = (item) => {
        // Check if already selected
        if (selectedValues.includes(item.value)) {
            return;
        }
        
        // Add to selected items
        const newItems = [...selectedItems, {
            value: item.value,
            displayValue: item.label || item[displayField] || item.displayValue || item.value
        }];
        
        // Update value
        const newValue = newItems.map(i => i.value).join(',');
        const newDisplayValue = newItems.map(i => i.displayValue).join(',');
        
        onValueChange(name, {
            value: newValue,
            displayValue: newDisplayValue
        });
        
        // Clear search
        setSearchValue('');
        setIsOpen(false);
    };
    
    // Handle item removal
    const handleRemove = (itemToRemove) => {
        const newItems = selectedItems.filter(item => item.value !== itemToRemove.value);
        
        const newValue = newItems.map(i => i.value).join(',');
        const newDisplayValue = newItems.map(i => i.displayValue).join(',');
        
        onValueChange(name, {
            value: newValue,
            displayValue: newDisplayValue
        });
    };
    
    // Handle clear all
    const handleClearAll = () => {
        onValueChange(name, {
            value: '',
            displayValue: ''
        });
    };
    
    // Filter out already selected items from search results
    const availableResults = searchResults.filter(
        item => !selectedValues.includes(item.value)
    );
    
    const isReadOnly = fieldState?.readonly || config.readOnly;
    const isDisabled = fieldState?.disabled;
    const isMandatory = fieldState?.mandatory || config.mandatory;

    return (
        <BaseField {...baseFieldProps}>
            <div ref={dropdownRef} className="relative">
                {/* Selected items pills */}
                {selectedItems.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                        {selectedItems.map((item) => (
                            <Badge 
                                key={item.value} 
                                variant="secondary"
                                className="pr-1 pl-2 py-1"
                            >
                                <span className="text-xs">{item.displayValue}</span>
                                {!isReadOnly && !isDisabled && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-auto p-0 ml-1 hover:bg-transparent"
                                        onClick={() => handleRemove(item)}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                )}
                            </Badge>
                        ))}
                        {selectedItems.length > 1 && !isReadOnly && !isDisabled && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-auto px-2 py-1 text-xs"
                                onClick={handleClearAll}
                            >
                                Clear all
                            </Button>
                        )}
                    </div>
                )}
                
                {/* Search input */}
                <div className="relative">
                    <Input
                        type="text"
                        value={searchValue}
                        onChange={(e) => handleSearch(e.target.value)}
                        onFocus={() => setIsOpen(true)}
                        placeholder={config.exampleText || `Search ${referenceTable}...`}
                        className={cn(
                            "pr-20",
                            error && "border-destructive"
                        )}
                        readOnly={isReadOnly}
                        disabled={isDisabled}
                    />
                    <div className="absolute right-0 top-0 h-full flex items-center gap-1 pr-1">
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                            <Search className="h-4 w-4 text-muted-foreground" />
                        )}
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => setIsOpen(!isOpen)}
                            disabled={isReadOnly || isDisabled}
                        >
                            <ChevronDown className={cn(
                                "h-4 w-4 transition-transform",
                                isOpen && "rotate-180"
                            )} />
                        </Button>
                    </div>
                </div>
                
                {/* Dropdown */}
                {isOpen && !isReadOnly && !isDisabled && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                        {availableResults.length > 0 ? (
                            <>
                                {availableResults.map((item) => (
                                    <div
                                        key={item.value}
                                        className="px-3 py-2 hover:bg-accent cursor-pointer"
                                        onClick={() => handleSelect(item)}
                                    >
                                        <div className="text-sm font-normal">
                                            {item.label || item[displayField] || item.displayValue || item.value}
                                        </div>
                                        {item.additionalInfo && (
                                            <div className="text-xs text-muted-foreground">
                                                {item.additionalInfo}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {hasMore && (
                                    <div className="px-3 py-2 border-t">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="w-full"
                                            onClick={() => onReferenceLoadMore?.(name, referenceTable)}
                                        >
                                            Load more...
                                        </Button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="px-3 py-2 text-sm text-muted-foreground">
                                {searchValue ? 'No results found' : 'Type to search...'}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </BaseField>
    );
}