import React, { useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { BaseField } from './BaseField.jsx';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../../../../components/ui/table.jsx';

/**
 * ExistingValueTableListField - Auto-query reference results in table format
 * 
 * Handles reference:existing_value_table_list subtype fields.
 * Reuses ReferenceField infrastructure but displays results as a table using tableFields.
 * No user interaction - just displays the query results in tabular format.
 */
export function ExistingValueTableListField({ 
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
    const tableFields = config.tableFields || [];
    const limit = config.parsedAttributes?.limit || 10;
    
    // Create cache key for this field (same pattern as ReferenceField)
    const cacheKey = `${name}__${referenceTable}`;
    
    // Get data from existing reference infrastructure
    // Since we're using storeAsRaw, this will be raw records, not processed options
    const records = referenceData?.[cacheKey] || [];
    const isLoading = referenceLoading?.[cacheKey] || false;
    
    // Trigger initial search on mount with storeAsRaw metadata
    useEffect(() => {
        if (onReferenceSearch) {
            onReferenceSearch(name, referenceTable, '', qualifier, { storeAsRaw: true });
        }
    }, [name, referenceTable, qualifier, onReferenceSearch]);
    
    // Limit records to the configured limit
    const limitedRecords = useMemo(() => {
        return records.slice(0, limit);
    }, [records, limit]);
    
    return (
        <BaseField {...baseFieldProps}>
            <div className="text-sm py-1.5">
                {isLoading ? (
                    <div className="flex items-center text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Loading records...
                    </div>
                ) : limitedRecords.length === 0 ? (
                    <span className="text-muted-foreground italic">No records found</span>
                ) : tableFields.length === 0 ? (
                    <span className="text-muted-foreground italic">No table fields configured</span>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {tableFields.map((fieldObj) => (
                                    <TableHead key={fieldObj.element.value}>
                                        {fieldObj.column_label.value}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {limitedRecords.map((record, index) => (
                                <TableRow key={record.sys_id?.value || record.sys_id || index}>
                                    {tableFields.map((fieldObj) => {
                                        const fieldName = fieldObj.element.value;
                                        const fieldValue = record[fieldName];
                                        // Handle both ServiceNow field objects and plain values
                                        const displayValue = fieldValue?.display_value || fieldValue || '';
                                        
                                        return (
                                            <TableCell key={fieldName}>
                                                {displayValue}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>
        </BaseField>
    );
}