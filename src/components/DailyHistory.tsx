import type { DailyLogEntry } from '../types'

interface DailyHistoryProps {
  entries: DailyLogEntry[]
}

const shortDate = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'numeric' })

export function DailyHistory({ entries }: DailyHistoryProps) {
  if (entries.length === 0) {
    return null
  }

  return (
    <div className="history-card">
      <div className="history-header">
        <h3>Historique récent</h3>
        <span>{entries.length} jours suivis</span>
      </div>
      <ul>
        {entries.slice(0, 7).map((entry) => {
          const nightHours = entry.sleep.nightHours ?? entry.sleep.totalHours ?? 0
          const napHours = entry.sleep.napHours ?? Math.max(0, (entry.sleep.totalHours ?? 0) - nightHours)
          return (
            <li key={entry.id} className="history-row">
              <div>
                <strong>{shortDate.format(new Date(entry.date))}</strong>
                <p className="history-mood">Humeur: {entry.mood}</p>
              </div>
              <div className="history-stats">
                <span>
                  {nightHours}h nuit · {napHours}h siestes
                </span>
                <span>{entry.meals.lunch}</span>
                {entry.evendolAssessments?.length > 0 && (
                  <span>EV {entry.evendolAssessments[entry.evendolAssessments.length - 1].totalScore}/15</span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
