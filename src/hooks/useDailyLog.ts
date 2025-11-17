import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { MOCK_LOGS } from '../data/mockLogs'
import type { CreateDailyLogDto, DailyLogEntry } from '../types'

const todayIso = () => new Date().toISOString().split('T')[0]

const withDefaults = (entry: DailyLogEntry): DailyLogEntry => ({
  ...entry,
  evendolAssessments: entry.evendolAssessments ?? [],
  notes: entry.notes ?? '',
})

const sortByDateDesc = (entries: DailyLogEntry[]) =>
  [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))

export function useDailyLog() {
  const [entries, setEntries] = useState<DailyLogEntry[]>([])
  const [selectedDate, setSelectedDate] = useState<string>(() => todayIso())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const data = await api.fetchLogs()
        setEntries(sortByDateDesc(data.map(withDefaults)))
        setError(null)
      } catch (err) {
        console.warn('API indisponible, utilisation des données mock.', err)
        setEntries(sortByDateDesc(MOCK_LOGS.map(withDefaults)))
        setError('API indisponible, données fictives affichées')
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  const createEntry = useCallback(async (payload: CreateDailyLogDto) => {
    setIsSaving(true)
    try {
      const entry = await api.createLog(payload)
      setEntries((prev) => sortByDateDesc([withDefaults(entry), ...prev.filter((item) => item.id !== entry.id)]))
      setError(null)
    } catch (err) {
      console.error('Impossible de créer le suivi, insertion locale', err)
      const fallback: DailyLogEntry = {
        ...payload,
        id: `local-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 10)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        evendolAssessments: payload.evendolAssessments ?? [],
        notes: payload.notes ?? '',
      }
      setEntries((prev) => sortByDateDesc([fallback, ...prev]))
      setError('Sauvegarde locale uniquement (API non disponible)')
    } finally {
      setIsSaving(false)
    }
  }, [])

  const entriesForDate = useMemo(
    () => entries.filter((entry) => entry.date === selectedDate),
    [entries, selectedDate],
  )

  const latestEntry = entriesForDate[0] ?? entries[0] ?? null

  return {
    entries,
    entriesForDate,
    latestEntry,
    selectedDate,
    setSelectedDate,
    isLoading,
    isSaving,
    error,
    createEntry,
  }
}
