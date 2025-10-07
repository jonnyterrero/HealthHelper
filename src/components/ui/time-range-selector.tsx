"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CalendarDays } from "lucide-react"

export type TimeRange = 7 | 14 | 30 | 90 | 180 | "custom"

interface TimeRangeSelectorProps {
  value: TimeRange
  onChange: (range: TimeRange) => void
  className?: string
  onCustomClick?: () => void
  showCustomButton?: boolean
}

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: 7, label: "7d" },
  { value: 14, label: "14d" },
  { value: 30, label: "30d" },
  { value: 90, label: "90d" },
  { value: 180, label: "180d" },
]

export function TimeRangeSelector({ 
  value, 
  onChange, 
  className,
  onCustomClick,
  showCustomButton = true 
}: TimeRangeSelectorProps) {
  return (
    <div className={cn("flex gap-1 flex-wrap", className)}>
      {TIME_RANGES.map((range) => (
        <Button
          key={range.value}
          variant={value === range.value ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(range.value as TimeRange)}
          className={cn(
            "h-8 px-3 text-xs tap-target touch-optimized",
            value === range.value && "shadow-sm"
          )}
          aria-pressed={value === range.value}
          aria-label={`View ${range.label} time range`}
        >
          {range.label}
        </Button>
      ))}
      {showCustomButton && (
        <Button
          variant={value === "custom" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            onChange("custom")
            onCustomClick?.()
          }}
          className={cn(
            "h-8 px-3 text-xs tap-target touch-optimized",
            value === "custom" && "shadow-sm"
          )}
          aria-pressed={value === "custom"}
          aria-label="Select custom date range"
        >
          <CalendarDays className="w-3 h-3 mr-1" />
          Custom
        </Button>
      )}
    </div>
  )
}

