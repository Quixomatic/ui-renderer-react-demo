/**
 * Field utility functions for TurboForge Form v2
 * 
 * Handles field name transformations, comprehensive field object creation,
 * and other field-related utilities.
 */

/**
 * Ensures field name has the 'variables.' prefix
 * @param {string} fieldName - The field name to transform
 * @returns {string} Field name with 'variables.' prefix
 */
export function getMappedFieldName(fieldName) {
    if (!fieldName) return fieldName;
    if (fieldName.indexOf('variables.') !== 0) {
        return `variables.${fieldName}`;
    }
    return fieldName;
}

/**
 * Gets the variable name without the 'variables.' prefix
 * @param {string} fieldName - The field name with or without prefix
 * @returns {string} Variable name without prefix
 */
export function getVariableName(fieldName) {
    if (!fieldName) return fieldName;
    return fieldName.replace('variables.', '');
}

/**
 * Creates comprehensive field objects from raw field data
 * @param {Object} fields - Raw field definitions from properties
 * @param {Array} variablesLayout - Layout configuration
 * @param {string} sourceTable - Source table name
 * @param {string} sourceId - Source record sys_id
 * @returns {Object} Comprehensive field objects keyed by field name
 */
export function createComprehensiveFields(fields, variablesLayout, sourceTable, sourceId) {
    const comprehensiveFields = {};
    
    // Process each field
    Object.entries(fields).forEach(([fieldName, fieldConfig]) => {
        const mappedName = getMappedFieldName(fieldName);
        const variableName = getVariableName(mappedName);
        
        // Create comprehensive field object
        comprehensiveFields[mappedName] = {
            // Original properties
            ...fieldConfig,
            
            // Ensure consistent naming
            name: mappedName,
            variable_name: variableName,
            
            // Value properties (handle existing value/displayValue)
            value: fieldConfig.value || '',
            displayValue: fieldConfig.displayValue || fieldConfig.value || '',
            oldValue: fieldConfig.value || '',
            
            // State properties (can be modified by g_form)
            visible: fieldConfig.visible !== false,
            readonly: fieldConfig.readOnly || fieldConfig.readonly || false,
            mandatory: fieldConfig.mandatory || false,
            disabled: fieldConfig.disabled || false,
            
            // Metadata
            _cat_variable: true,
            referringTable: sourceTable,
            referringRecordId: sourceId,
            parent: fieldConfig.parent || '',
            
            // Help properties
            helpText: fieldConfig.helpText || fieldConfig.help_text || '',
            instructions: fieldConfig.instructions || '',
            showHelp: !!(fieldConfig.instructions || fieldConfig.helpText || fieldConfig.help_text),
            
            // Type-specific augmentation
            ...augmentFieldByType(fieldConfig)
        };
    });
    
    // Add container definitions from layout if needed
    addContainersFromLayout(comprehensiveFields, variablesLayout);
    
    return comprehensiveFields;
}

/**
 * Augments field object with type-specific properties
 * @param {Object} fieldConfig - Raw field configuration
 * @returns {Object} Type-specific properties to add
 */
function augmentFieldByType(fieldConfig) {
    const augmentations = {};
    
    switch (fieldConfig.type) {
        case 'choice':
        case 'multiple_choice':
            // Ensure choices array exists
            if (!fieldConfig.choices) {
                augmentations.choices = [];
                
                // Convert from legacy format if available
                if (fieldConfig.valuesList && fieldConfig.display_value_list) {
                    augmentations.choices = fieldConfig.valuesList.map((value, index) => ({
                        value: value,
                        displayValue: fieldConfig.display_value_list[index] || value
                    }));
                }
            }
            break;
            
        case 'reference':
            augmentations.reference = fieldConfig.reference || fieldConfig.ed?.reference;
            augmentations.referenceQual = fieldConfig.referenceQual || fieldConfig.ed?.qualifier || '';
            break;
            
        case 'masked':
            augmentations.canDecrypt = fieldConfig.catalog_view_masked || false;
            augmentations.useConfirmation = fieldConfig.useConfirmation || false;
            augmentations.confirmationValue = fieldConfig.value || '';
            break;
            
        case 'boolean':
            // Ensure boolean values are strings ('true'/'false') for ServiceNow compatibility
            if (typeof augmentations.value === 'boolean') {
                augmentations.value = augmentations.value.toString();
            }
            break;
            
        case 'glide_list':
            augmentations.reference = fieldConfig.reference || fieldConfig.ed?.reference;
            augmentations.referenceQual = fieldConfig.referenceQual || fieldConfig.ed?.qualifier || '';
            break;
    }
    
    return augmentations;
}

/**
 * Adds container definitions from variablesLayout if not already in fields
 * @param {Object} fields - Comprehensive field objects
 * @param {Array} variablesLayout - Layout configuration
 */
function addContainersFromLayout(fields, variablesLayout) {
    if (!variablesLayout) return;
    
    variablesLayout.forEach(layoutItem => {
        if (layoutItem.type === 'container' && !fields[layoutItem.name]) {
            const mappedName = getMappedFieldName(layoutItem.name);
            fields[mappedName] = {
                name: mappedName,
                variable_name: getVariableName(mappedName),
                type: 'container',
                label: layoutItem.caption || '',
                caption: layoutItem.caption || '',
                layout: layoutItem.layout || 'normal',
                columns: layoutItem.columns || [],
                parent: layoutItem.parent || '',
                _cat_variable: true,
                visible: true,
                readonly: false,
                mandatory: false,
                disabled: false
            };
        }
    });
}

/**
 * Updates a field's value in the comprehensive field object
 * @param {Object} field - The comprehensive field object
 * @param {*} value - New value (can be string or {value, displayValue} object)
 * @returns {Object} Updated field object
 */
export function updateFieldValue(field, value) {
    const updatedField = { ...field };
    
    if (typeof value === 'object' && value !== null && 'value' in value) {
        updatedField.value = value.value;
        updatedField.displayValue = value.displayValue || value.value;
    } else {
        updatedField.value = value;
        updatedField.displayValue = value;
    }
    
    return updatedField;
}

/**
 * Updates a field's state property (visible, readonly, mandatory, etc.)
 * @param {Object} field - The comprehensive field object
 * @param {string} property - Property name to update
 * @param {*} value - New property value
 * @returns {Object} Updated field object
 */
export function updateFieldState(field, property, value) {
    return {
        ...field,
        [property]: value
    };
}

/**
 * Extracts form values from comprehensive field objects
 * @param {Object} fields - Comprehensive field objects
 * @returns {Object} Form values object with value/displayValue structure
 */
export function extractFormValues(fields) {
    const formValues = {};
    Object.entries(fields).forEach(([fieldName, field]) => {
        formValues[fieldName] = {
            value: field.value,
            displayValue: field.displayValue
        };
    });
    return formValues;
}

/**
 * Extracts field states from comprehensive field objects
 * @param {Object} fields - Comprehensive field objects
 * @returns {Object} Field states object with visibility, readonly, etc.
 */
export function extractFieldStates(fields) {
    const fieldStates = {};
    Object.entries(fields).forEach(([fieldName, field]) => {
        fieldStates[fieldName] = {
            visible: field.visible,
            readonly: field.readonly,
            mandatory: field.mandatory,
            disabled: field.disabled,
            label: field.label
        };
    });
    return fieldStates;
}

/**
 * Extracts validation errors from comprehensive field objects
 * @param {Object} fields - Comprehensive field objects
 * @returns {Object} Validation errors object
 */
export function extractValidationErrors(fields) {
    const validationErrors = {};
    Object.entries(fields).forEach(([fieldName, field]) => {
        if (field.validationError) {
            validationErrors[fieldName] = field.validationError;
        }
    });
    return validationErrors;
}

/**
 * Extracts field messages from comprehensive field objects
 * @param {Object} fields - Comprehensive field objects
 * @returns {Object} Field messages object
 */
export function extractFieldMessages(fields) {
    const fieldMessages = {};
    Object.entries(fields).forEach(([fieldName, field]) => {
        if (field.messages && field.messages.length > 0) {
            fieldMessages[fieldName] = field.messages;
        }
    });
    return fieldMessages;
}

/**
 * Updates all derived objects from comprehensive field objects
 * @param {Object} fields - Comprehensive field objects
 * @returns {Object} Object containing all derived objects
 */
export function updateDerivedObjects(fields) {
    return {
        formValues: extractFormValues(fields),
        fieldStates: extractFieldStates(fields),
        validationErrors: extractValidationErrors(fields),
        fieldMessages: extractFieldMessages(fields)
    };
}