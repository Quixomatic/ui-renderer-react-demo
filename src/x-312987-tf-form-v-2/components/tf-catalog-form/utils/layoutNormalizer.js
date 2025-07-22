/**
 * Layout Normalizer - Fix ServiceNow's Weird Layout Patterns
 * 
 * ServiceNow has bizarre patterns like checkbox_container references that point to other containers.
 * This utility normalizes the layout structure to be simpler and more predictable.
 */

/**
 * Normalize the variables layout by flattening checkbox_container references
 * @param {Array} variablesLayout - The original ServiceNow layout array
 * @param {Object} fields - The fields configuration object
 * @returns {Array} - Normalized layout array
 */
export function normalizeVariablesLayout(variablesLayout, fields) {
    if (!Array.isArray(variablesLayout) || !fields) {
        return variablesLayout;
    }

    // Create a map of checkbox containers for quick lookup
    const checkboxContainers = {};
    variablesLayout.forEach(item => {
        if (item.type === 'checkbox_container') {
            checkboxContainers[item.name] = item;
        }
    });

    // Process each layout item
    const normalizedLayout = [];
    
    variablesLayout.forEach(item => {
        if (item.type === 'checkbox_container') {
            // Skip standalone checkbox containers - they'll be inlined
            return;
        } else if (item.type === 'container') {
            // Process container columns to inline checkbox_container references
            const normalizedItem = { ...item };
            
            if (item.columns && Array.isArray(item.columns)) {
                normalizedItem.columns = item.columns.map(column => {
                    if (!column.fields || !Array.isArray(column.fields)) {
                        return column;
                    }

                    const normalizedFields = [];
                    
                    column.fields.forEach(field => {
                        if (field.type === 'checkbox_container') {
                            // Found a checkbox_container reference - inline its fields
                            const referencedContainer = checkboxContainers[field.name];
                            if (referencedContainer && referencedContainer.columns) {
                                // Extract all fields from the referenced container's columns
                                referencedContainer.columns.forEach(refColumn => {
                                    if (refColumn.fields && Array.isArray(refColumn.fields)) {
                                        normalizedFields.push(...refColumn.fields);
                                    }
                                });
                            } else {
                                debug.warn('layout', `Referenced checkbox container not found: ${field.name}`);
                            }
                        } else {
                            // Regular field - keep as is
                            normalizedFields.push(field);
                        }
                    });

                    return {
                        ...column,
                        fields: normalizedFields
                    };
                });
            }
            
            normalizedLayout.push(normalizedItem);
        } else {
            // Other item types (field, etc.) - keep as is
            normalizedLayout.push(item);
        }
    });

    return normalizedLayout;
}

/**
 * Log the layout transformation for debugging
 */
import debug from '../../../lib/debug.js';

export function debugLayoutTransformation(original, normalized) {
    debug.group('layout', 'Layout Normalization', () => {
        debug.log('layout', 'Original layout:', original);
        debug.log('layout', 'Normalized layout:', normalized);
    });
}