"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react"

export interface PredictionData {
  predictions: Record<string, number>
  confidence: Record<string, number>
  recommendations: string[]
  explanations?: Record<string, Record<string, number>>
}

interface PredictionCardProps {
  data: PredictionData | null
  loading?: boolean
  error?: string | null
}

export function PredictionCard({ data, loading, error }: PredictionCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 animate-pulse" />
            AI Predictions
          </CardTitle>
          <CardDescription>Analyzing your health patterns...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded" />
                <div className="h-2 bg-muted animate-pulse rounded w-3/4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Predictions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return null
  }

  const getRiskLevel = (risk: number): { label: string; color: string; icon: React.ReactNode } => {
    if (risk < 0.3) return { label: "Low", color: "text-green-600 dark:text-green-400", icon: <CheckCircle className="w-4 h-4" /> }
    if (risk < 0.6) return { label: "Moderate", color: "text-yellow-600 dark:text-yellow-400", icon: <TrendingUp className="w-4 h-4" /> }
    return { label: "High", color: "text-red-600 dark:text-red-400", icon: <AlertTriangle className="w-4 h-4" /> }
  }

  const targets = {
    gut: { label: "Digestive Health", emoji: "🫃" },
    skin: { label: "Skin Health", emoji: "🧴" },
    mood: { label: "Mood", emoji: "😊" },
    stress: { label: "Stress", emoji: "🧘" }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          AI Risk Predictions
        </CardTitle>
        <CardDescription>Personalized health insights based on your patterns</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Risk Scores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(data.predictions).map(([target, risk]) => {
            const riskInfo = getRiskLevel(risk)
            const targetInfo = targets[target as keyof typeof targets] || { label: target, emoji: "📊" }
            const confidence = data.confidence[target] || 0.8

            return (
              <div key={target} className="space-y-2 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{targetInfo.emoji}</span>
                    <span className="font-medium">{targetInfo.label}</span>
                  </div>
                  <div className={`flex items-center gap-1 ${riskInfo.color}`}>
                    {riskInfo.icon}
                    <Badge variant="outline" className={riskInfo.color}>
                      {riskInfo.label}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Risk Level</span>
                    <span className="font-medium">{(risk * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={risk * 100} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Confidence: {(confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Recommendations */}
        {data.recommendations && data.recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Recommendations
            </h4>
            <ul className="space-y-2">
              {data.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Feature Explanations (SHAP-like) */}
        {data.explanations && Object.keys(data.explanations).length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-muted-foreground">
              Key Factors
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(data.explanations).slice(0, 1).map(([target, features]) => (
                <div key={target} className="text-xs space-y-1">
                  {Object.entries(features)
                    .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
                    .slice(0, 3)
                    .map(([feature, value]) => (
                      <div key={feature} className="flex items-center justify-between">
                        <span className="text-muted-foreground capitalize">
                          {feature.replace(/_/g, " ")}
                        </span>
                        <span className={value > 0 ? "text-red-500" : "text-green-500"}>
                          {value > 0 ? "▲" : "▼"} {Math.abs(value).toFixed(2)}
                        </span>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground pt-2 border-t">
          <p>💡 Predictions are based on your historical patterns and may not reflect all health factors. Consult healthcare professionals for medical advice.</p>
        </div>
      </CardContent>
    </Card>
  )
}

