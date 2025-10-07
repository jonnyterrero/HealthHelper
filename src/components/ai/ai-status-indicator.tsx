"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { Brain, Wifi, WifiOff } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface AIStatusIndicatorProps {
  className?: string
}

export function AIStatusIndicator({ className }: AIStatusIndicatorProps) {
  const [status, setStatus] = React.useState<'checking' | 'connected' | 'disconnected'>('checking')
  const [backendUrl, setBackendUrl] = React.useState<string>('')

  React.useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/ai/status')
      const data = await response.json()
      
      if (response.ok && data.status === 'connected') {
        setStatus('connected')
        setBackendUrl(data.url)
      } else {
        setStatus('disconnected')
        setBackendUrl(data.url || '')
      }
    } catch (error) {
      setStatus('disconnected')
    }
  }

  const statusConfig = {
    checking: {
      label: "Checking...",
      variant: "secondary" as const,
      icon: <Brain className="w-3 h-3 animate-pulse" />
    },
    connected: {
      label: "AI Connected",
      variant: "default" as const,
      icon: <Wifi className="w-3 h-3" />
    },
    disconnected: {
      label: "AI Offline",
      variant: "destructive" as const,
      icon: <WifiOff className="w-3 h-3" />
    }
  }

  const config = statusConfig[status]

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={config.variant} className={className}>
            {config.icon}
            <span className="ml-1">{config.label}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {status === 'connected' 
              ? `Python AI backend is running at ${backendUrl}`
              : status === 'disconnected'
              ? `Unable to connect to Python backend at ${backendUrl || 'unknown'}`
              : 'Checking AI backend status...'}
          </p>
          {status === 'disconnected' && (
            <p className="text-xs mt-1 text-yellow-500">
              Start the Python backend with: <code className="bg-black/20 px-1 rounded">python python-backend/api_server.py</code>
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

