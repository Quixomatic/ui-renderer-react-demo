import React, { useEffect, useMemo, useRef, useState } from "react"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./select.jsx"
import { Input } from "./input.jsx"
import { cn } from "../../../components/lib/utils"
import { Eye, EyeOff } from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./tooltip.jsx"

export const MetaSegmentedInput = ({
  value,
  onChange,
  onError,
  use,
  configOptions,
  showDropdown = false,
  onConfigChange,
  disabled = false,
  className = "",
  variant = "segmented", // "segmented" or "unified"
}) => {
  const [selectedKey, setSelectedKey] = useState(use || configOptions.default)
  const selectedConfig = configOptions.options[selectedKey]
  const [showMask, setShowMask] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const refSegments = useRef([])

  const cleanPrefix = selectedConfig.prefix?.replace(/[^\w+]/g, "") || ""
  const inputMode = selectedConfig.inputMode || "text"
  const validateSegment = selectedConfig.validateSegment
  const formatSegment = selectedConfig.formatSegment
  const displayWrapper = selectedConfig.displayWrapper
  const separator =
    typeof selectedConfig.separator === "string"
      ? Array(selectedConfig.segments.length - 1).fill(selectedConfig.separator)
      : selectedConfig.separator || []

  const segmentsNormalized = selectedConfig.segments.map((s, i) =>
    typeof s === "number"
      ? { length: s }
      : { length: s.length, ...s }
  )

  const segments = useMemo(() => {
    if (!value) return segmentsNormalized.map(() => "")
    
    // Remove prefix if present
    let cleanValue = value
    if (cleanPrefix && value.startsWith(cleanPrefix)) {
      cleanValue = value.slice(cleanPrefix.length)
    }
    
    // If we have separators, split by them
    if (separator && separator.length > 0 && separator[0]) {
      const parts = cleanValue.split(separator[0])
      return segmentsNormalized.map((seg, i) => parts[i] || "")
    }
    
    // Otherwise, use the flat parsing approach (for things like SSN)
    const flatDigits = cleanValue.replace(/[^\w]/g, "")
    const result = []
    let idx = 0
    for (const seg of segmentsNormalized) {
      result.push(flatDigits.slice(idx, idx + seg.length))
      idx += seg.length
    }
    return result
  }, [value, selectedConfig, cleanPrefix, separator, segmentsNormalized])

  const updateOutput = (segmentsArray) => {
    // Filter out empty segments when building the output
    const nonEmptySegments = []
    const formatted = segmentsArray.map((s, i) => {
      const segRule = segmentsNormalized[i]
      if (segRule.format) return segRule.format(s)
      return formatSegment ? formatSegment(s, i) : s
    })
    
    // Only include segments up to the last non-empty one
    let lastNonEmptyIndex = -1
    for (let i = formatted.length - 1; i >= 0; i--) {
      if (formatted[i]) {
        lastNonEmptyIndex = i
        break
      }
    }
    
    // Build the final value only including non-empty segments
    if (lastNonEmptyIndex >= 0) {
      const includedSegments = formatted.slice(0, lastNonEmptyIndex + 1)
      const final = cleanPrefix + includedSegments.join(separator[0] || "")
      onChange?.({ config: selectedKey, value: final })
    } else {
      // All segments are empty
      onChange?.({ config: selectedKey, value: cleanPrefix })
    }
  }

  const validateAll = () => {
    const errors = segmentsNormalized.map((segRule, i) => {
      const val = segments[i]
      if (!val) return null
      const result = segRule.validate?.(val)
      if (typeof result === "string") return { index: i, reason: result }
      if (result === false) return { index: i, reason: segRule.errorMessage || "Invalid value" }

      const globalResult = validateSegment?.(val, i)
      if (typeof globalResult === "string") return { index: i, reason: globalResult }
      if (globalResult === false) return { index: i, reason: "Invalid value" }
      return null
    }).filter(Boolean)
    if (errors.length > 0) {
      onError?.({ config: selectedKey, errors })
    } else {
      onError?.({ config: selectedKey, errors: [] }) // Clear errors when valid
    }
  }

  const handleSegmentChange = (i, val) => {
    const seg = segmentsNormalized[i]
    const clean = seg.inputMode === "numeric" || inputMode === "numeric"
      ? val.replace(/\D/g, "")
      : val.replace(/[^0-9a-zA-Z]/g, "")
    const updated = [...segments]
    updated[i] = clean
    updateOutput(updated)

    // Auto-advance logic
    if (i < updated.length - 1) {
      // Check if we should auto-advance
      let shouldAdvance = false
      
      // If segment has an autoAdvance function, use it
      if (seg.autoAdvance && typeof seg.autoAdvance === 'function') {
        shouldAdvance = seg.autoAdvance(clean)
      } 
      // Otherwise, advance when reaching max length
      else if (clean.length === seg.length) {
        shouldAdvance = true
      }
      
      if (shouldAdvance) {
        // Simple setTimeout approach
        setTimeout(() => {
          const nextInput = refSegments.current[i + 1]
          if (nextInput && nextInput.focus) {
            nextInput.focus()
            nextInput.select?.()
          }
        }, 50)
      }
    }
  }

  const handleKeyDown = (e, i) => {
    if (e.key === "Backspace" && !e.currentTarget.value && i > 0) {
      refSegments.current[i - 1]?.focus()
    } else if (e.key === "ArrowLeft" && e.currentTarget.selectionStart === 0) {
      refSegments.current[i - 1]?.focus()
    } else if (e.key === "ArrowRight" && e.currentTarget.selectionStart === e.currentTarget.value.length) {
      refSegments.current[i + 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text")
    
    // Remove prefix if present
    let cleanPasted = pasted
    if (cleanPrefix && pasted.startsWith(cleanPrefix)) {
      cleanPasted = pasted.slice(cleanPrefix.length)
    }
    
    let updated = []
    
    // If we have separators, split by them
    if (separator && separator.length > 0 && separator[0]) {
      updated = cleanPasted.split(separator[0]).map((part, i) => {
        const seg = segmentsNormalized[i]
        if (!seg) return ""
        const isNumeric = seg.inputMode === "numeric" || inputMode === "numeric"
        return isNumeric ? part.replace(/\D/g, "") : part.replace(/[^0-9a-zA-Z]/g, "")
      })
    } else {
      // Otherwise strip non-word chars and slice
      const stripped = cleanPasted.replace(/[^\w]/g, "")
      let index = 0
      for (let seg of segmentsNormalized) {
        updated.push(stripped.slice(index, index + seg.length))
        index += seg.length
      }
    }
    
    // Ensure we have the right number of segments
    while (updated.length < segmentsNormalized.length) {
      updated.push("")
    }
    
    updateOutput(updated.slice(0, segmentsNormalized.length))
  }

  const handleBlur = () => {
    validateAll()
    const filled = segments.filter(s => s.length > 0)
    if (filled.length !== segments.length) return
    updateOutput(segments)
  }

  const isValid = (val, i) => {
    const segRule = segmentsNormalized[i]
    if (segRule.validate) return segRule.validate(val) !== false
    const globalResult = validateSegment?.(val, i)
    return globalResult !== false
  }

  useEffect(() => {
    if (use && configOptions.options[use]) {
      setSelectedKey(use)
    }
  }, [use])

  const handleConfigChange = (newKey) => {
    setSelectedKey(newKey)
    onChange?.({ config: newKey, value: configOptions.options[newKey].prefix || "" })
    onConfigChange?.(newKey)
  }

  return (
    <TooltipProvider>
      <div className={cn("flex flex-col space-y-2", className, disabled && "opacity-50 cursor-not-allowed")}>
        {showDropdown && (
        <Select value={selectedKey} onValueChange={handleConfigChange} disabled={disabled}>
          <SelectTrigger className="w-44">
            <SelectValue>{configOptions.options[selectedKey].label}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(configOptions.options).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>
                {cfg.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div
        className={cn(
          "flex items-center",
          variant === "unified" 
            ? cn(
                "min-h-9 w-full rounded-md border border-input bg-background shadow-sm px-3 py-1 transition-colors",
                "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
                disabled && "opacity-50 cursor-not-allowed",
                "space-x-0" // No spacing between segments in unified mode
              )
            : "space-x-2" // Normal spacing for segmented mode
        )}
        onPaste={disabled ? undefined : handlePaste}
        onBlur={disabled ? undefined : handleBlur}
        onClick={(e) => {
          // In unified mode, clicking anywhere should focus the first empty segment or first segment
          if (variant === "unified" && !disabled) {
            const firstEmptyIndex = segments.findIndex(seg => !seg)
            const targetIndex = firstEmptyIndex !== -1 ? firstEmptyIndex : 0
            refSegments.current[targetIndex]?.focus()
          }
        }}
      >
        {selectedConfig.prefix && (
          <span className="text-sm text-muted-foreground pr-1">
            {selectedConfig.prefix}
          </span>
        )}

        {segments.map((seg, i) => {
          const segmentIndex = i // Capture index in a const
          const segCfg = segmentsNormalized[segmentIndex]
          const wrapper = displayWrapper?.(segmentIndex) || {}
          const icon = segCfg.icon
          const isMasked = segCfg.mask && !showMask
          const showToggle = segCfg.mask

          return (
            <React.Fragment key={segmentIndex}>
              {wrapper.prefix && (
                <span className={cn(
                  variant === "unified" 
                    ? "text-foreground flex-shrink-0" // Normal text, prevent shrinking
                    : "text-muted-foreground" // Muted in segmented mode
                )}>
                  {wrapper.prefix}
                </span>
              )}

              <div className="relative flex items-center">
                {icon && (
                  <div className="absolute left-2 text-muted-foreground">
                    {React.createElement(icon, { size: 16 })}
                  </div>
                )}

                {segCfg.type === "select" ? (
                  <Select
                    disabled={disabled}
                    value={seg}
                    onValueChange={(val) => handleSegmentChange(segmentIndex, val)}
                  >
                    <SelectTrigger className={cn("w-20", icon && "pl-7")}>
                      <SelectValue placeholder={`Option`} />
                    </SelectTrigger>
                    <SelectContent>
                      {segCfg.options?.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    ref={(el) => (refSegments.current[segmentIndex] = el)}
                    className={cn(
                      variant === "unified" 
                        ? cn(
                            "border-0 shadow-none bg-transparent px-1 py-0 h-auto text-center focus-visible:ring-0 focus-visible:ring-offset-0",
                            icon && "pl-6"
                          )
                        : cn(
                            "text-center px-1",
                            icon && "pl-7",
                            !isValid(seg, segmentIndex) && "border-destructive"
                          )
                    )}
                    style={{ 
                      width: variant === "unified" 
                        ? `${Math.max(3, segCfg.length * 0.9)}rem` // Generous rem-based width for unified
                        : `${Math.max(2.5, segCfg.length * 0.75)}rem` // Rem-based width for segmented
                    }}
                    maxLength={segCfg.length}
                    value={seg}
                    onChange={(e) => handleSegmentChange(segmentIndex, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, segmentIndex)}
                    inputMode={segCfg.inputMode || inputMode}
                    type={isMasked ? "password" : "text"}
                    placeholder={segCfg.placeholder || ""}
                    aria-label={segCfg.ariaLabel}
                    disabled={disabled}
                    title={segCfg.tooltip || segCfg.ariaLabel}
                  />
                )}
              </div>

              {wrapper.suffix && (
                <span className={cn(
                  variant === "unified" 
                    ? "text-foreground flex-shrink-0" // Normal text, prevent shrinking
                    : "text-muted-foreground" // Muted in segmented mode
                )}>
                  {wrapper.suffix}
                </span>
              )}

              {segmentIndex < separator.length && (
                <span className={cn(
                  variant === "unified" 
                    ? "text-foreground px-1 flex-shrink-0" // Normal text color, padding, and prevent shrinking
                    : "text-muted-foreground" // Muted color in segmented mode
                )}>
                  {separator[segmentIndex]}
                </span>
              )}

              {showToggle && (
                <button
                  type="button"
                  onClick={() => setShowMask((prev) => !prev)}
                  className="ml-1 text-muted-foreground hover:text-foreground"
                  disabled={disabled}
                >
                  {showMask ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
    </TooltipProvider>
  )
}
