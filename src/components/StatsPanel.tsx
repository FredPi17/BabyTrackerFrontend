import type { DailyLogEntry } from '../types'

interface StatsPanelProps {
  entries: DailyLogEntry[]
}

const shortFormatter = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric' })

export function StatsPanel({ entries }: StatsPanelProps) {
  if (!entries.length) {
    return <p>Aucune donnée disponible pour le moment.</p>
  }

  const recent = [...entries]
    .filter((entry) => entry.sleep.totalHours > 0)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7)
    .reverse()

  const avgNight = average(entries.map((entry) => entry.sleep.nightHours ?? entry.sleep.totalHours ?? 0))
  const avgNap = average(entries.map((entry) => entry.sleep.napHours ?? 0))
  const avgDiapers = average(entries.map((entry) => entry.hygiene.diapers ?? 0))

  const maxSleep = Math.max(...recent.map((entry) => entry.sleep.totalHours ?? 0), 1)

  return (
    <div className="stats-panel">
      <div className="stats-grid">
        <StatCard title="Sommeil nuit" value={`${avgNight.toFixed(1)} h`} description="Moyenne sur l’ensemble des jours" />
        <StatCard title="Sommeil siestes" value={`${avgNap.toFixed(1)} h`} description="Moyenne journalière" />
        <StatCard title="Changes" value={`${avgDiapers.toFixed(1)}`} description="Nombre moyen par jour" />
      </div>

      <div className="stats-chart">
        <div className="stats-chart-header">
          <div>
            <p className="summary-label">Histogramme sommeil total (7 derniers jours)</p>
            <small>Chaque barre représente le nombre total d’heures de sommeil</small>
          </div>
        </div>
        <div className="stats-chart-bars">
          {recent.map((entry) => {
            const height = Math.max(10, (entry.sleep.totalHours / maxSleep) * 100)
            return (
              <div key={entry.id} className="stats-bar">
                <div className="stats-bar-fill" style={{ height: `${height}%` }}>
                  <span>{entry.sleep.totalHours}h</span>
                </div>
                <p>{shortFormatter.format(new Date(entry.date))}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <article className="stat-card">
      <p className="summary-label">{title}</p>
      <strong>{value}</strong>
      <small>{description}</small>
    </article>
  )
}

function average(values: number[]) {
  if (!values.length) {
    return 0
  }
  const sum = values.reduce((acc, value) => acc + (value || 0), 0)
  return sum / values.length
}
