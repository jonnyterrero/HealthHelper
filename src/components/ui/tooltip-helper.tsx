"use client"

import React from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { HelpCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface TooltipHelperProps {
  content: string | React.ReactNode
  children?: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  icon?: "help" | "info" | "none"
  iconClassName?: string
  delayDuration?: number
}

export function TooltipHelper({
  content,
  children,
  side = "top",
  icon = "help",
  iconClassName,
  delayDuration = 200
}: TooltipHelperProps) {
  const Icon = icon === "help" ? HelpCircle : icon === "info" ? Info : null

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild className="cursor-help">
          {children ? (
            <span className="inline-flex items-center gap-1">
              {children}
            </span>
          ) : Icon ? (
            <button
              type="button"
              className={cn(
                "inline-flex items-center justify-center",
                "text-muted-foreground hover:text-foreground",
                "transition-colors touch-optimized tap-target",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full",
                iconClassName
              )}
              aria-label="Help"
            >
              <Icon className="w-4 h-4" />
            </button>
          ) : null}
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className="max-w-xs text-sm z-50 bg-popover/95 backdrop-blur-sm border-border/50"
        >
          <p className="leading-relaxed">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface InfoTooltipProps {
  label: string
  description: string
  side?: "top" | "right" | "bottom" | "left"
}

export function InfoTooltip({ label, description, side = "top" }: InfoTooltipProps) {
  return (
    <div className="inline-flex items-center gap-2">
      <span>{label}</span>
      <TooltipHelper content={description} side={side} icon="info" />
    </div>
  )
}

