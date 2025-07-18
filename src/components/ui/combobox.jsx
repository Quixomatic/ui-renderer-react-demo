"use client"

import * as React from "react"
import { CheckIcon, ChevronsUpDownIcon, XIcon } from "lucide-react"

import { cn } from "../../../components/lib/utils"
import { Button } from "./button.jsx"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command.jsx"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover.jsx"

/**
 * Combobox component for searchable dropdowns
 * Perfect for ServiceNow reference fields
 */
export function Combobox({ 
  options = [], 
  value, 
  onValueChange, 
  onSearchChange,
  onClear,
  placeholder = "Select item...", 
  searchPlaceholder = "Search...", 
  emptyMessage = "No items found.",
  className,
  disabled = false,
  container,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  ...props 
}) {
  const [open, setOpen] = React.useState(false)

  // Find the selected option
  const selectedOption = options.find((option) => option.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn("flex w-full", className)}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "flex-1 justify-between",
              selectedOption && onClear ? "rounded-r-none" : ""
            )}
            disabled={disabled}
            {...props}
          >
            <span className="truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        {selectedOption && onClear && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="px-2 rounded-l-none border-l-0 hover:bg-red-50 hover:text-red-600"
            onClick={onClear}
          >
            <XIcon className="h-4 w-4" />
          </Button>
        )}
      </div>
      <PopoverContent 
        className="w-full p-0" 
        style={{ 
          width: 'var(--radix-popover-trigger-width)',
          maxHeight: '18rem'
        }}
        container={container}
      >
        <Command shouldFilter={false} className="h-full">
          <CommandInput 
            placeholder={searchPlaceholder} 
            onValueChange={onSearchChange}
          />
          <CommandList style={{ maxHeight: '13rem', overflowY: 'auto' }}>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                  className="flex items-start py-2"
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 h-4 w-4 mt-0.5 flex-shrink-0",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">
                      {option.label}
                    </div>
                    {option.secondaryInfo && (
                      <div className="text-xs text-muted-foreground truncate mt-0.5">
                        {option.secondaryInfo}
                      </div>
                    )}
                  </div>
                </CommandItem>
              ))}
              {hasMore && (
                <CommandItem
                  key="load-more"
                  value="__load_more__"
                  onSelect={(currentValue, event) => {
                    if (event) {
                      event.preventDefault();
                      event.stopPropagation();
                    }
                    if (onLoadMore && !isLoadingMore) {
                      onLoadMore()
                    }
                    // Keep the popover open when loading more
                    return false;
                  }}
                  className="flex items-center justify-center py-3 border-t border-border"
                  disabled={isLoadingMore}
                >
                  <div className="text-sm text-muted-foreground">
                    {isLoadingMore ? "Loading more..." : "Load more results"}
                  </div>
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}