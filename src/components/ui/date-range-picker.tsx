"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CalendarIcon, X } from "lucide-react"
import { format } from "date-fns"

export interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
  className?: string
  placeholder?: string
  minDate?: Date
  maxDate?: Date
}

export function DateRangePicker({
  value,
  onChange,
  className,
  placeholder = "Select date range",
  minDate,
  maxDate = new Date()
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [tempRange, setTempRange] = React.useState<DateRange>(value)

  const handleApply = () => {
    onChange(tempRange)
    setIsOpen(false)
  }

  const handleClear = () => {
    const cleared = { from: undefined, to: undefined }
    setTempRange(cleared)
    onChange(cleared)
    setIsOpen(false)
  }

  const formatDateRange = () => {
    if (!value.from && !value.to) return placeholder
    if (value.from && !value.to) return `From ${format(value.from, "MMM dd, yyyy")}`
    if (!value.from && value.to) return `Until ${format(value.to, "MMM dd, yyyy")}`
    if (value.from && value.to) {
      return `${format(value.from, "MMM dd")} - ${format(value.to, "MMM dd, yyyy")}`
    }
    return placeholder
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal tap-target",
              !value.from && !value.to && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="start">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Quick Ranges</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const to = new Date()
                    const from = new Date(to)
                    from.setDate(to.getDate() - 7)
                    setTempRange({ from, to })
                  }}
                >
                  Last 7 days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const to = new Date()
                    const from = new Date(to)
                    from.setDate(to.getDate() - 30)
                    setTempRange({ from, to })
                  }}
                >
                  Last 30 days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const to = new Date()
                    const from = new Date(to)
                    from.setDate(to.getDate() - 90)
                    setTempRange({ from, to })
                  }}
                >
                  Last 90 days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const to = new Date()
                    const from = new Date(to.getFullYear(), 0, 1)
                    setTempRange({ from, to })
                  }}
                >
                  This year
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Custom Date Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="from-date" className="text-xs text-muted-foreground">From</Label>
                  <Input
                    id="from-date"
                    type="date"
                    value={tempRange.from ? format(tempRange.from, "yyyy-MM-dd") : ""}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : undefined
                      setTempRange({ ...tempRange, from: date })
                    }}
                    max={maxDate ? format(maxDate, "yyyy-MM-dd") : undefined}
                    min={minDate ? format(minDate, "yyyy-MM-dd") : undefined}
                    className="tap-target"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="to-date" className="text-xs text-muted-foreground">To</Label>
                  <Input
                    id="to-date"
                    type="date"
                    value={tempRange.to ? format(tempRange.to, "yyyy-MM-dd") : ""}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : undefined
                      setTempRange({ ...tempRange, to: date })
                    }}
                    max={maxDate ? format(maxDate, "yyyy-MM-dd") : undefined}
                    min={tempRange.from ? format(tempRange.from, "yyyy-MM-dd") : minDate ? format(minDate, "yyyy-MM-dd") : undefined}
                    className="tap-target"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="tap-target"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
              <Button
                size="sm"
                onClick={handleApply}
                disabled={!tempRange.from || !tempRange.to}
                className="tap-target"
              >
                Apply Range
              </Button>
            </div>

            {tempRange.from && tempRange.to && (
              <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                {Math.ceil((tempRange.to.getTime() - tempRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1} days selected
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

// Simplified mobile-friendly version with just date inputs
export function SimpleDateRangePicker({
  value,
  onChange,
  className,
  minDate,
  maxDate = new Date()
}: DateRangePickerProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-2", className)}>
      <div className="space-y-1">
        <Label htmlFor="from-date-simple" className="text-xs">From Date</Label>
        <Input
          id="from-date-simple"
          type="date"
          value={value.from ? format(value.from, "yyyy-MM-dd") : ""}
          onChange={(e) => {
            const date = e.target.value ? new Date(e.target.value) : undefined
            onChange({ ...value, from: date })
          }}
          max={maxDate ? format(maxDate, "yyyy-MM-dd") : undefined}
          min={minDate ? format(minDate, "yyyy-MM-dd") : undefined}
          className="tap-target"
          aria-label="Start date"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="to-date-simple" className="text-xs">To Date</Label>
        <Input
          id="to-date-simple"
          type="date"
          value={value.to ? format(value.to, "yyyy-MM-dd") : ""}
          onChange={(e) => {
            const date = e.target.value ? new Date(e.target.value) : undefined
            onChange({ ...value, to: date })
          }}
          max={maxDate ? format(maxDate, "yyyy-MM-dd") : undefined}
          min={value.from ? format(value.from, "yyyy-MM-dd") : minDate ? format(minDate, "yyyy-MM-dd") : undefined}
          className="tap-target"
          aria-label="End date"
        />
      </div>
    </div>
  )
}

