# Local State Input Pattern for Form Fields

## Problem
React controlled inputs that update parent state on every keystroke cause:
- **Cursor jumping** to end of input when typing in middle of text
- **Lost undo history** (Ctrl+Z doesn't work)
- **Poor UX** due to input flickering and cursor position loss

This happens because:
1. User types → input dispatches to parent → parent re-renders → input gets new `value` prop
2. React treats each `value` prop update as "programmatic change" → resets cursor to end + clears undo stack
3. Even when the value is the same, React's controlled input behavior breaks native input UX

## Solution: Local State with Debounced Updates

Use **local state** to control the input, with **debounced + blur updates** to parent:

```javascript
// Local state for input control
const [localValue, setLocalValue] = useState(displayValue);

// Detect external changes (g_form.setValue, etc.) and sync local state
useEffect(() => {
    if (displayValue !== localValue) {
        setLocalValue(displayValue);
    }
}, [displayValue]);

// Debounced updates to parent (optional real-time updates)
const debouncedUpdate = useMemo(() => {
    let timeoutId;
    return (value) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            onValueChange(name, {
                value: value,
                displayValue: value
            });
        }, 300); // 300ms debounce
    };
}, [name, onValueChange]);

// Handle local value changes
const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedUpdate(newValue);
};

// Handle blur - ensure final sync
const handleBlur = () => {
    // Only dispatch if value actually changed from what parent knows
    if (localValue !== displayValue) {
        onValueChange(name, {
            value: localValue,
            displayValue: localValue
        });
    }
};

// Always use local state for input control
<Input
    value={localValue}
    onChange={handleChange}
    onBlur={handleBlur}
    // ... other props
/>
```

## Benefits

1. **Perfect UX**: Cursor stays in place, undo history preserved, no flickering
2. **ServiceNow compatibility**: Matches ServiceNow's blur-based updates
3. **Real-time updates**: Debounced updates allow validation and client scripts to work
4. **External change detection**: `g_form.setValue()` calls properly update the input
5. **Performance**: No re-renders on every keystroke

## When to Use This Pattern

### Fields That NEED This Pattern (User Text Input):

**Basic Text Fields:**
- `string` → **StringField** ✅ (COMPLETED)
- `email` → **EmailField** ✅ (COMPLETED)
- `url` → **UrlField** ✅ (COMPLETED)
- `masked` → **MaskedField** ✅ (COMPLETED - preserves show/hide toggle functionality)
- `ip_address` → **IpAddressFieldSegmented** ✅ (COMPLETED - segmented IP input with MetaSegmentedInput)

**Multi-line Text Fields:**
- `text` → **TextField** ✅ (COMPLETED)
- `multi_two_lines` → **TextField** ✅ (COMPLETED - same component)
- `html` → **HtmlField** ✅ (COMPLETED - Tiptap editor with debounced updates and onBlur)

**Special Input Fields:**
- `glide_duration` → **DurationField** ✅ (COMPLETED - 4 separate number inputs with debounced updates)

### Fields That DON'T Need This Pattern:

**Selection/Choice Fields:**
- `choice` → ChoiceField (dropdown)
- `multiple_choice` → MultipleChoiceField (radio buttons)
- `boolean` → BooleanField (checkbox)
- `choice:button_yes_no` → YesNoButtonField (button group)
- `glide_list` → ListCollectorField (multi-select dropdown)
- `multiple_choice:tile_choice` → TileChoiceField (tile selection)

**Date/Time Fields:**
- `glide_date` → DateField (date picker)
- `glide_date_time` → DateField (datetime picker)

**Reference Fields:**
- `reference` → ReferenceField (search/select)
- `requested_for` → ReferenceField (user lookup)
- All reference subtypes (table_list, tile_choice, etc.)

**Display Only Fields:**
- `label` → LabelField
- `rich_text_label` → RichTextLabelField
- `string:existing_value_text` → ExistingValueTextField
- All existing_value subtypes

**Other Non-Text Input Fields:**
- `numeric_scale` → NumericScaleField (slider)
- `file_attachment` → AttachmentField (file upload)
- `checkbox_group` → CheckboxGroupField (special checkbox group)

## Key Implementation Notes

1. **Initialize local state** with `displayValue` from props
2. **useEffect sync** detects external changes (like `g_form.setValue()`)
3. **Debounce timeout** should be 300ms (good balance of responsiveness vs performance)
4. **Blur handler** ensures final sync even if debounce hasn't fired
5. **Only sync on actual changes** to avoid unnecessary dispatches

## Migration Steps

For each applicable field component:

1. Add `useState(displayValue)` for local state
2. Add `useEffect` to sync external changes  
3. Create `useMemo` debounced update function
4. Update `handleChange` to use local state + debounced updates
5. Add `handleBlur` for final sync
6. Change input `value` prop from `displayValue` to `localValue`
7. Add `onBlur={handleBlur}` to input

This pattern completely solves the controlled input UX issues while maintaining compatibility with the form's state management and ServiceNow's expected behavior.

## Implementation Status

- [x] **StringField** - Completed and tested
- [x] **EmailField** - Completed and tested
- [x] **UrlField** - Completed and tested  
- [x] **TextField** - Completed and tested (text/multi_two_lines)
- [x] **IpAddressFieldSegmented** - Completed and tested (segmented IP input)
- [x] **DurationField** - Completed and tested (4 number inputs with debounced updates)
- [x] **MaskedField** - Completed and tested (preserves show/hide toggle)
- [x] **HtmlField** - Completed and tested (Tiptap editor with onBlur sync)