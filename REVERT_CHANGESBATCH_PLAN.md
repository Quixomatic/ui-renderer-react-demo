# Revert changesBatch System Plan

## Overview
The changesBatch system was implemented to fix stale data issues in client scripts (g_form.getValue() returning old values). However, it introduced cursor jumping issues in string/text fields. This document outlines all changes that need to be reverted.

## Files to Modify (8 total)

### 1. Main Form Component - `/src/x-312987-tf-form-v-2/index.js`
- **Remove from initialState:**
  ```javascript
  // Remove this line:
  changesBatch: {}
  ```
- **Revert FORM_VALUE_CHANGE handler:**
  - Remove the oldValue capture logic
  - Remove the changesBatch update in updateState
- **Remove entire action handler:**
  ```javascript
  'CHANGES_PROCESSED': ({ updateState }) => {
      // Remove this entire handler
  }
  ```

### 2. Main Form View - `/src/x-312987-tf-form-v-2/view.js`
- **Remove from state destructuring:**
  ```javascript
  // Remove changesBatch from this list:
  const { fields, formMessages, formValid, globals, clientScripts, uiPolicies, referenceData, referenceLoading, referencePagination, changesBatch } = state;
  ```
- **Remove prop from tf-catalog-form:**
  ```javascript
  // Remove this line:
  changesBatch={changesBatch}
  ```

### 3. Bridge Component - `/src/x-312987-tf-form-v-2/components/tf-catalog-form/index.js`
- **Remove property definition:**
  ```javascript
  changesBatch: {
      default: {},
  },
  ```

### 4. Bridge Component View - `/src/x-312987-tf-form-v-2/components/tf-catalog-form/view.js`
- **Remove from properties destructuring:**
  ```javascript
  // Remove changesBatch from properties
  ```
- **Remove the changesBatch useEffect entirely:**
  ```javascript
  // Remove this entire useEffect:
  useEffect(() => {
      if (changesBatch && Object.keys(changesBatch).length > 0 && !isLoadingRef.current) {
          // ... entire block
      }
  }, [changesBatch]);
  ```
- **Restore original handleValueChange with setTimeout:**
  ```javascript
  const handleValueChange = (field, value) => {
      // Track first interaction
      if (!hasInteractedRef.current) {
          hasInteractedRef.current = true;
          dispatch('FORM_FIRST_INTERACTION', {});
      }

      // Get old value before change
      const oldValue = formValues[field];

      // Dispatch the change
      dispatch('VALUE_CHANGE', { field, value });

      // Execute onChange scripts and re-evaluate UI policies
      setTimeout(() => {
          if (clientScriptEngineRef.current) {
              clientScriptEngineRef.current.executeOnChange(
                  field,
                  oldValue,
                  value,
                  isLoadingRef.current
              );
          }

          if (uiPolicyEngineRef.current) {
              // Need to get updated formValues after dispatch
              const updatedFormValues = { ...formValues, [field]: value };
              uiPolicyEngineRef.current.onFieldChange(field, updatedFormValues);
          }
      }, 0);
  };
  ```

### 5. MRVS Modal Component - `/src/x-312987-tf-form-v-2/components/tf-mrvs-modal/index.js`
- **Remove from initialState:**
  ```javascript
  // Remove this line:
  changesBatch: {},
  ```
- **Revert FORM_VALUE_CHANGE handler:**
  - Remove the oldValue capture logic
  - Remove the changesBatch update in updateState
- **Remove entire action handler:**
  ```javascript
  CHANGES_PROCESSED: {
      // Remove this entire handler
  },
  ```

### 6. MRVS Modal View - `/src/x-312987-tf-form-v-2/components/tf-mrvs-modal/view.js`
- **Remove from state destructuring:**
  ```javascript
  // Remove changesBatch from state destructuring (line 32)
  ```
- **Remove prop from tf-mrvs-modal-form:**
  ```javascript
  // Remove this line:
  changesBatch={changesBatch}
  ```

### 7. MRVS Bridge Component - `/src/x-312987-tf-form-v-2/components/tf-mrvs-modal/components/tf-mrvs-modal-form/index.js`
- **Remove property definition:**
  ```javascript
  changesBatch: {
      default: {},
  },
  ```

### 8. MRVS Bridge View - `/src/x-312987-tf-form-v-2/components/tf-mrvs-modal/components/tf-mrvs-modal-form/view.js`
- **Remove from properties destructuring:**
  ```javascript
  // Remove changesBatch from properties
  ```
- **Remove the changesBatch useEffect entirely**
- **Restore original handleValueChange with setTimeout:**
  ```javascript
  const handleValueChange = (field, value) => {
      // Track first interaction
      if (!hasInteractedRef.current) {
          hasInteractedRef.current = true;
          dispatch('FORM_FIRST_INTERACTION', {});
      }

      // Get old value before change
      const oldValue = formValues[field];

      // Dispatch the change
      dispatch('FORM_VALUE_CHANGE', { field, value });

      // Execute onChange scripts and re-evaluate UI policies
      setTimeout(() => {
          if (clientScriptEngineRef.current) {
              clientScriptEngineRef.current.executeOnChange(
                  field,
                  oldValue,
                  value,
                  isLoadingRef.current
              );
          }

          if (uiPolicyEngineRef.current) {
              // Need to get updated formValues after dispatch
              const updatedFormValues = { ...formValues, [field]: value };
              uiPolicyEngineRef.current.onFieldChange(field, updatedFormValues);
          }
      }, 0);
  };
  ```

## Expected Outcome After Revert
- Client scripts will run with setTimeout (may have stale data on g_form.getValue())
- No cursor jumping issues in string/text fields
- Back to the original behavior before changesBatch implementation

## Alternative Solutions to Consider
1. Fix the cursor jumping while keeping changesBatch
2. Implement proper cursor position tracking
3. Use blur-only updates for text fields
4. Debug why changesBatch causes multiple re-renders