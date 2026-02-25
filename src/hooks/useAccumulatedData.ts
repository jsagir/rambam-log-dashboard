import { useState, useEffect } from 'react'
import type { AccumulatedData } from '@/types/dashboard'

interface UseAccumulatedResult {
  data: AccumulatedData | null
  loading: boolean
  error: string | null
}

export function useAccumulatedData(): UseAccumulatedResult {
  const [data, setData] = useState<AccumulatedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/data/accumulated.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((json) => {
        setData(json as AccumulatedData)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return { data, loading, error }
}
