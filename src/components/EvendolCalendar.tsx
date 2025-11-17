import { useEffect, useMemo, useState } from 'react'
import type { DailyLogEntry } from '../types'

interface EvendolCalendarProps {
  entries: DailyLogEntry[]
  selectedDate: string
  onSelectDate: (date: string) => void
}

const dayFormatter = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' })
const monthFormatter = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })

const todayIso = () => new Date().toISOString().split('T')[0]

const severityFromScore = (score: number | null) => {
  if (score === null) {
    return 'none' as const
  }
  if (score >= 7) return 'eleve'
  if (score >= 4) return 'modere'
  return 'faible'
}

const buildMonthMatrix = (reference: Date) => {
  const year = reference.getFullYear()
  const month = reference.getMonth()
  const firstDay = new Date(year, month, 1)
  const firstWeekday = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: Array<{ date: string | null }> = []

  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push({ date: null })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const iso = new Date(year, month, day).toISOString().split('T')[0]
    cells.push({ date: iso })
  }

  while (cells.length % 7 !== 0) {
    cells.push({ date: null })
  }

  const weeks: Array<typeof cells> = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }

  return weeks
}

const getLatestScoreForDate = (entry?: DailyLogEntry) => {
  if (!entry || !entry.evendolAssessments || entry.evendolAssessments.length === 0) {
    return null
  }
  return entry.evendolAssessments[entry.evendolAssessments.length - 1].totalScore
}

export function EvendolCalendar({ entries, selectedDate, onSelectDate }: EvendolCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date(selectedDate ?? todayIso()))

  useEffect(() => {
    setCurrentMonth(new Date(selectedDate))
  }, [selectedDate])

  const entryByDate = useMemo(() => {
    const map = new Map<string, DailyLogEntry>()
    entries.forEach((entry) => {
      map.set(entry.date, entry)
    })
    return map
  }, [entries])

  const weeks = useMemo(() => buildMonthMatrix(currentMonth), [currentMonth])
  const monthLabel = monthFormatter.format(currentMonth)

  const handleMonthChange = (delta: number) => {
    setCurrentMonth((prev) => {
      const next = new Date(prev)
      next.setMonth(prev.getMonth() + delta)
      return next
    })
  }

  return (
    <section className="evendol-calendar">
      <header>
        <button type="button" onClick={() => handleMonthChange(-1)} aria-label="Mois précédent">
          ◀
        </button>
        <h3>{monthLabel}</h3>
        <button type="button" onClick={() => handleMonthChange(1)} aria-label="Mois suivant">
          ▶
        </button>
      </header>

      <div className="calendar-grid">
        {Array.from({ length: 7 }).map((_, index) => {
          const date = new Date(2023, 0, index + 2)
          return (
            <div key={`weekday-${index}`} className="calendar-weekday">
              {dayFormatter.format(date).replace('.', '')}
            </div>
          )
        })}

        {weeks.flat().map((cell, idx) => {
          if (!cell.date) {
            return <div key={`empty-${idx}`} className="calendar-cell empty" />
          }
          const entry = entryByDate.get(cell.date)
          const score = getLatestScoreForDate(entry)
          const severity = severityFromScore(score)
          const isSelected = cell.date === selectedDate
          return (
            <button
              key={cell.date}
              type="button"
              className={`calendar-cell ${severity} ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectDate(cell.date!)}
            >
              <span className="calendar-day-number">{new Date(cell.date).getDate()}</span>
              {score !== null && <span className="calendar-score">{score}</span>}
            </button>
          )
        })}
      </div>

      <div className="calendar-legend">
        <span>
          <span className="dot none" />Aucune mesure
        </span>
        <span>
          <span className="dot faible" />Score faible (0-3)
        </span>
        <span>
          <span className="dot modere" />Score modéré (4-6)
        </span>
        <span>
          <span className="dot eleve" />Score élevé (7-15)
        </span>
      </div>
    </section>
  )
}
