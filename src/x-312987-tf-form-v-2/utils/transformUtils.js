/**
 * Transformation utilities for client scripts and UI policies
 * 
 * Ensures field references use consistent 'variables.' naming convention
 */

import { getMappedFieldName } from './fieldUtils';

/**
 * Transforms client scripts to use mapped field names
 * @param {Object} clientScripts - Raw client scripts object
 * @returns {Object} Transformed client scripts
 */
export function transformClientScripts(clientScripts) {
    if (!clientScripts) return {};
    
    const transformed = {};
    
    // Transform each script type (onChange, onLoad, onSubmit)
    ['onChange', 'onLoad', 'onSubmit'].forEach(type => {
        transformed[type] = (clientScripts[type] || []).map(script => ({
            ...script,
            fieldName: script.fieldName ? getMappedFieldName(script.fieldName) : script.fieldName
        }));
    });
    
    return transformed;
}

/**
 * Transforms UI policies to use mapped field names
 * @param {Array} uiPolicies - Raw UI policies array
 * @returns {Array} Transformed UI policies
 */
export function transformUIPolicies(uiPolicies) {
    if (!uiPolicies || !Array.isArray(uiPolicies)) return [];
    
    return uiPolicies.map(policy => ({
        ...policy,
        
        // Transform actions (field references)
        actions: (policy.actions || []).map(action => ({
            ...action,
            name: action.name ? getMappedFieldName(action.name) : action.name
        })),
        
        // Transform condition fields
        condition_fields: (policy.condition_fields || []).map(fieldName => 
            fieldName ? getMappedFieldName(fieldName) : fieldName
        ),
        
        // Transform conditions
        conditions: (policy.conditions || []).map(condition => ({
            ...condition,
            field: condition.field ? getMappedFieldName(condition.field) : condition.field
        }))
    }));
}

/**
 * Transforms validation scripts to use mapped field names
 * @param {Array} validationScripts - Raw validation scripts array
 * @returns {Array} Transformed validation scripts
 */
export function transformValidationScripts(validationScripts) {
    if (!validationScripts || !Array.isArray(validationScripts)) return [];
    
    return validationScripts.map(script => ({
        ...script,
        fields: (script.fields || []).map(fieldName => 
            fieldName ? getMappedFieldName(fieldName) : fieldName
        )
    }));
}