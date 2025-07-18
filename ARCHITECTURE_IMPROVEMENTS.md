# TurboForge Form v2 - Architecture Improvements Plan

## Overview

This document outlines the architectural improvements needed for the TurboForge Form v2 component based on analysis of ServiceNow's native catalog form implementation patterns. The goal is to enhance our component's ServiceNow compatibility while maintaining our modern React architecture advantages.

## Current Architecture

```
x-312987-tf-form-v-2 (Snabbdom)
  ├── Properties (from parent)
  ├── State (internal)
  └── tf-catalog-form (React Bridge)
      └── React Components
```

## Key Improvements Needed

### 1. Field Name Transformation

**Current State**: We handle field naming inconsistently between `variable_name` and `variables.variable_name` formats.

**Improvement**: Implement a centralized `getMappedFieldName()` utility function.

```javascript
// Utility function to ensure consistent field naming
export function getMappedFieldName(fieldName) {
    if (fieldName.indexOf('variables.') !== 0) {
        return `variables.${fieldName}`;
    }
    return fieldName;
}
```

**Usage Points**:
- Client script field references
- UI Policy conditions and actions
- Field value lookups
- g_form API calls

### 2. Comprehensive Field Objects

**Current State**: Field properties come directly from props without processing. Field values, display values, and state (readonly, mandatory, visible) are managed separately.

**Improvement**: Create comprehensive field objects in the main component's state that combine:
- Original field configuration
- Current value and displayValue
- Runtime state (visible, readonly, mandatory, disabled)
- Field metadata (variable_name, parent, type-specific properties)

```javascript
// Example comprehensive field object structure
{
    "variables.start_date": {
        // Original properties
        name: "variables.start_date",
        variable_name: "start_date",
        type: "glide_date",
        label: "Start Date",
        
        // Value properties
        value: "2025-01-23",
        displayValue: "2025-01-23",
        oldValue: "2025-01-23",
        
        // State properties (can be modified by g_form)
        visible: true,
        readonly: false,
        mandatory: true,
        disabled: false,
        
        // Metadata
        _cat_variable: true,
        parent: "",
        maxLength: null,
        helpText: "",
        instructions: "",
        
        // Type-specific properties
        // (added by augmentFieldByType)
    }
}
```

### 3. State Management Refactor

**Current State**: Properties and state are mixed; field values and field configurations are separate.

**Improvement**: Clear separation between:
- **Properties**: Immutable data from parent (formData, sourceTable, sourceId, etc.)
- **State**: Mutable comprehensive field objects and form state

```javascript
// In x-312987-tf-form-v-2/index.js
initialState: {
    // Comprehensive field objects (derived from properties.fields)
    fields: {},
    
    // Form-level state
    formMessages: [],
    formValid: true,
    
    // ServiceNow globals
    globals: {
        g_user: null,
        g_scratchpad: {}
    }
}

// On COMPONENT_CONNECTED
actionHandlers: {
    [COMPONENT_CONNECTED]: ({ action, updateState, state, properties }) => {
        // Transform properties.fields into comprehensive field objects
        const comprehensiveFields = createComprehensiveFields(
            properties.fields,
            properties.variablesLayout,
            properties.sourceTable,
            properties.sourceId
        );
        
        // Initialize ServiceNow globals
        const globals = {
            g_user: window.g_user || {},
            g_scratchpad: window.g_scratchpad || {}
        };
        
        updateState({ 
            fields: comprehensiveFields,
            globals: globals
        });
    }
}
```

### 4. Client Script & UI Policy Transformation

**Current State**: Client scripts and UI policies are passed through without field name transformation.

**Improvement**: Transform field references when initializing:

```javascript
// Transform client scripts
function transformClientScripts(clientScripts) {
    const transformed = {};
    ['onChange', 'onLoad', 'onSubmit'].forEach(type => {
        transformed[type] = (clientScripts[type] || []).map(script => ({
            ...script,
            fieldName: getMappedFieldName(script.fieldName)
        }));
    });
    return transformed;
}

// Transform UI policies
function transformUIPolicies(fields, uiPolicies) {
    return uiPolicies.map(policy => ({
        ...policy,
        actions: policy.actions.map(action => ({
            ...action,
            name: getMappedFieldName(action.name)
        })),
        conditions: policy.conditions.map(condition => ({
            ...condition,
            field: getMappedFieldName(condition.field)
        }))
    }));
}
```

### 5. ServiceNow Global Variables

**Current State**: No ServiceNow global context.

**Improvement**: Initialize and expose ServiceNow globals:

```javascript
// In component initialization
const globals = {
    g_user: window.g_user || {},
    g_scratchpad: window.g_scratchpad || {},
    g_modal: window.g_modal || null,
    g_ck: window.g_ck || '',
    // Add other globals as needed
};

// Make available to g_form and client scripts
window.g_form.globals = globals;
```

## Implementation Plan

### Phase 1: Core Infrastructure (Priority: High)
1. **Create comprehensive field objects**
   - Implement `createComprehensiveFields()` function
   - Update main component to create field objects on initialization
   - Pass comprehensive fields down to React components

2. **Implement field name utilities**
   - Create `getMappedFieldName()` utility
   - Use consistently throughout codebase

3. **Update action handlers**
   - Modify `FORM_VALUE_CHANGE` to update comprehensive field objects
   - Update `FORM_FIELD_STATE_CHANGE` to modify field state properties

### Phase 2: ServiceNow Compatibility (Priority: High)
1. **Transform client scripts and UI policies**
   - Implement transformation functions
   - Apply during component initialization

2. **Initialize ServiceNow globals**
   - Pull from window object when available
   - Provide defaults for development

### Phase 3: Enhanced Features (Priority: Medium)
1. **Type-specific field augmentation**
   - Add choice field enhancements
   - Reference field configurations
   - Date/time field specifics

2. **Event batching** (Future consideration)
   - Implement change event batching
   - Optimize re-renders

## Benefits

1. **Single Source of Truth**: Comprehensive field objects contain all field-related data
2. **Better ServiceNow Compatibility**: Proper field naming and global context
3. **Cleaner Architecture**: Clear separation between properties and state
4. **Easier Maintenance**: Centralized field processing logic
5. **Future-Proof**: Ready for additional ServiceNow features

## Migration Path

1. Update main component to create comprehensive field objects
2. Modify child components to use new field structure
3. Update g_form implementation to work with comprehensive fields
4. Test with existing functionality
5. Add new features (client scripts, UI policies)

## Example Usage

```javascript
// Before: Multiple sources for field data
const fieldConfig = properties.fields['variables.start_date'];
const fieldValue = state.formValues['variables.start_date'];
const fieldState = state.fieldStates['variables.start_date'];

// After: Single comprehensive object
const field = state.fields['variables.start_date'];
// Access everything: field.value, field.displayValue, field.visible, field.mandatory, etc.
```

This architecture will provide a solid foundation for the TurboForge Form v2 component while maintaining compatibility with ServiceNow's patterns and enabling future enhancements.