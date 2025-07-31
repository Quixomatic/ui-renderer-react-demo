# Multi-Row Variable Set (MRVS) Implementation Plan

## Overview

Multi-Row Variable Sets (MRVS) are complex field types that allow users to create multiple rows of related data within a ServiceNow catalog form. Each MRVS acts as a mini-form with its own fields, validation, and business logic.

## Architecture

### Two-Phase Data Model

1. **Main Form Phase** (Initial Load)
   - Basic MRVS metadata (field definitions with numeric types)
   - Existing row data (value/displayValue arrays)
   - Column headers for display
   - Permissions (canRead, canWrite, canCreate)

2. **Modal Form Phase** (Lazy Load)
   - Complete field definitions with proper types
   - UI policies specific to MRVS fields
   - Client scripts (onChange, onLoad, onSubmit)
   - Validation scripts
   - Reference field configurations

### Component Hierarchy

```
x-312987-tf-form-v-2 (Snabbdom - Main Form Component)
├── tf-catalog-form (React Bridge - Main Form)
│   └── MultiRowVariableSetField.jsx (Display Component)
│       ├── Renders table with existing rows
│       ├── Shows column headers from field definitions
│       ├── Add/Edit/Delete row buttons
│       └── Renders tf-mrvs-modal component when active
│
└── x-312987-tf-mrvs-modal (Snabbdom - Separate ServiceNow Component)
    ├── Own state management and action handlers
    ├── HTTP effects for lazy loading MRVS data
    ├── Isolated shadow DOM
    │
    └── tf-mrvs-form (React Bridge - MRVS Form)
        └── MRVSForm.jsx (React Component)
            ├── Reuses existing field components (FieldRenderer, etc.)
            ├── Creates isolated g_form instance
            ├── Renders form fields for single row
            └── Handles validation and save logic
```

### Architecture Benefits

1. **Complete Isolation** - MRVS modal is a separate ServiceNow component with its own:
   - State management (properties, state, updateState)
   - Action handlers (no scope checking needed)
   - HTTP effects (direct API calls)
   - Shadow DOM (style isolation)

2. **Code Reuse** - The tf-mrvs-form React bridge can:
   - Import and use all existing field components
   - Reuse FieldRenderer, BaseField, etc.
   - Share validation logic and utilities
   - Use same shadcn/ui components

3. **Clean Communication** - Simple props/events between components:
   ```javascript
   // In MultiRowVariableSetField.jsx
   {showModal && (
     <tf-mrvs-modal
       active={true}
       variable-set-id={field.id}
       variable-set-name={field.name}
       source-table={sourceTable}
       source-id={sourceId}
       row-data={editingRow}
       row-index={editingIndex}
       parent-fields={fields}
       onSave={handleRowSave}
       onClose={handleModalClose}
     />
   )}
   ```

## Data Flow

### 1. Initial Display
```javascript
// Main form receives MRVS data
{
  type: "container",
  containerType: "one_to_many",
  fields: [
    { name: "field1", type: "6", label: "Field 1" },
    { name: "field2", type: "8", label: "Field 2" }
  ],
  value: [
    { field1: "value1", field2: "ref_sys_id" }
  ],
  displayValue: [
    { field1: "value1", field2: "Reference Display" }
  ]
}
```

### 2. Modal Open Action
```javascript
// User clicks Add/Edit
dispatch('MRVS_MODAL_OPEN', {
  variableSetId: field.id,
  variableSetName: field.name,
  action: 'add', // or 'edit'
  rowIndex: null, // or index for edit
  rowData: {} // existing data for edit
});
```

### 3. Lazy Load MRVS Data
```javascript
// API call to get complete field definitions
POST /api/now/sp/widget/sc-multi-row-active-row
{
  action: "add",
  variable_set_id: "mrvs_id",
  source_id: "record_sys_id",
  source_table: "sc_cart_item",
  row_data: {},
  workspace_form: true
}

// Returns complete field definitions, scripts, policies
```

### 4. Row Save/Update
```javascript
// Modal saves row data back to main form
dispatch('MRVS_ROW_SAVE', {
  variableSetName: 'variables.mrvs_name',
  rowIndex: 0, // null for new rows
  rowData: { field1: "value", field2: "value" },
  displayData: { field1: "display", field2: "display" }
});
```

## Implementation Phases

### Phase 1: Display Component (MultiRowVariableSetField)
- [ ] Create base component structure
- [ ] Implement table display with existing rows
- [ ] Add numeric type to field type mapping utility
- [ ] Create Add/Edit/Delete row buttons
- [ ] Handle row selection and actions
- [ ] Implement max rows validation
- [ ] Render tf-mrvs-modal element when needed

### Phase 2: MRVS Modal ServiceNow Component
- [ ] Create x-312987-tf-mrvs-modal component structure
- [ ] Set up properties (active, variableSetId, sourceTable, etc.)
- [ ] Create action handlers for modal lifecycle
- [ ] Set up HTTP effect for lazy loading
- [ ] Configure shadow DOM and styles

### Phase 3: MRVS React Bridge (tf-mrvs-form)
- [ ] Create React bridge component registration
- [ ] Import and reuse existing field components
- [ ] Set up props interface with parent component
- [ ] Create MRVSForm.jsx main component

### Phase 4: MRVS Data Loading
- [ ] Implement MRVS widget API call in modal component
- [ ] Parse response to get field definitions
- [ ] Transform numeric types to string types
- [ ] Create isolated form data structure
- [ ] Initialize row-specific g_form instance

### Phase 5: Row Form Rendering
- [ ] Render fields using existing FieldRenderer
- [ ] Apply UI policies within row context
- [ ] Execute client scripts for row
- [ ] Handle field state changes and validation

### Phase 6: Data Synchronization
- [ ] Implement row save functionality
- [ ] Communicate save back to main form via props
- [ ] Update main form value/displayValue arrays
- [ ] Handle row deletion with confirmation
- [ ] Validate against maxRows constraint

### Phase 7: Advanced Features
- [ ] Row reordering (if needed)
- [ ] Bulk operations (delete multiple)
- [ ] Row duplication
- [ ] Import/export functionality

## Technical Considerations

### Field Type Mapping
```javascript
const MRVS_FIELD_TYPE_MAP = {
  '1': 'boolean',
  '2': 'break',
  '3': 'multiple_choice',
  '4': 'numeric_scale',
  '5': 'select_box',     // choice
  '6': 'single_line_text', // string
  '7': 'checkbox',        // actually wide_text
  '8': 'reference',
  '9': 'date',
  '10': 'datetime',
  // ... complete mapping needed
};
```

### Scoped g_form Instance
```javascript
// Each MRVS row needs isolated g_form
const rowGForm = createScopedGForm({
  scope: {
    type: 'mrvs_row',
    mrvsId: field.id,
    rowIndex: currentRowIndex
  },
  fields: mrvsFields,
  dispatch: scopedDispatch
});
```

### Event Isolation (Simplified with Separate Component)

With the MRVS modal as a separate ServiceNow component, event isolation is automatic:

```javascript
// In x-312987-tf-mrvs-modal component
'FORM_VALUE_CHANGE': ({ action, updateState, state }) => {
  // This only affects the MRVS modal's state
  // No need for scope checking - it's completely isolated
  const { field, value } = action.payload;
  updateState({ 
    formValues: { 
      ...state.formValues, 
      [field]: value 
    } 
  });
}

// Communication back to main form is explicit via props
const handleSave = () => {
  // Validate row data
  if (isValid) {
    // Call the onSave prop passed from parent
    properties.onSave({
      rowData: state.formValues,
      displayData: state.displayValues,
      rowIndex: properties.rowIndex
    });
  }
};
```

**Benefits of Component Isolation**:
1. No scope metadata needed in events
2. No scope checking in action handlers
3. Clear parent-child communication via props/events
4. Each component manages its own state independently
5. HTTP effects are local to each component

### Action Handlers Required

1. **Main Component** (x-312987-tf-form-v-2)
   - `MRVS_ROW_SAVE` - Updates row data in main form state
   - `MRVS_ROW_DELETE` - Removes row from array
   - `MRVS_MODAL_OPEN` - Sets modal visibility state
   - `MRVS_MODAL_CLOSE` - Clears modal state

2. **MRVS Modal Component** (x-312987-tf-mrvs-modal)
   - `COMPONENT_INIT` - Initialize modal state
   - `MRVS_LOAD_DATA` - Trigger API call for field definitions
   - `MRVS_DATA_LOADED` - Process complete field data
   - `FORM_VALUE_CHANGE` - Handle field updates (isolated)
   - `FORM_FIELD_STATE_CHANGE` - Handle visibility/readonly (isolated)
   - `REFERENCE_SEARCH` - Search within MRVS context
   - `FORM_SUBMIT` - Validate and trigger onSave prop
   - `FORM_CANCEL` - Trigger onClose prop
   
3. **No Shared Actions** - Complete isolation means:
   - Each component has its own action handlers
   - No scope checking needed
   - No event bubbling between components
   - Clean prop-based communication only

### UI/UX Considerations

1. **Table Display**
   - Responsive design for mobile
   - Truncate long values with tooltips
   - Clear action buttons per row
   - Highlight mandatory MRVS

2. **Modal Design**
   - Full-screen on mobile
   - Clear save/cancel actions
   - Show validation errors inline
   - Loading state during data fetch

3. **Accessibility**
   - Keyboard navigation in table
   - Screen reader announcements
   - Focus management in modal

## API Endpoints

### Required Endpoints
1. `/api/now/sp/widget/sc-multi-row-active-row` - Get MRVS field definitions
2. `/api/sn/sc/servicecatalog/variables/{table}/{sys_id}` - May need for data lookups

### Headers Required
```javascript
{
  'x-portal': '81b75d3147032100ba13a5554ee4902b',
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}
```

## State Structure

### Main Form State Addition
```javascript
{
  // Existing state...
  mrvsModalState: {
    isOpen: false,
    variableSetId: null,
    variableSetName: null,
    action: null, // 'add' or 'edit'
    rowIndex: null,
    rowData: {},
    isLoading: false,
    error: null,
    fields: {}, // Loaded field definitions
    formValues: {}, // Current row form values
    fieldStates: {} // Visibility, readonly, etc.
  }
}
```

## Error Handling

1. **API Failures** - Show error message, allow retry
2. **Validation Errors** - Display inline, prevent save
3. **Max Rows Exceeded** - Disable add button, show message
4. **Network Issues** - Graceful degradation

## Testing Strategy

1. **Unit Tests**
   - Field type mapping
   - Row data transformations
   - Validation logic

2. **Integration Tests**
   - API communication
   - Modal open/close flow
   - Data persistence

3. **E2E Tests**
   - Complete add row flow
   - Edit existing row
   - Delete row with confirmation

## Future Enhancements

1. **Bulk Operations** - Select multiple rows for deletion
2. **Templates** - Save row as template for reuse
3. **Conditional Fields** - Show/hide fields based on other fields in row
4. **Calculated Fields** - Auto-calculate values based on row data
5. **External Data** - Import rows from Excel/CSV

## Success Criteria

- [ ] Can display existing MRVS rows in table format
- [ ] Can add new rows up to maxRows limit
- [ ] Can edit existing rows with all field types
- [ ] Can delete rows with confirmation
- [ ] UI policies work within row context
- [ ] Client scripts execute properly
- [ ] Validation prevents invalid data
- [ ] Modal is accessible and responsive
- [ ] Performance is acceptable with many rows

## Notes

- ServiceNow limits MRVS to 2-column layouts maximum
- Each row operates as independent form instance
- UI policies don't affect fields across different rows
- Client scripts have row-scoped g_form access
- Reference fields in MRVS need full configuration from lazy load

## Reference Implementation Files

Key files from the example-component that demonstrate MRVS functionality:

### Main MRVS Component
- `.example-component/multi-row-variable/index.js` - Main MRVS component setup
- `.example-component/multi-row-variable/view.js` - Renders table and modal (line 138-153 for modal)
- `.example-component/multi-row-variable/utils.js` - `parseRowData` function for data transformation

### Modal Component
- `.example-component/multi-row-form-modal/formEnvironmentHandlers.js` - PLATFORM_RESOURCES_LOADED handler (line 85-90)
- `.example-component/multi-row-form-modal/index.js` - Modal component registration

### Data Loading & API
- `.example-component/library-catalog-form/effects/initializeEnvironment.js` - `initializeFormEnvironment` function (line 52)
- `.example-component/library-catalog-form/effects/initializeFormData.js` - Creates request body and parses response
- `.example-component/library-catalog-form/effects/requestHelpers.js` - `sendMultRowWidgetRequest` API call

### Key Functions & Patterns
1. **API Endpoint**: `/api/now/sp/widget/sc-multi-row-active-row` (requestHelpers.js)
2. **Request Body Structure**: 
   ```javascript
   {
     action: 'add' | 'edit',
     variable_set_id: field.id,
     source_id: sourceId,
     source_table: sourceTable,
     row_data: {},
     workspace_form: true
   }
   ```
3. **Response Parsing**: `parseMultiRowWidgetResponse` in initializeFormData.js
4. **Field Factory**: `createVariableFieldFactory` for MRVS-specific fields