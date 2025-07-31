/**
 * Layout Normalizer - Fix ServiceNow's Weird Layout Patterns
 * 
 * ServiceNow has bizarre patterns like checkbox_container and multi_row_container references 
 * that point to other containers. This utility normalizes the layout structure to be simpler 
 * and more predictable.
 */

/**
 * Detect if a checkbox_container represents a mandatory checkbox group based on layout data
 * @param {Object} containerItem - The checkbox_container layout item
 * @returns {Object|null} - Checkbox group info if detected, null otherwise
 */
function detectCheckboxGroupFromLayout(containerItem) {
    debug.log('layout', `Checking if ${containerItem.name} is checkbox group from layout`);
    
    // Must have a caption (indicates it's a grouped container, not just a single checkbox wrapper)
    if (!containerItem.caption && !containerItem.captionDisplay) {
        debug.log('layout', `${containerItem.name} - no caption, likely single checkbox container`);
        return null;
    }
    
    // Must have columns with fields (checkbox group pattern)
    if (!containerItem.columns || !Array.isArray(containerItem.columns)) {
        debug.log('layout', `${containerItem.name} - no columns`);
        return null;
    }
    
    // Extract all child field names from columns
    const childFieldNames = [];
    containerItem.columns.forEach(column => {
        if (column.fields && Array.isArray(column.fields)) {
            column.fields.forEach(field => {
                if (field.type === 'field') {
                    childFieldNames.push(field.name);
                }
            });
        }
    });
    
    // Must have at least one child field
    if (childFieldNames.length === 0) {
        debug.log('layout', `${containerItem.name} - no child fields`);
        return null;
    }
    
    // If it has a caption and child fields, it's a checkbox group (regardless of mandatory status)
    debug.log('layout', `✓ Detected checkbox group from layout: ${containerItem.name} with ${childFieldNames.length} fields`);
    
    return {
        type: 'checkbox_group',
        name: containerItem.name,
        label: containerItem.captionDisplay || containerItem.caption || containerItem.name,
        childFieldNames: childFieldNames
    };
}

/**
 * Normalize the variables layout by flattening checkbox_container and multi_row_container references
 * and detecting special field patterns
 * @param {Array} variablesLayout - The original ServiceNow layout array
 * @param {Object} fields - The fields configuration object
 * @returns {Array} - Normalized layout array
 */
export function normalizeVariablesLayout(variablesLayout) {
    if (!Array.isArray(variablesLayout)) {
        return variablesLayout;
    }

    // Create maps for container lookups
    const checkboxContainers = {};
    const multiRowContainers = {};
    const detectedCheckboxGroups = new Set();
    const detectedMultiRowContainers = new Set();
    
    variablesLayout.forEach(item => {
        if (item.type === 'checkbox_container') {
            checkboxContainers[item.name] = item;
            
            // Check if this is a checkbox group pattern based on layout data
            const checkboxGroupInfo = detectCheckboxGroupFromLayout(item);
            if (checkboxGroupInfo) {
                detectedCheckboxGroups.add(item.name);
                debug.log('layout', `Detected checkbox group: ${item.name}`);
                // Store the checkbox group info for later use
                item.checkboxGroupInfo = checkboxGroupInfo;
            }
        } else if (item.type === 'multi_row_container') {
            multiRowContainers[item.name] = item;
            detectedMultiRowContainers.add(item.name);
            debug.log('layout', `Detected MRVS container: ${item.name}`);
        }
    });

    // Create a set of child field names that belong to checkbox groups (to filter them out)
    const checkboxGroupChildFields = new Set();
    detectedCheckboxGroups.forEach(groupName => {
        const containerItem = checkboxContainers[groupName];
        if (containerItem && containerItem.checkboxGroupInfo) {
            containerItem.checkboxGroupInfo.childFieldNames.forEach(childName => {
                checkboxGroupChildFields.add(childName);
            });
        }
    });

    // Process each layout item
    const normalizedLayout = [];
    
    variablesLayout.forEach(item => {
        if (item.type === 'checkbox_container') {
            // For checkbox groups, we already converted the reference in containers above
            // The standalone definition should be completely removed
            if (detectedCheckboxGroups.has(item.name)) {
                debug.log('layout', `Removing standalone checkbox_container definition: ${item.name}`);
                return; // Skip - already handled in container references
            }
            
            // Skip other standalone checkbox containers - they'll be inlined where referenced
            return;
        } else if (item.type === 'multi_row_container') {
            // Convert multi_row_container to a regular field with MRVS metadata
            debug.log('layout', `Converting multi_row_container to field: ${item.name}`);
            normalizedLayout.push({
                name: item.name,
                type: 'field',
                mrvsInfo: {
                    type: 'multi_row_variable_set',
                    layout: item.layout || 'across',
                    caption: item.caption,
                    captionDisplay: item.captionDisplay
                }
            });
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
                            // Check if this is a checkbox group reference
                            if (detectedCheckboxGroups.has(field.name)) {
                                // Convert checkbox_container reference to regular field with checkbox group info
                                const containerItem = checkboxContainers[field.name];
                                normalizedFields.push({
                                    name: field.name,
                                    type: 'field',
                                    checkboxGroupInfo: containerItem.checkboxGroupInfo
                                });
                                return;
                            }
                            
                            // Regular single checkbox container - inline its fields
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
                        } else if (field.type === 'multi_row_container') {
                            // Convert multi_row_container reference to regular field with MRVS metadata
                            const containerItem = multiRowContainers[field.name];
                            if (containerItem) {
                                normalizedFields.push({
                                    name: field.name,
                                    type: 'field',
                                    mrvsInfo: {
                                        type: 'multi_row_variable_set',
                                        layout: containerItem.layout || 'across',
                                        caption: containerItem.caption,
                                        captionDisplay: containerItem.captionDisplay
                                    }
                                });
                            } else {
                                debug.warn('layout', `Referenced multi_row_container not found: ${field.name}`);
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
        } else if (item.type === 'field') {
            // Filter out individual checkbox fields that are part of a checkbox group
            if (checkboxGroupChildFields.has(item.name)) {
                debug.log('layout', `Filtering out checkbox group child field: ${item.name}`);
                return; // Skip this field - it's handled by the checkbox group
            }
            
            // Other field types - keep as is
            normalizedLayout.push(item);
        } else {
            // Other item types - keep as is
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