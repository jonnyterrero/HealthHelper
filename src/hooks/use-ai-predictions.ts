import React from "react"
import { aiClient, PredictionResponse } from "@/lib/ai-client"

export interface UseAIPredictionsOptions {
  userId: string
  date: string
  enabled?: boolean
}

export interface UseAIPredictionsReturn {
  predictions: PredictionResponse | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useAIPredictions({ 
  userId, 
  date, 
  enabled = true 
}: UseAIPredictionsOptions): UseAIPredictionsReturn {
  const [predictions, setPredictions] = React.useState<PredictionResponse | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const fetchPredictions = React.useCallback(async () => {
    if (!enabled || !userId || !date) return

    setLoading(true)
    setError(null)

    try {
      const data = await aiClient.getPredictions({ user_id: userId, date })
      setPredictions(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch predictions'
      setError(errorMessage)
      console.error('Error fetching predictions:', err)
    } finally {
      setLoading(false)
    }
  }, [userId, date, enabled])

  React.useEffect(() => {
    fetchPredictions()
  }, [fetchPredictions])

  return {
    predictions,
    loading,
    error,
    refetch: fetchPredictions
  }
}

export function useAIIngest() {
  const [ingesting, setIngesting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const ingestData = React.useCallback(async (
    userId: string,
    dataType: string,
    data: Record<string, any>
  ) => {
    setIngesting(true)
    setError(null)

    try {
      await aiClient.ingestData({
        user_id: userId,
        data_type: dataType as any,
        data
      })
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to ingest data'
      setError(errorMessage)
      console.error('Error ingesting data:', err)
      return false
    } finally {
      setIngesting(false)
    }
  }, [])

  return {
    ingestData,
    ingesting,
    error
  }
}

