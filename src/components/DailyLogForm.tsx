import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import type { CreateDailyLogDto, EvendolAssessment, EvendolCriteriaScores, EvendolCriterionId } from '../types'
import { EVENDOL_CRITERIA, MEAL_SLOTS } from '../types'

const MOOD_OPTIONS = ['joyeux', 'calme', 'excité', 'fatigué', 'grognon'] as const

const EVENDOL_SCORE_OPTIONS = [
  { value: 0, label: '0 — Signe absent' },
  { value: 1, label: '1 — Signe faible / passager' },
  { value: 2, label: '2 — Signe moyen / la moitié du temps' },
  { value: 3, label: '3 — Signe fort / quasi permanent' },
]

const emptyCriteria = (): EvendolCriteriaScores => ({
  vocal: 0,
  mimic: 0,
  movements: 0,
  positions: 0,
  relation: 0,
})

const computeEvendolTotal = (criteria: EvendolCriteriaScores) => Object.values(criteria).reduce((acc, val) => acc + val, 0)

const createEvendolAssessment = (time = '09:00'): EvendolAssessment => ({
  recordedAt: time,
  comment: '',
  criteria: emptyCriteria(),
  totalScore: 0,
})

const createInitialState = (date: string): CreateDailyLogDto => ({
  date,
  mood: 'calme',
  energyLevel: 5,
  meals: {
    breakfast: '',
    lunch: '',
    snack: '',
    dinner: '',
  },
  sleep: {
    naps: 0,
    totalHours: 0,
    nightHours: 0,
    napHours: 0,
    nightWakings: 0,
  },
  hygiene: {
    diapers: 0,
    baths: 0,
    medications: '',
  },
  activities: [{ time: '09:00', description: '' }],
  evendolAssessments: [createEvendolAssessment()],
  notes: '',
})

interface DailyLogFormProps {
  defaultDate: string
  onSubmit: (payload: CreateDailyLogDto) => Promise<void>
  isSubmitting: boolean
}

export function DailyLogForm({ defaultDate, onSubmit, isSubmitting }: DailyLogFormProps) {
  const [formState, setFormState] = useState<CreateDailyLogDto>(() => createInitialState(defaultDate))
  const [error, setError] = useState<string | null>(null)

  const updateSleep = (changes: Partial<CreateDailyLogDto['sleep']>) => {
    setFormState((prev) => {
      const nextSleep = {
        ...prev.sleep,
        ...changes,
      }
      nextSleep.nightHours = Math.max(0, nextSleep.nightHours ?? 0)
      nextSleep.napHours = Math.max(0, nextSleep.napHours ?? 0)
      nextSleep.totalHours = nextSleep.nightHours + nextSleep.napHours
      return { ...prev, sleep: nextSleep }
    })
  }

  useEffect(() => {
    setFormState((prev) => ({ ...prev, date: defaultDate }))
  }, [defaultDate])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const cleanedActivities = formState.activities
      .map((activity) => ({ ...activity, description: activity.description.trim() }))
      .filter((activity) => activity.description.length > 0)

    if (cleanedActivities.length === 0) {
      setError('Merci de renseigner au moins une activité avec une description.')
      return
    }

    const trimmedNotes = formState.notes?.trim() ?? ''

    const payload: CreateDailyLogDto = {
      ...formState,
      notes: trimmedNotes.length > 0 ? trimmedNotes : undefined,
      activities: cleanedActivities,
    }

    try {
      await onSubmit(payload)
      setFormState(createInitialState(defaultDate))
    } catch (err) {
      setError("Impossible d'enregistrer ces informations pour le moment.")
    }
  }

  const isSubmitDisabled = isSubmitting

  const updateAssessment = (index: number, updater: (assessment: EvendolAssessment) => EvendolAssessment) => {
    setFormState((prev) => {
      const evendolAssessments = [...(prev.evendolAssessments ?? [createEvendolAssessment()])]
      evendolAssessments[index] = updater(evendolAssessments[index])
      return { ...prev, evendolAssessments }
    })
  }

  const handleCriteriaChange = (index: number, criterion: EvendolCriterionId, score: number) => {
    updateAssessment(index, (assessment) => {
      const criteria = { ...assessment.criteria, [criterion]: score }
      return { ...assessment, criteria, totalScore: computeEvendolTotal(criteria) }
    })
  }

  const handleAssessmentFieldChange = (index: number, field: keyof EvendolAssessment, value: string) => {
    updateAssessment(index, (assessment) => ({
      ...assessment,
      [field]: value,
    }))
  }

  const addAssessment = () => {
    setFormState((prev) => ({
      ...prev,
      evendolAssessments: [...(prev.evendolAssessments ?? []), createEvendolAssessment()],
    }))
  }

  const removeAssessment = (index: number) => {
    setFormState((prev) => {
      const next = [...(prev.evendolAssessments ?? [])]
      next.splice(index, 1)
      return {
        ...prev,
        evendolAssessments: next.length > 0 ? next : [createEvendolAssessment()],
      }
    })
  }

  return (
    <form className="log-form" onSubmit={handleSubmit}>
      <header>
        <div>
          <p className="form-label">Jour suivi</p>
          <input
            type="date"
            value={formState.date}
            onChange={(event) => setFormState((prev) => ({ ...prev, date: event.target.value }))}
          />
        </div>
        <div>
          <p className="form-label">Humeur générale</p>
          <select
            value={formState.mood}
            onChange={(event) => setFormState((prev) => ({ ...prev, mood: event.target.value as CreateDailyLogDto['mood'] }))}
          >
            {MOOD_OPTIONS.map((mood) => (
              <option key={mood} value={mood}>
                {mood}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="form-row">
        <label className="form-label">Énergie</label>
        <input
          type="range"
          min={1}
          max={10}
          value={formState.energyLevel}
          onChange={(event) => setFormState((prev) => ({ ...prev, energyLevel: Number(event.target.value) }))}
        />
        <span className="range-value">{formState.energyLevel}/10</span>
      </div>

      <section>
        <h3>Repas</h3>
        <div className="grid-2">
          {MEAL_SLOTS.map((slot) => (
            <label key={slot} className="form-field">
              <span className="form-label">{slot}</span>
              <input
                type="text"
                value={formState.meals[slot]}
                placeholder="Détail du repas"
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    meals: { ...prev.meals, [slot]: event.target.value },
                  }))
                }
              />
            </label>
          ))}
        </div>
      </section>

      <section className="grid-2">
        <div className="form-field">
          <h3>Sommeil</h3>
          <div className="split">
            <label>
              <span className="form-label">Heures nuit</span>
              <input
                type="number"
                min={0}
                value={formState.sleep.nightHours}
                onChange={(event) => updateSleep({ nightHours: Number(event.target.value) })}
              />
            </label>
            <label>
              <span className="form-label">Heures siestes</span>
              <input
                type="number"
                min={0}
                value={formState.sleep.napHours}
                onChange={(event) => updateSleep({ napHours: Number(event.target.value) })}
              />
            </label>
            <label>
              <span className="form-label">Nombre de siestes</span>
              <input
                type="number"
                min={0}
                value={formState.sleep.naps}
                onChange={(event) => updateSleep({ naps: Number(event.target.value) })}
              />
            </label>
            <label>
              <span className="form-label">Réveils nocturnes</span>
              <input
                type="number"
                min={0}
                value={formState.sleep.nightWakings}
                onChange={(event) => updateSleep({ nightWakings: Number(event.target.value) })}
              />
            </label>
          </div>
          <p className="integration-helper small">Total estimé : {formState.sleep.totalHours} h</p>
        </div>

        <div className="form-field">
          <h3>Hygiène & santé</h3>
          <div className="split">
            <label>
              <span className="form-label">Changes</span>
              <input
                type="number"
                min={0}
                value={formState.hygiene.diapers}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    hygiene: { ...prev.hygiene, diapers: Number(event.target.value) },
                  }))
                }
              />
            </label>
            <label>
              <span className="form-label">Bains</span>
              <input
                type="number"
                min={0}
                value={formState.hygiene.baths}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    hygiene: { ...prev.hygiene, baths: Number(event.target.value) },
                  }))
                }
              />
            </label>
            <label>
              <span className="form-label">Médications</span>
              <input
                type="text"
                value={formState.hygiene.medications}
                placeholder="Vitamine D, etc."
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    hygiene: { ...prev.hygiene, medications: event.target.value },
                  }))
                }
              />
            </label>
          </div>
        </div>
      </section>

      <section>
        <div className="section-header">
          <h3>Activités clés</h3>
          <button
            type="button"
            onClick={() =>
              setFormState((prev) => ({
                ...prev,
                activities: [...prev.activities, { time: '00:00', description: '' }],
              }))
            }
          >
            + Ajouter
          </button>
        </div>

        {formState.activities.map((activity, index) => (
          <div key={index} className="activity-row">
            <input
              type="time"
              value={activity.time}
              onChange={(event) =>
                setFormState((prev) => {
                  const activities = [...prev.activities]
                  activities[index] = { ...activities[index], time: event.target.value }
                  return { ...prev, activities }
                })
              }
            />
            <input
              type="text"
              placeholder="Description"
              value={activity.description}
              onChange={(event) =>
                setFormState((prev) => {
                  const activities = [...prev.activities]
                  activities[index] = { ...activities[index], description: event.target.value }
                  return { ...prev, activities }
                })
              }
            />
          </div>
        ))}
      </section>

      <section>
        <div className="section-header">
          <h3>Évaluation EVENDOL (douleur)</h3>
          <button type="button" onClick={addAssessment}>
            + Nouvelle mesure
          </button>
        </div>

        {(formState.evendolAssessments ?? []).map((assessment, index) => (
          <div key={index} className="evendol-card">
            <div className="evendol-card-header">
              <label>
                <span className="form-label">Heure</span>
                <input
                  type="time"
                  value={assessment.recordedAt}
                  onChange={(event) => handleAssessmentFieldChange(index, 'recordedAt', event.target.value)}
                />
              </label>
              <div className="evendol-card-score">
                <span className="form-label">Score</span>
                <strong>{assessment.totalScore}/15</strong>
              </div>
              {(formState.evendolAssessments?.length ?? 0) > 1 && (
                <button type="button" className="ghost-button" onClick={() => removeAssessment(index)}>
                  Retirer
                </button>
              )}
            </div>

            <div className="evendol-criteria-grid">
              {EVENDOL_CRITERIA.map((criterion) => (
                <label key={criterion.id} className="evendol-criterion">
                  <span>{criterion.title}</span>
                  <small>{criterion.description}</small>
                  <select
                    value={assessment.criteria[criterion.id]}
                    onChange={(event) => handleCriteriaChange(index, criterion.id, Number(event.target.value))}
                  >
                    {EVENDOL_SCORE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>

            <label className="form-field">
              <span className="form-label">Commentaire (facultatif)</span>
              <input
                type="text"
                placeholder="Contexte, déclencheur…"
                value={assessment.comment ?? ''}
                onChange={(event) => handleAssessmentFieldChange(index, 'comment', event.target.value)}
              />
            </label>
          </div>
        ))}

        <p className="evendol-help">0 = signe absent · 1 = faible · 2 = moyen · 3 = fort/quasi permanent</p>
      </section>

      <section>
        <h3>Notes</h3>
        <textarea
          rows={4}
          placeholder="Moments importants, humeur, besoins spécifiques…"
          value={formState.notes ?? ''}
          onChange={(event) => setFormState((prev) => ({ ...prev, notes: event.target.value }))}
        />
        {error && <p className="form-error">{error}</p>}
      </section>

      <button className="primary" type="submit" disabled={isSubmitDisabled}>
        {isSubmitting ? 'Enregistrement…' : 'Sauvegarder la journée'}
      </button>
    </form>
  )
}
