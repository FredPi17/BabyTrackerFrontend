import type { DailyLogEntry } from '../types'
import { EVENDOL_CRITERIA } from '../types'

interface DailySummaryProps {
  entry: DailyLogEntry | null
  isLoading: boolean
}

const dateFormatter = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

export function DailySummary({ entry, isLoading }: DailySummaryProps) {
  if (isLoading) {
    return <div className="summary-card">Chargement du suivi en cours…</div>
  }

  if (!entry) {
    return (
      <div className="summary-card empty">
        <p>Aucun suivi disponible pour cette journée.</p>
        <p>Utilisez le formulaire pour enregistrer les premiers éléments.</p>
      </div>
    )
  }

  const latestEvendol = entry.evendolAssessments?.[entry.evendolAssessments.length - 1]
  const nightHours = entry.sleep.nightHours ?? entry.sleep.totalHours ?? 0
  const napHours = entry.sleep.napHours ?? Math.max(0, (entry.sleep.totalHours ?? 0) - nightHours)
  const evendolLevel = (score: number) => {
    if (score >= 7) {
      return { label: 'Élevé', slug: 'eleve' }
    }
    if (score >= 4) {
      return { label: 'Modéré', slug: 'modere' }
    }
    return { label: 'Faible', slug: 'faible' }
  }

  return (
    <div className="summary-card">
      <div className="summary-header">
        <div>
          <p className="summary-label">Suivi du {dateFormatter.format(new Date(entry.date))}</p>
          <h2>{entry.mood.toUpperCase()}</h2>
        </div>
        <div className="energy-indicator">
          <span>Énergie</span>
          <strong>{entry.energyLevel}/10</strong>
        </div>
      </div>

      <div className="summary-grid">
        <div>
          <span className="summary-label">Sommeil</span>
          <p>
            {nightHours} h nuit · {napHours} h siestes ({entry.sleep.naps} siestes)
          </p>
        </div>
        <div>
          <span className="summary-label">Repas</span>
          <p>{entry.meals.breakfast} · {entry.meals.lunch}</p>
        </div>
        <div>
          <span className="summary-label">Hygiène</span>
          <p>
            {entry.hygiene.diapers} changes · {entry.hygiene.baths} bain(s)
            {entry.hygiene.medications?.trim() ? (
              <>
                <br />
                <small>Médicaments : {entry.hygiene.medications}</small>
              </>
            ) : null}
          </p>
        </div>
      </div>

      {latestEvendol && (
        <div className="evendol-summary">
          <div>
            <span className="summary-label">Dernière évaluation EVENDOL ({latestEvendol.recordedAt})</span>
            <div className="evendol-score">
              <strong>{latestEvendol.totalScore}/15</strong>
              {(() => {
                const level = evendolLevel(latestEvendol.totalScore)
                return <span className={`badge severity-${level.slug}`}>{level.label}</span>
              })()}
            </div>
          </div>
          <div className="evendol-criteria-list">
            {EVENDOL_CRITERIA.map((criterion) => (
              <div key={criterion.id}>
                <span>{criterion.title}</span>
                <strong>{latestEvendol.criteria[criterion.id]}</strong>
              </div>
            ))}
          </div>
          {entry.evendolAssessments && entry.evendolAssessments.length > 1 && (
            <div className="evendol-timeline">
              {entry.evendolAssessments.map((assessment, index) => (
                <span key={`${entry.id}-ev-${index}`}>
                  {assessment.recordedAt} — {assessment.totalScore}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {entry.activities.length > 0 && (
        <div className="summary-activities">
          <span className="summary-label">Moments forts</span>
          <ul>
            {entry.activities.slice(0, 3).map((activity) => (
              <li key={`${entry.id}-${activity.time}-${activity.description}`}>
                <strong>{activity.time}</strong>
                <span>{activity.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {entry.notes && <p className="summary-notes">{entry.notes}</p>}
    </div>
  )
}
