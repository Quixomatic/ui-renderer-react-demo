import React, { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { BaseField } from './BaseField.jsx';
import { Button } from '../../../../../components/ui/button.jsx';
import { Input } from '../../../../../components/ui/input.jsx';
import { Checkbox } from '../../../../../components/ui/checkbox.jsx';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../../../../components/ui/table.jsx';

/**
 * TableListField - Multi-select reference field with table display
 * 
 * Handles reference:table_list subtype fields.
 * Shows reference data in table format with checkboxes for multi-selection.
 * Supports search and pagination via parsedAttributes configuration.
 */
export function TableListField({ 
    baseFieldProps,
    referenceData,
    referenceLoading,
    referencePagination,
    onReferenceSearch,
    onReferenceLoadMore,
    onValueChange
}) {
    const { name, config, value, fieldState } = baseFieldProps;
    
    // Extract configuration
    const referenceTable = config.reference || 'incident';
    const qualifier = config.qualifier || '';
    const tableFields = config.tableFields || [];
    const limit = config.parsedAttributes?.limit || 20;
    const enableSearch = config.parsedAttributes?.enableSearch === 'true';
    const enablePagination = config.parsedAttributes?.enablePagination === 'true';
    
    // Field state
    const isReadOnly = fieldState?.readonly || config.readOnly;
    const isDisabled = fieldState?.disabled;
    
    // Component state
    const [searchTerm, setSearchTerm] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    
    // Create cache key for this field
    const cacheKey = `${name}__${referenceTable}`;
    
    // Get data from reference infrastructure
    const records = referenceData?.[cacheKey] || [];
    const isLoading = referenceLoading?.[cacheKey] || false;
    const pagination = referencePagination?.[cacheKey] || {};
    
    // Parse current selected values
    const selectedValues = useMemo(() => {
        if (!value) return [];
        
        if (typeof value === 'string') {
            return value.split(',').filter(v => v.trim());
        }
        
        if (typeof value === 'object' && value.value) {
            const vals = typeof value.value === 'string' ? value.value.split(',') : [];
            return vals.filter(v => v.trim());
        }
        
        return [];
    }, [value]);
    
    // Find selected record details for pill display
    const selectedRecords = useMemo(() => {
        return selectedValues.map(selectedId => {
            // Find the record in current data
            const record = records.find(r => 
                (r.sys_id?.value || r.sys_id) === selectedId
            );
            
            if (record) {
                // Build display label from tableFields
                if (tableFields.length > 0) {
                    const primaryField = tableFields[0].element.value;
                    const displayValue = record[primaryField]?.display_value || record[primaryField] || selectedId;
                    return {
                        value: selectedId,
                        label: displayValue
                    };
                }
            }
            
            // Fallback if record not found in current data
            return {
                value: selectedId,
                label: selectedId
            };
        }).filter(Boolean);
    }, [selectedValues, records, tableFields]);
    
    // Initial search on mount
    useEffect(() => {
        if (onReferenceSearch) {
            onReferenceSearch(name, referenceTable, '', qualifier, { storeAsRaw: true });
        }
    }, [name, referenceTable, qualifier, onReferenceSearch]);
    
    // Handle search
    const handleSearch = (term) => {
        setSearchTerm(term);
        if (onReferenceSearch) {
            onReferenceSearch(name, referenceTable, term, qualifier, { storeAsRaw: true });
        }
    };
    
    // Handle checkbox selection
    const handleRowSelect = (record, checked) => {
        const recordId = record.sys_id?.value || record.sys_id;
        let newSelectedValues;
        
        if (checked) {
            // Add to selection
            newSelectedValues = [...selectedValues, recordId];
        } else {
            // Remove from selection
            newSelectedValues = selectedValues.filter(id => id !== recordId);
        }
        
        // Update field value
        const newValue = newSelectedValues.join(',');
        const newDisplayValue = newSelectedValues.length > 0 ? 
            `${newSelectedValues.length} selected` : '';
            
        onValueChange(name, {
            value: newValue,
            displayValue: newDisplayValue
        });
    };
    
    // Handle pill removal
    const handleRemoveSelection = (valueToRemove) => {
        const newSelectedValues = selectedValues.filter(id => id !== valueToRemove);
        const newValue = newSelectedValues.join(',');
        const newDisplayValue = newSelectedValues.length > 0 ? 
            `${newSelectedValues.length} selected` : '';
            
        onValueChange(name, {
            value: newValue,
            displayValue: newDisplayValue
        });
    };
    
    // Handle load more
    const handleLoadMore = () => {
        if (onReferenceLoadMore && enablePagination) {
            onReferenceLoadMore(name, referenceTable);
        }
    };
    
    // Limit records if pagination is disabled
    const displayRecords = useMemo(() => {
        return enablePagination ? records : records.slice(0, limit);
    }, [records, enablePagination, limit]);
    
    if (isReadOnly || isDisabled) {
        return (
            <BaseField {...baseFieldProps}>
                <div className="text-sm text-foreground py-1.5">
                    {selectedRecords.length === 0 ? (
                        <span className="text-muted-foreground italic">No selections</span>
                    ) : (
                        <div className="flex flex-wrap gap-1">
                            {selectedRecords.map((record) => (
                                <span
                                    key={record.value}
                                    className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-secondary text-secondary-foreground"
                                >
                                    {record.label}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </BaseField>
        );
    }
    
    return (
        <BaseField {...baseFieldProps}>
            <div className="space-y-3">
                {/* Selected items pills */}
                {selectedRecords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {selectedRecords.map((record) => (
                            <span
                                key={record.value}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-primary/10 text-primary border"
                            >
                                {record.label}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveSelection(record.value)}
                                    className="ml-1 hover:bg-primary/20 rounded-sm p-0.5"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}
                
                {/* Search toggle and input */}
                {enableSearch && (
                    <div className="space-y-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowSearch(!showSearch)}
                            className="w-full justify-between"
                        >
                            <div className="flex items-center gap-2">
                                <Search className="h-4 w-4" />
                                Search records
                            </div>
                            {showSearch ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                        
                        {showSearch && (
                            <Input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full"
                            />
                        )}
                    </div>
                )}
                
                {/* Table */}
                <div className="border rounded-md bg-background border-border shadow-sm">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-4 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Loading records...
                        </div>
                    ) : displayRecords.length === 0 ? (
                        <div className="p-4 text-muted-foreground text-center">
                            No records found
                        </div>
                    ) : tableFields.length === 0 ? (
                        <div className="p-4 text-muted-foreground text-center">
                            No table fields configured
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">
                                        {/* Checkbox column header */}
                                    </TableHead>
                                    {tableFields.map((fieldObj) => (
                                        <TableHead key={fieldObj.element.value} className="text-left">
                                            {fieldObj.column_label.value}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {displayRecords.map((record, index) => {
                                    const recordId = record.sys_id?.value || record.sys_id;
                                    const isSelected = selectedValues.includes(recordId);
                                    
                                    return (
                                        <TableRow 
                                            key={recordId || index}
                                            className={isSelected ? 'bg-primary/5 border-primary/20' : ''}
                                        >
                                            <TableCell>
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={(checked) => handleRowSelect(record, checked)}
                                                />
                                            </TableCell>
                                            {tableFields.map((fieldObj) => {
                                                const fieldName = fieldObj.element.value;
                                                const fieldValue = record[fieldName];
                                                const displayValue = fieldValue?.display_value || fieldValue || '';
                                                
                                                return (
                                                    <TableCell key={fieldName}>
                                                        {displayValue}
                                                    </TableCell>
                                                );
                                            })}
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                    
                    {/* Load more button */}
                    {enablePagination && pagination.hasMore && !isLoading && (
                        <div className="p-3 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleLoadMore}
                                className="w-full"
                            >
                                Load More ({pagination.totalLoaded || displayRecords.length} loaded)
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </BaseField>
    );
}