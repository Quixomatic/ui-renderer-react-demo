# ServiceNow Catalog Variable Field Types

This document maps ServiceNow catalog variable types to their internal type representations used in the TurboForge Form v2 component.

## Field Type Mapping

### Text Input Types
| ServiceNow Type | Internal Type | Description | Implementation Status |
|-----------------|---------------|-------------|----------------------|
| Single Line Text | `string` | Basic single-line text input | ✅ Implemented |
| Wide Single Line Text | `string` | Single-line text with wider display | ✅ Implemented |
| Multi Line Text | `multi_two_lines` | Multi-line text area | ✅ Implemented |
| Email | `email` | Email input with validation | ✅ Implemented |
| URL | `url` | URL input with validation | ✅ Implemented |
| IP Address | `ip_address` | IP address input with validation | ✅ Implemented |
| Masked | `masked` | Masked input for sensitive data (SSN, credit cards) | ✅ Implemented |

### Choice/Selection Types
| ServiceNow Type | Internal Type | Description | Implementation Status |
|-----------------|---------------|-------------|----------------------|
| Select Box | `choice` | Dropdown select box | ✅ Implemented |
| Yes/No | `choice` with `subType: "button_yes_no"` | Yes/No button group | ✅ Implemented |
| CheckBox | `boolean` | Standard checkbox | ✅ Implemented |
| Multiple Choice | `multiple_choice` | Radio buttons for single selection | ✅ Implemented |
| Lookup Multiple Choice | `glide_list` | List collector for multi-select records | ✅ Implemented |

### Reference Types
| ServiceNow Type | Internal Type | Description | Implementation Status |
|-----------------|---------------|-------------|----------------------|
| Reference | `reference` | Generic reference lookup field | ✅ Implemented |
| Requested For | `requested_for` | Specialized user reference field | ✅ Implemented |

### Date/Time Types
| ServiceNow Type | Internal Type | Description | Implementation Status |
|-----------------|---------------|-------------|----------------------|
| Date | `glide_date` | Date picker | ✅ Implemented |
| Date/Time | `glide_date_time` | Date and time picker | ✅ Implemented |
| Duration | `glide_duration` | Duration picker (days, hours, minutes) | ✅ Implemented |

### Display Types
| ServiceNow Type | Internal Type | Description | Implementation Status |
|-----------------|---------------|-------------|----------------------|
| Label | `label` | Plain text display (read-only) | ✅ Implemented |
| Rich Text Label | `rich_text_label` | HTML/rich text display (read-only) | ✅ Implemented |
| HTML | `html` | Rich text editor (editable) | ✅ Implemented (basic textarea) |

### Special Types
| ServiceNow Type | Internal Type | Description | Implementation Status |
|-----------------|---------------|-------------|----------------------|
| Container Start/End | `container` | Layout container for grouping fields | ✅ Implemented |
| Container Split | `checkbox_container` | Special container for checkbox layouts | ✅ Implemented |
| Numeric Scale | `numeric_scale` | Rating scale (1-5 stars, etc.) | ✅ Implemented |

### Advanced Types (Not in current example)
| ServiceNow Type | Internal Type | Description | Implementation Status |
|-----------------|---------------|-------------|----------------------|
| Attachment | `attachment` | File upload field | ❌ Not Implemented |
| List Collector | `glide_list` | Multi-select reference field | ✅ Implemented |
| Lookup Select Box | `choice` with lookup | Dynamic choice list | ❌ Partial (choice implemented) |

## Implementation Priority

### High Priority (Common Usage)
1. ✅ `string` - Single line text
2. ✅ `boolean` - Checkbox
3. ✅ `choice` - Select box
4. ✅ `reference` - Reference lookup
5. ✅ `glide_date` - Date picker
6. ❌ `multi_two_lines` - Multi-line text area
7. ❌ `email` - Email validation
8. ❌ `url` - URL validation

### Medium Priority
1. ❌ `multiple_choice` - Radio buttons
2. ❌ `glide_duration` - Duration picker
3. ❌ `numeric_scale` - Rating scale
4. ❌ `masked` - Masked input
5. ❌ `label` - Display label
6. ❌ `rich_text_label` - HTML display

### Lower Priority
1. ❌ `ip_address` - IP address validation
2. ❌ `html` - Rich text editor
3. ❌ `requested_for` - User reference
4. ❌ `glide_list` - List collector
5. ❌ `attachment` - File upload

## Notes

- Fields marked with ✅ are already implemented in the codebase
- The `choice` field type supports different display modes via `subType` property
- Container types are used for layout and don't hold values themselves
- Some fields like "Wide Single Line Text" use the same type as regular text but with different display properties
- The `checkbox_container` is a special layout container used by ServiceNow for checkbox groupings