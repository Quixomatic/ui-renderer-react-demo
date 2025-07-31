import React, { useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { BaseField } from './BaseField.jsx';

/**
 * ExistingValueRecordListField - Auto-query reference results display
 * 
 * Handles reference:existing_value_record_list subtype fields.
 * Reuses ReferenceField infrastructure but displays results as read-only list.
 * No user interaction - just displays the query results.
 */
export function ExistingValueRecordListField({ 
    baseFieldProps,
    referenceData,
    referenceLoading,
    onReferenceSearch
}) {
    // Extract needed values from baseFieldProps
    const { name, config } = baseFieldProps;
    
    // Extract configuration
    const referenceTable = config.reference || 'incident';
    const qualifier = config.qualifier || '';
    const limit = config.parsedAttributes?.limit || 10;
    
    // Create cache key for this field (same pattern as ReferenceField)
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
    
    // Limit options to the configured limit
    const limitedOptions = useMemo(() => {
        return options.slice(0, limit);
    }, [options, limit]);
    
    return (
        <BaseField {...baseFieldProps}>
            <div className="text-sm text-foreground py-1.5">
                {isLoading ? (
                    <div className="flex items-center text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Loading records...
                    </div>
                ) : limitedOptions.length === 0 ? (
                    <span className="text-muted-foreground italic">No records found</span>
                ) : (
                    <ul className="list-disc list-inside space-y-1">
                        {limitedOptions.map((option, index) => (
                            <li key={option.value || index}>
                                {option.label}
                                {option.secondaryInfo && (
                                    <span className="text-muted-foreground ml-2">
                                        ({option.secondaryInfo})
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </BaseField>
    );
}