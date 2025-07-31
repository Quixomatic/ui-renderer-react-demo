import React, { useState } from 'react';
import { BaseField } from './BaseField.jsx';
import { Button } from '../../../../../components/ui/button.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../../components/ui/table.jsx';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { cn } from '../../../../../../components/lib/utils.js';

/**
 * Field type mapping for MRVS numeric types to string types
 * Based on ServiceNow's internal field type mappings
 */
const MRVS_FIELD_TYPE_MAP = {
    '1': 'boolean',
    '2': 'break',           // HTML break
    '3': 'multiple_choice', // Radio buttons
    '4': 'numeric_scale',   // Slider
    '5': 'choice',          // Select dropdown
    '6': 'string',          // Single line text
    '7': 'text',            // Multi-line text  
    '8': 'reference',       // Reference field
    '9': 'glide_date',      // Date field
    '10': 'glide_date_time', // DateTime field
    '11': 'html',           // HTML field
    '12': 'url',            // URL field
    '13': 'email',          // Email field
    '14': 'ip_address',     // IP Address field
    '15': 'masked',         // Masked field
    '16': 'glide_duration', // Duration field
    '17': 'attachment',     // Attachment field
    '18': 'glide_list',     // List collector
    '19': 'label',          // Display label
    '20': 'rich_text_label' // Rich text label
};

/**
 * Get the string field type from numeric type
 */
function getFieldType(numericType) {
    return MRVS_FIELD_TYPE_MAP[String(numericType)] || 'string';
}

/**
 * Multi-Row Variable Set Field Component
 * 
 * Displays existing MRVS rows in a table format and provides
 * Add/Edit/Delete functionality via modal dialogs.
 */
export function MultiRowVariableSetField({ 
    baseFieldProps,
    onValueChange,
    mrvsInfo
}) {
    // Extract needed values from baseFieldProps
    const { name, config, value, fieldState, error, shadowRoot } = baseFieldProps;
    
    const [showModal, setShowModal] = useState(false);
    const [editingRow, setEditingRow] = useState(null);
    const [editingIndex, setEditingIndex] = useState(null);
    const [modalAction, setModalAction] = useState('add');

    // Extract MRVS data from config
    const mrvsFields = config.fields || [];
    const maxRows = parseInt(config.maxRows) || 50;
    const canWrite = config.canWrite !== false;
    const canCreate = config.canCreate !== false;
    
    // Check field state for readonly/disabled
    const isReadonly = fieldState?.readonly || false;
    const isDisabled = fieldState?.disabled || false;
    
    // Get current row data
    const currentRows = Array.isArray(value?.value) ? value.value : [];
    const displayRows = Array.isArray(value?.displayValue) ? value.displayValue : [];
    
    // Create table headers from MRVS field definitions
    const tableHeaders = mrvsFields.map(mrvsField => ({
        name: mrvsField.name,
        label: mrvsField.label || mrvsField.name,
        type: getFieldType(mrvsField.type)
    }));

    const handleAddRow = () => {
        if (!canCreate || currentRows.length >= maxRows) return;
        
        setModalAction('add');
        setEditingRow({});
        setEditingIndex(null);
        setShowModal(true);
    };

    const handleEditRow = (index) => {
        if (!canWrite) return;
        
        setModalAction('edit');
        setEditingRow(currentRows[index] || {});
        setEditingIndex(index);
        setShowModal(true);
    };

    const handleDeleteRow = (index) => {
        if (!canWrite || !confirm('Are you sure you want to delete this row?')) return;
        
        const newRows = currentRows.filter((_, i) => i !== index);
        const newDisplayRows = displayRows.filter((_, i) => i !== index);
        
        onValueChange(name, {
            value: newRows,
            displayValue: newDisplayRows
        });
    };

    const handleModalSave = ({ rowData, displayData, rowIndex }) => {
        let newRows, newDisplayRows;
        
        if (rowIndex !== null && rowIndex !== undefined) {
            // Edit existing row
            newRows = [...currentRows];
            newDisplayRows = [...displayRows];
            newRows[rowIndex] = rowData;
            newDisplayRows[rowIndex] = displayData;
        } else {
            // Add new row
            newRows = [...currentRows, rowData];
            newDisplayRows = [...displayRows, displayData];
        }
        
        onValueChange(name, {
            value: newRows,
            displayValue: newDisplayRows
        });
        
        setShowModal(false);
        setEditingRow(null);
        setEditingIndex(null);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setEditingRow(null);
        setEditingIndex(null);
    };

    const canAddRows = canCreate && currentRows.length < maxRows && !isReadonly && !isDisabled;
    const canEditRows = canWrite && !isReadonly && !isDisabled;

    return (
        <BaseField {...baseFieldProps}>
            <div className="space-y-4">
                {/* Row count and add button */}
                <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                        {currentRows.length} of {maxRows} rows
                    </div>
                    
                    {canAddRows && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddRow}
                            className="flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Add Row
                        </Button>
                    )}
                </div>

                {/* Table display */}
                {currentRows.length > 0 ? (
                    <div className="border border-border rounded-md shadow-sm bg-background">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {tableHeaders.map((header) => (
                                        <TableHead key={header.name} className="text-left">
                                            {header.label}
                                        </TableHead>
                                    ))}
                                    {canEditRows && (
                                        <TableHead className="w-24">Actions</TableHead>
                                    )}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {displayRows.map((row, index) => (
                                    <TableRow key={index}>
                                        {tableHeaders.map((header) => (
                                            <TableCell key={header.name}>
                                                <div className="truncate max-w-[200px]" title={row[header.name] || ''}>
                                                    {row[header.name] || '—'}
                                                </div>
                                            </TableCell>
                                        ))}
                                        {canEditRows && (
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEditRow(index)}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteRow(index)}
                                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="border border-dashed rounded-md p-8 text-center text-muted-foreground">
                        {canAddRows ? 'No rows added yet. Click "Add Row" to get started.' : 'No rows to display.'}
                    </div>
                )}

                {/* MRVS Modal */}
                {showModal && (
                    <x-312987-tf-mrvs-modal
                        active={true}
                        variable-set-id={config.id}
                        variable-set-name={config.label || name}
                        source-table={config.sourceTable || 'sc_cart_item'}
                        source-id={config.sourceId || ''}
                        row-data={editingRow}
                        row-index={editingIndex}
                        action={modalAction}
                        parent-fields={config.parentFields || {}}
                        onSave={handleModalSave}
                        onClose={handleModalClose}
                    />
                )}
            </div>
        </BaseField>
    );
}