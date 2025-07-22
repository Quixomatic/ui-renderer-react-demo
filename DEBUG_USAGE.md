# Debug Utility Usage Guide

## 🐛 TurboForge Form Debug System

A categorized logging system to help debug different parts of the form. Enable/disable categories as needed.

## 📋 Available Debug Categories

| Category | Description | Example Use |
|----------|-------------|-------------|
| `validation` | Field validation messages and regex errors | Debugging validation rules |
| `fieldState` | Field state changes (readonly, visible, mandatory) | Tracking g_form API calls |
| `fieldValues` | Field value changes and updates | Monitoring user input |
| `fieldMessages` | Field messaging (showFieldMsg, hideFieldMsg) | Testing field messages |
| `referenceField` | Reference field operations | Debugging lookup fields |
| `referenceSearch` | Reference field search and pagination | Search functionality |
| `referenceCache` | Reference field caching behavior | Performance debugging |
| `formState` | Overall form state changes | Form-level operations |
| `formSubmit` | Form submission and saving | Submit button debugging |
| `formInit` | Form initialization | Component startup issues |
| `clientScripts` | Client script execution | Custom script behavior |
| `uiPolicies` | UI policy evaluation | Dynamic field behavior |
| `componentInit` | Component initialization | React component lifecycle |
| `actionHandlers` | Action handler execution | Event flow debugging |
| `httpRequests` | HTTP requests and API calls | Network debugging |
| `layout` | Layout calculations and rendering | Container/column issues |
| `performance` | Performance-related logs | Timing and optimization |
| `general` | General debug messages | Catch-all category |

## 🚀 Quick Start

### Enable Specific Categories
```javascript
// In browser console:
window.tfDebug.configure({ 
    validation: true,
    referenceField: true,
    formSubmit: true 
});
```

### Configure Global Settings
```javascript
// Control bypass behavior and message formatting
window.tfDebug.configureSettings({
    alwaysShowErrors: true,        // Errors show even if category disabled (default: true)
    alwaysShowWarnings: false,     // Warnings only show if category enabled (default: false) 
    messagePrefix: 'TF-FORM'       // Prefix all messages (default: 'TF-FORM')
});
```

### Enable All Debug Output
```javascript
// See everything (can be noisy!)
window.tfDebug.enableAll();
```

### Disable All Debug Output
```javascript
// Clean console
window.tfDebug.disableAll();
```

### Check Current Settings
```javascript
// See what's enabled (returns both categories and global settings)
window.tfDebug.getConfig();
// Returns: { config: { validation: true, ... }, settings: { alwaysShowErrors: true, ... } }
```

## 🛠️ Common Debug Scenarios

### 🔍 **Debugging Field Validation**
```javascript
window.tfDebug.configure({ validation: true });
// Now type in fields to see validation messages
```

### 🔄 **Debugging Reference Fields**
```javascript
window.tfDebug.configure({ 
    referenceField: true,
    referenceSearch: true,
    referenceCache: true 
});
// Click reference field dropdowns to see search/cache behavior
```

### 📝 **Debugging Form Submission**
```javascript
window.tfDebug.configure({ 
    formSubmit: true,
    validation: true,
    formState: true 
});
// Click submit button to see validation and submission flow
```

### 🎯 **Debugging Field State Changes**
```javascript
window.tfDebug.configure({ 
    fieldState: true,
    fieldMessages: true 
});
// Run g_form commands to see state changes:
// g_form.setVisible('field_name', false);
// g_form.showFieldMsg('field_name', 'Test message', 'info');
```

### 🏗️ **Debugging Layout Issues**
```javascript
window.tfDebug.configure({ layout: true });
// Refresh page to see layout normalization
```

## 📊 Log Output Examples

With debugging enabled, you'll see categorized logs like:

```
[TF-FORM:VALIDATION] Invalid regex pattern for field variables.email: SyntaxError
[TF-FORM:FIELDVALUES] FORM_VALUE_CHANGE triggered: { field: "variables.name", value: "John" }
[TF-FORM:REFERENCESEARCH] REFERENCE_SEARCH triggered: { field: "variables.user", searchTerm: "john" }
[TF-FORM:REFERENCECACHE] Initial data already cached for field: variables.user__sys_user
[TF-FORM:FORMSUBMIT] Form submitted: { verb: null, values: {...} }
[TF-FORM:LAYOUT] Layout Normalization
    Original layout: [...]
    Normalized layout: [...]
```

## 🚨 Error Bypass Behavior

**Important**: By default, all `debug.error()` calls will show in the console **even if their category is disabled**. This ensures critical errors are never missed.

```javascript
// These will ALWAYS show (unless alwaysShowErrors is disabled):
debug.error('referenceField', 'Failed to load reference data');
debug.error('validation', 'Critical validation error');

// These only show if category is enabled:
debug.log('validation', 'Field validated successfully');
debug.warn('performance', 'Slow operation detected');
```

### Disable Error Bypass
```javascript
// Turn off the error bypass - errors will now respect category settings
window.tfDebug.configureSettings({ alwaysShowErrors: false });
```

## 🎛️ Advanced Usage

### Custom Debug Categories (for developers)
```javascript
// In your component:
import debug from '../lib/debug.js';

// Log with category
debug.log('myCategory', 'Something happened', { data: 'value' });

// Warning
debug.warn('myCategory', 'This might be a problem', errorData);

// Error
debug.error('myCategory', 'Something failed', exception);

// Grouped logs
debug.group('myCategory', 'Processing User Data', () => {
    debug.log('myCategory', 'Step 1: Validate');
    debug.log('myCategory', 'Step 2: Save');
});

// Timing
const result = debug.time('performance', 'Heavy Operation', () => {
    // expensive operation
    return processData();
});
```

## 🔧 Production Notes

- Debug logs only appear when categories are enabled (except errors by default)
- Safe to leave debug calls in code - they're no-ops when disabled
- Available globally as `window.tfDebug` for browser console access
- No performance impact when categories are disabled
- **Error bypass ensures critical errors are never missed in production**
- All messages prefixed with `TF-FORM:CATEGORY` for easy identification

## 📝 Current Converted Logs

**Main Component (`index.js`):**
- ✅ Validation regex errors → `validation` category
- ✅ Field value changes → `fieldValues` category  
- ✅ Choice field operations → `fieldState` category
- ✅ Form submission/saving → `formSubmit` category
- ✅ Reference search triggers → `referenceSearch` category
- ✅ Reference cache hits → `referenceCache` category
- ✅ Field config errors → `referenceField` category

**Layout System:**
- ✅ Layout normalization → `layout` category
- ✅ Missing container warnings → `layout` category

**Still To Convert:**
- Field renderer warnings → `general` category
- Container field warnings → `layout` category
- Component initialization logs → `componentInit` category
- HTTP request/response logs → `httpRequests` category

## 💡 Pro Tips

1. **Start Small**: Enable just 1-2 categories at first
2. **Be Specific**: Use targeted categories instead of enableAll()
3. **Performance**: Use `performance` category to time operations
4. **Groups**: Use debug.group() for related operations
5. **Browser Console**: Use `window.tfDebug` for quick testing

---

Happy debugging! 🎉